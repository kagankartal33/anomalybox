import { evaluateIdeaCardV22, QUALITY_GATE_VERSION } from "../../../lib/idea-card/quality-v2-2.ts";
import { hasEarlySponsorDisclosure, needsSponsorDisclosure, privacySafetyFlags } from "../../../lib/idea-card/content-safety.ts";
import { generateStructured, ModelProviderError, type ModelProviderProfile } from "../../../lib/generation/model-provider-adapter.ts";
import { CARD_TRAINING_VERSION, CARD_WRITER_SYSTEM, CARD_CRITIC_SYSTEM, buildCardTrainingContext, cardDraftPrompt, trainingPrompt } from "../../../lib/generation/card-training.ts";
import {
  PROMPT_VERSION,
  conceptSetJsonSchema,
  conceptSetSchema,
  criticResultJsonSchema,
  criticResultSchema,
  generatedIdeaEnvelopeSchema,
  ideaCardJsonSchema,
} from "../../../lib/generation/contracts.ts";
import { ideaCardSchema } from "../../../lib/idea-card/schema.ts";
import { adaptLegacyIdeaCard } from "../../../lib/idea-card/adapt-legacy.ts";
import {
  candidateStatusForQualityDecision,
  schemaV2BrandSafetyScore,
  type QualityDecision,
} from "../../../lib/idea-card/review-policy.ts";
import { criticMatchesQualificationContract, profileMatchesQualificationContract } from "../../../lib/generation/qualification.ts";
import { CONCEPT_RANKER_VERSION, rankConceptPlans } from "../../../lib/generation/concept-ranking.ts";
import { generationQualityContext } from "../../../lib/generation/stock-audit-context.ts";
import type { IdeaCard } from "../../../lib/idea-card/types.ts";
import { AUTOMATIC_POLICY_VERSION, GENERATION_PIPELINE_VERSION, SEMANTIC_DOCUMENT_VERSION, automaticGenerationBlockers, cardContentHash, cardSnapshot, criticPassed, independentCritic, modelContract, publicationBlockers, semanticDocument, sha256, stableJson } from "../../../lib/generation/automatic-policy.ts";
import {
  analyzeDurationDistribution,
  buildProductionEstimate,
  planCardDuration,
  plannedRuntimeProfile,
  runtimeProfileForSeconds,
  timingFingerprint,
  type DurationPlanningConcept,
} from "../../../lib/idea-card/duration-planner.ts";
import {
  CREATIVE_TAXONOMY_VERSION,
  CREATIVE_SCHEDULER_VERSION,
  analyzeCreativeDistribution,
  creativeDirectionForRecipe,
  creativeRecipeId,
  creativeRecipeSchema,
  scheduleCreativeRecipes,
  validateRecipeSet,
  type CreativeRecipe,
} from "../../../lib/generation/creative-taxonomy.ts";
import type { PurchaseLane } from "../../../lib/algorithmic-reason/types.ts";

type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("LOCAL_SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("LOCAL_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase URL and service role key are required");
}

function codeWord(codes: number[]) {
  return String.fromCharCode(...codes);
}

function codePhrase(words: number[][]) {
  return words.map(codeWord).join("\\s+");
}

const legacyDecisionFilterPattern = new RegExp(`\\bpremium\\s+${codePhrase([[107, 97, 114, 97, 114], [102, 105, 108, 116, 114, 101, 115, 105]])}\\b`, "i");
const legacyCreatorLeakPattern = new RegExp(
  `\\b(${[
    codeWord([66, 117, 103, 117, 110]),
    codeWord([103, 111, 115, 116, 101, 114, 105, 114]),
    codeWord([103, 111, 115, 116, 101, 114]),
    codeWord([103, 117, 118, 101, 110, 108, 105]),
    codePhrase([[107, 101, 115, 105, 110], [99, 111, 122, 117, 109]]),
    codePhrase([[104, 101, 114, 107, 101, 115, 116, 101], [97, 121, 110, 105], [115, 111, 110, 117, 99, 117], [118, 101, 114, 105, 114]]),
    codePhrase([[99, 97, 112, 116, 105, 111, 110], [118, 101], [118, 105, 100, 101, 111], [98, 97, 115, 105, 110, 100, 97]]),
    codePhrase([[107, 97, 114, 97, 114], [102, 105, 108, 116, 114, 101, 115, 105]]),
  ].join("|")})\\b`,
  "i",
);

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function requireAdmin(req: Request) {
  const expected = Deno.env.get("ADMIN_API_TOKEN") ?? Deno.env.get("INTERNAL_API_TOKEN");
  if (!expected) {
    throw new HttpError(500, "ADMIN_API_TOKEN or INTERNAL_API_TOKEN is not configured");
  }

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = req.headers.get("x-admin-token") ?? bearer;
  if (token !== expected) {
    throw new HttpError(401, "Unauthorized admin request");
  }
}

function restHeaders(prefer = "return=representation") {
  return {
    apikey: serviceRoleKey!,
    authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
}

async function rest(path: string, init: RequestInit = {}, prefer?: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...restHeaders(prefer),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new HttpError(res.status, "Supabase REST request failed", data);
  }

  return data;
}

async function getRows(table: string, query: string) {
  return await rest(`${table}?${query}`, { method: "GET" });
}

async function postRows(tableOrPath: string, payload: unknown, prefer = "return=representation") {
  return await rest(tableOrPath, {
    method: "POST",
    body: JSON.stringify(payload),
  }, prefer);
}

async function patchRows(table: string, query: string, payload: unknown) {
  return await rest(`${table}?${query}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function deleteRows(table: string, query: string) {
  return await rest(`${table}?${query}`, { method: "DELETE" }, "return=minimal");
}

async function getPagedRows(table: string, query: string, pageSize = 1000) {
  const rows: Json[] = [];
  let offset = 0;

  while (true) {
    const page = await getRows(table, `${query}&limit=${pageSize}&offset=${offset}`) as Json[];
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function lookupBySlug(table: string, slug: string) {
  const rows = await getRows(
    table,
    `select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  ) as Json[];

  if (!rows.length) {
    throw new HttpError(400, `${table} slug not found: ${slug}`);
  }

  return rows[0];
}

async function lookupById(table: string, id: string) {
  const rows = await getRows(table, `select=id,slug&id=eq.${id}&limit=1`) as Json[];
  if (!rows.length) {
    throw new HttpError(400, `${table} id not found: ${id}`);
  }

  return rows[0];
}

async function lookupCategoryById(id: string) {
  const rows = await getRows("categories", `select=id,slug,family,risk_level,metadata&id=eq.${id}&limit=1`) as Json[];
  if (!rows.length) {
    throw new HttpError(400, `categories id not found: ${id}`);
  }

  return rows[0];
}

type CategoryLayerPolicy = {
  policy_slug: string;
  scope_type: string;
  category_slug?: string | null;
  category_family?: string | null;
  platform: string;
  required_layers: string[];
  optional_layers: string[];
  premium_layers: string[];
  restricted_layers: string[];
  practical_effects: Json;
  generator_instructions: string[];
  quality_rules: Json;
  metadata: Json;
};

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map(String).filter((item) => item.trim().length > 0)
    : [];
}

function jsonObject(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
}

function defaultLayerPolicy(categorySlug: string, platform: string): CategoryLayerPolicy {
  return {
    policy_slug: "runtime_default_layer_policy",
    scope_type: "fallback",
    category_slug: categorySlug,
    category_family: null,
    platform,
    required_layers: [
      "brand_lift_layer",
      "creator_style_adapter",
      "scene_energy_curve_layer",
      "risk_reputation_layer",
      "platform_conversion_layer",
    ],
    optional_layers: [
      "audience_identity_layer",
      "comment_trigger_layer",
      "save_worthy_utility_layer",
      "relatability_break_layer",
    ],
    premium_layers: [
      "status_shift_layer",
      "proof_without_boring_layer",
      "sponsor_softness_layer",
    ],
    restricted_layers: [],
    practical_effects: {
      summary: "Runtime fallback premium creator layer policy.",
      creator_visible: false,
    },
    generator_instructions: [
      "Include category_layer_pack with applied_layers and practical_effects for every required layer.",
    ],
    quality_rules: {
      min_required_layer_coverage: 1,
      premium_bonus_layers_min: 2,
      missing_required_decision: "refine",
      creator_visible: false,
    },
    metadata: { creator_visible: false },
  };
}

function normalizeLayerPolicy(row: Json | undefined, categorySlug: string, platform: string): CategoryLayerPolicy {
  if (!row) return defaultLayerPolicy(categorySlug, platform);
  return {
    policy_slug: String(row.policy_slug ?? "runtime_default_layer_policy"),
    scope_type: String(row.scope_type ?? "fallback"),
    category_slug: row.category_slug === null || row.category_slug === undefined ? null : String(row.category_slug),
    category_family: row.category_family === null || row.category_family === undefined ? null : String(row.category_family),
    platform: String(row.platform ?? platform),
    required_layers: stringArray(row.required_layers),
    optional_layers: stringArray(row.optional_layers),
    premium_layers: stringArray(row.premium_layers),
    restricted_layers: stringArray(row.restricted_layers),
    practical_effects: (row.practical_effects ?? {}) as Json,
    generator_instructions: stringArray(row.generator_instructions),
    quality_rules: (row.quality_rules ?? {}) as Json,
    metadata: (row.metadata ?? {}) as Json,
  };
}

async function lookupCategoryLayerPolicy(categorySlug: string, categoryFamily: string | null | undefined, platform: string) {
  const encodedPlatform = encodeURIComponent(platform);
  const exact = await getRows(
    "category_layer_policies",
    `select=*&enabled=eq.true&scope_type=eq.category&category_slug=eq.${encodeURIComponent(categorySlug)}&platform=eq.${encodedPlatform}&limit=1`,
  ) as Json[];
  if (exact.length) return normalizeLayerPolicy(exact[0], categorySlug, platform);

  if (categoryFamily) {
    const family = await getRows(
      "category_layer_policies",
      `select=*&enabled=eq.true&scope_type=eq.family&category_family=eq.${encodeURIComponent(categoryFamily)}&platform=eq.${encodedPlatform}&limit=1`,
    ) as Json[];
    if (family.length) return normalizeLayerPolicy(family[0], categorySlug, platform);
  }

  const fallback = await getRows(
    "category_layer_policies",
    `select=*&enabled=eq.true&scope_type=eq.fallback&platform=eq.${encodedPlatform}&limit=1`,
  ) as Json[];

  return normalizeLayerPolicy(fallback[0], categorySlug, platform);
}

/** Map product/store slugs onto training affinity scopes (exact_category hits). */
function resolveTrainingScopeSlug(categorySlug: string): string {
  const raw = String(categorySlug ?? "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    comedy: "entertainment_comedy",
    entertainment: "entertainment_comedy",
    humor: "entertainment_comedy",
    funny: "entertainment_comedy",
    fitness: "fitness_wellness_safe",
    wellness: "fitness_wellness_safe",
    gym: "fitness_wellness_safe",
    health: "fitness_wellness_safe",
  };
  return aliases[raw] ?? raw;
}

async function trainingProfileForScope(categorySlug: string, platform: string, limit = 16) {
  const scopeSlug = resolveTrainingScopeSlug(categorySlug);
  return await rest("rpc/training_profile_for_scope", {
    method: "POST",
    body: JSON.stringify({
      p_category_slug: scopeSlug,
      p_platform: platform,
      p_limit: Math.max(1, Math.min(limit, 50)),
    }),
  }) as Json[];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveBatch(idOrExternalId: string) {
  const filter = isUuid(idOrExternalId)
    ? `id=eq.${idOrExternalId}`
    : `external_batch_id=eq.${encodeURIComponent(idOrExternalId)}`;

  const rows = await getRows("idea_generation_batches", `select=*&${filter}&limit=1`) as Json[];
  if (!rows.length) {
    throw new HttpError(404, `generation batch not found: ${idOrExternalId}`);
  }

  return rows[0];
}

function routeSegments(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const fnIndex = parts.indexOf("admin-generation-batches");
  if (fnIndex >= 0) return parts.slice(fnIndex + 1);

  const adminIndex = parts.indexOf("admin");
  if (adminIndex >= 0) return parts.slice(adminIndex);

  return parts;
}

async function createBatch(body: Json) {
  const manifest = (body.manifest as Json | undefined) ?? body;
  const categorySlug = String(body.category_slug ?? manifest.category_slug ?? "");
  const personaSlug = String(body.persona_slug ?? manifest.persona_slug ?? "");

  if (!categorySlug || !personaSlug) {
    throw new HttpError(400, "category_slug and persona_slug are required");
  }

  const category = await lookupBySlug("categories", categorySlug);
  const persona = await lookupBySlug("creator_personas", personaSlug);
  const externalBatchId = String(
    body.external_batch_id ?? manifest.batch_id ??
      `batch_${new Date().toISOString().slice(0, 10).replaceAll("-", "_")}_${categorySlug}_${personaSlug}`,
  );

  const payload = {
    external_batch_id: externalBatchId,
    category_id: category.id,
    persona_id: persona.id,
    target_count: Number(body.target_count ?? manifest.target_count ?? 1000),
    language: String(body.language ?? manifest.language ?? "tr"),
    platform: String(body.platform ?? manifest.platform ?? "instagram_reels"),
    generator_version: String(body.generator_version ?? manifest.generator_version ?? "1.0.0"),
    source_mode: body.source_mode === "jsonl_import" ? "jsonl_import" : "admin_direct",
    status: "draft",
    manifest,
  };

  const inserted = await postRows("idea_generation_batches", payload) as Json[];
  return inserted[0];
}

type IdeaRow = {
  payload: Json;
  source_file?: string;
  line_number?: number;
  raw_line?: string;
};

function ideaRowsFromBody(body: Json) {
  const rows: IdeaRow[] = [];
  const directIdeas = Array.isArray(body.ideas) ? body.ideas as Json[] : [];
  for (const idea of directIdeas) {
    rows.push({ payload: idea, source_file: "direct_payload" });
  }

  const files = ((body.files ?? body.jsonl_files) as Array<{ name?: string; file_name?: string; content?: string }> | undefined) ?? [];
  for (const file of files) {
    const fileName = file.name ?? file.file_name ?? "ideas.jsonl";
    const lines = String(file.content ?? "").split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        rows.push({
          payload: JSON.parse(trimmed),
          source_file: fileName,
          line_number: index + 1,
          raw_line: trimmed,
        });
      } catch {
        rows.push({
          payload: { __parse_error: true },
          source_file: fileName,
          line_number: index + 1,
          raw_line: trimmed,
        });
      }
    });
  }

  return rows;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

const creatorHiddenKeys = new Set([
  "score",
  "scores",
  "score_band",
  "assigned_band",
  "internal_rank_score",
  "viral_potential_score",
  "psychology_fit_score",
  "human_awareness_score",
  "feasibility_score",
  "novelty_score",
  "comedy_remix_fit",
  "demand_opportunity_score",
  "saturation_penalty",
  "trust_sustainability_score",
  "reuse_count",
  "max_reuse_count",
  "inventory_id",
  "policy_slug",
  "quality_rules",
]);

function findCreatorHiddenKeys(value: unknown, path = "idea_card"): string[] {
  if (!value || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findCreatorHiddenKeys(item, `${path}[${index}]`));
  }

  const matches: string[] = [];
  for (const [key, child] of Object.entries(value as Json)) {
    const nextPath = `${path}.${key}`;
    if (creatorHiddenKeys.has(key)) matches.push(nextPath);
    matches.push(...findCreatorHiddenKeys(child, nextPath));
  }

  return matches;
}

const creatorFacingLeakPatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /Quality Gate/i, label: "Quality Gate/internal evaluator wording" },
  { pattern: /\brun_\d{8}_\d{6}_[a-z0-9_]+/i, label: "raw generator run id" },
  { pattern: /\{(product_name|audience_pain|daily_context|signature_phrase|[a-z]+_[a-z0-9_]+)\}/i, label: "raw creator template placeholder" },
  { pattern: legacyDecisionFilterPattern, label: "legacy non-English technical wording" },
  { pattern: /\b(score|score_band|internal_score|assigned_band|inventory|content_hash|dataset|training source|training profile)\b/i, label: "internal score/training language" },
];

const lowQualityTitlePattern =
  /\b(Brief|Ritual|Report|Memo|Audit|Dossier|File|Sheet|SOP|Framework|Blueprint|AI|Algorithm|Engine|Model|Prompt|Agent|Neural|Autopilot|System|Quality Gate|score|score_band|training|dataset|inventory)\b|run_\d{8}_\d{6}|\b\d{3,}\b/i;

const englishCreatorTextPatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00c7\u011e\u0130\u00d6\u015e\u00dc]/, label: "non-English creator-facing text" },
  { pattern: legacyCreatorLeakPattern, label: "legacy non-English creator-facing text" },
];

function findCreatorFacingLeaks(value: unknown, requireEnglish: boolean, path = "idea_card"): string[] {
  if (path.includes(".personalization_slots")) return [];
  if (typeof value === "string") {
    const patterns = requireEnglish ? [...creatorFacingLeakPatterns, ...englishCreatorTextPatterns] : creatorFacingLeakPatterns;
    return patterns
      .filter(({ pattern }) => pattern.test(value))
      .map(({ label }) => `${path} (${label})`);
  }

  if (!value || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findCreatorFacingLeaks(item, requireEnglish, `${path}[${index}]`));
  }

  return Object.entries(value as Json).flatMap(([key, child]) => findCreatorFacingLeaks(child, requireEnglish, `${path}.${key}`));
}

function hasNonEmptyText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyArray(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function titleQualityErrors(value: unknown, path: string) {
  const errors: string[] = [];
  if (typeof value !== "string" || value.trim().length < 3) {
    errors.push(`${path} is required`);
    return errors;
  }
  const title = value.trim();
  if (title.length > 52) errors.push(`${path} must be 52 characters or shorter`);
  if (lowQualityTitlePattern.test(title)) {
    errors.push(`${path} uses technical, AI, document-style, or internal title language`);
  }
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  if (wordCount < 3 || wordCount > 7) {
    errors.push(`${path} should be 3-7 words`);
  }
  return errors;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function appliedLayersFromCard(card: Json) {
  const pack = card.category_layer_pack as Json | undefined;
  return uniqueStrings(stringArray(pack?.applied_layers));
}

function layerPracticalEffectExists(effects: unknown, layer: string) {
  if (!effects || typeof effects !== "object" || Array.isArray(effects)) return false;
  const value = (effects as Json)[layer];
  if (hasNonEmptyText(value)) return true;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return objectText(value).trim().length > 0;
  }
  return false;
}

function validateCategoryLayerPack(card: Json, layerPolicy: CategoryLayerPolicy) {
  const errors: string[] = [];
  const pack = card.category_layer_pack as Json | undefined;
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    return ["idea_card.category_layer_pack is required"];
  }

  const appliedLayers = appliedLayersFromCard(card);
  if (!appliedLayers.length) {
    errors.push("idea_card.category_layer_pack.applied_layers must include category policy layers");
  }

  const missingRequired = layerPolicy.required_layers.filter((layer) => !appliedLayers.includes(layer));
  for (const layer of missingRequired) {
    errors.push(`idea_card.category_layer_pack missing required layer: ${layer}`);
  }

  if (!hasNonEmptyText(pack.category_fit_note)) {
    errors.push("idea_card.category_layer_pack.category_fit_note is required");
  }

  if (!hasNonEmptyText(pack.premium_execution_note)) {
    errors.push("idea_card.category_layer_pack.premium_execution_note is required");
  }

  const practicalEffects = pack.practical_effects;
  if (!practicalEffects || typeof practicalEffects !== "object" || Array.isArray(practicalEffects)) {
    errors.push("idea_card.category_layer_pack.practical_effects is required");
  } else {
    for (const layer of layerPolicy.required_layers) {
      if (!layerPracticalEffectExists(practicalEffects, layer)) {
        errors.push(`idea_card.category_layer_pack.practical_effects.${layer} is required`);
      }
    }
  }

  return errors;
}

function textField(card: Json, ...keys: string[]) {
  for (const key of keys) {
    if (hasNonEmptyText(card[key])) return String(card[key]).trim();
  }
  return "";
}

function isRenderableImportedCard(card: Json | undefined, title = "") {
  if (!card || typeof card !== "object" || Array.isArray(card)) return false;
  const resolvedTitle = textField(card, "title") || title.trim();
  const steps = card.steps;
  const scenes = card.scene_script;
  const hasSteps = Array.isArray(steps) && steps.length >= 3;
  const hasScenes = Array.isArray(scenes) && scenes.length >= 1;
  return resolvedTitle.length >= 2 && (hasSteps || hasScenes);
}

function isV2IdeaCard(card: Json) {
  const version = Number(card.schemaVersion ?? card.schema_version);
  // A malformed v2 payload is still v2: never repair it through the legacy adapter.
  return version === 2;
}

function validateV2IdeaCardProduction(ideaCard: Json) {
  const errors: string[] = [];
  const parsed = ideaCardSchema.safeParse(ideaCard);
  if (!parsed.success) errors.push(...parsed.error.issues.map((issue) => `idea_card.${issue.path.join(".")}: ${issue.message}`));

  if (!textField(ideaCard, "title")) errors.push("idea_card.title is required");
  if (!textField(ideaCard, "conceptSummary", "concept_summary")) {
    errors.push("idea_card.conceptSummary is required");
  }
  if (!textField(ideaCard, "viewerTakeaway", "viewer_takeaway")) {
    errors.push("idea_card.viewerTakeaway is required");
  }
  if (!textField(ideaCard, "whyItWorks", "why_it_works")) {
    errors.push("idea_card.why_it_works is required");
  }
  if (!textField(ideaCard, "hookId", "hook_id")) {
    errors.push("idea_card.hook_id is required");
  }
  if (!textField(ideaCard, "shootFormat", "shoot_format")) {
    errors.push("idea_card.shoot_format is required");
  }
  if (!isRenderableImportedCard(ideaCard, textField(ideaCard, "title"))) {
    errors.push("idea_card must include a title and at least 3 steps");
  }

  const steps = Array.isArray(ideaCard.steps) ? ideaCard.steps : [];
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      errors.push(`idea_card.steps[${index}] must be an object`);
      continue;
    }
    const row = step as Json;
    if (!hasNonEmptyText(row.purpose) || !hasNonEmptyText(row.goal) || !hasNonEmptyText(row.action)) {
      errors.push(`idea_card.steps[${index}] requires purpose, goal, and action`);
    }
  }

  // Schema v2 is the creator-facing contract. Internal policy application is
  // recorded in the generation run/decision trace, never injected into the card.

  return errors;
}

function validateIdeaCardProduction(card: unknown, layerPolicy: CategoryLayerPolicy) {
  const errors: string[] = [];

  if (!card || typeof card !== "object" || Array.isArray(card)) {
    return errors;
  }

  const ideaCard = card as Json;
  if (isV2IdeaCard(ideaCard)) {
    return validateV2IdeaCardProduction(ideaCard);
  }
  const requiredObjects = [
    "idea_summary",
    "why_it_can_work",
    "creator_presence_mode",
    "atmosphere_direction",
    "hook_performance_pack",
    "video_blueprint",
    "scene_script",
    "shot_list",
    "pose_direction",
    "micro_behavior_guide",
    "camera_direction",
    "b_roll_plan",
    "editing_notes",
    "editing_timeline",
    "caption_pack",
    "comment_engine",
    "story_followup",
    "variant_pack",
    "brand_safety",
    "production_notes",
    "production_plan",
    "personalization_slots",
    "strategic_value",
    "category_layer_pack",
  ];

  for (const key of requiredObjects) {
    const value = ideaCard[key];
    if (!value || typeof value !== "object" || (Array.isArray(value) && value.length === 0)) {
      errors.push(`idea_card.${key} is required`);
    }
  }

  if (!hasNonEmptyText(ideaCard.why_it_works) && !hasNonEmptyText((ideaCard.why_it_can_work as Json | undefined)?.save_trigger)) {
    errors.push("idea_card.why_it_works is required");
  }
  if (!hasNonEmptyText(ideaCard.hook_id)) {
    errors.push("idea_card.hook_id is required");
  }
  if (!hasNonEmptyText(ideaCard.shoot_format)) {
    errors.push("idea_card.shoot_format is required");
  }

  if (!hasNonEmptyText(ideaCard.brand_lift_statement)) {
    errors.push("idea_card.brand_lift_statement is required");
  }

  if (!hasNonEmptyText(ideaCard.premium_decision_note)) {
    errors.push("idea_card.premium_decision_note is required");
  }

  const creatorPresenceMode = ideaCard.creator_presence_mode as Json | undefined;
  if (creatorPresenceMode && typeof creatorPresenceMode === "object" && !Array.isArray(creatorPresenceMode)) {
    for (const key of ["mode", "delivery_style", "why_it_fits_creator", "avoid"]) {
      if (!hasNonEmptyText(creatorPresenceMode[key])) {
        errors.push(`idea_card.creator_presence_mode.${key} is required`);
      }
    }
  }

  const atmosphereDirection = ideaCard.atmosphere_direction as Json | undefined;
  if (atmosphereDirection && typeof atmosphereDirection === "object" && !Array.isArray(atmosphereDirection)) {
    for (const key of ["mood", "visual_texture", "color_language", "soundscape"]) {
      if (!hasNonEmptyText(atmosphereDirection[key])) {
        errors.push(`idea_card.atmosphere_direction.${key} is required`);
      }
    }
  }

  const videoBlueprint = ideaCard.video_blueprint as Json | undefined;
  if (videoBlueprint && typeof videoBlueprint === "object" && !Array.isArray(videoBlueprint)) {
    for (const key of ["duration_seconds", "opening_visual", "scene_arc", "payoff_visual"]) {
      if (videoBlueprint[key] === undefined || videoBlueprint[key] === null || videoBlueprint[key] === "") {
        errors.push(`idea_card.video_blueprint.${key} is required`);
      }
    }
  }

  if (!hasNonEmptyArray(ideaCard.shot_list)) {
    errors.push("idea_card.shot_list must include at least one shot");
  }

  const hookPerformancePack = ideaCard.hook_performance_pack as Json | undefined;
  if (hookPerformancePack && typeof hookPerformancePack === "object" && !Array.isArray(hookPerformancePack)) {
    if (!hasNonEmptyArray(hookPerformancePack.hook_options)) {
      errors.push("idea_card.hook_performance_pack.hook_options must include hook variants");
    }

    for (const key of ["luxury_hook", "relatable_hook", "comedy_hook", "first_second_visual_hook", "first_line_hook", "comment_trigger_hook"]) {
      if (!hasNonEmptyText(hookPerformancePack[key])) {
        errors.push(`idea_card.hook_performance_pack.${key} is required`);
      }
    }
  }

  if (!hasNonEmptyArray(ideaCard.scene_script)) {
    errors.push("idea_card.scene_script must include at least one scripted scene");
  }

  const firstScene = hasNonEmptyArray(ideaCard.scene_script) ? (ideaCard.scene_script as unknown[])[0] as Json : null;
  if (firstScene && typeof firstScene === "object" && !Array.isArray(firstScene)) {
    for (const key of ["purpose", "voiceover", "spoken_lines", "on_screen_text"]) {
      const value = firstScene[key];
      if (!hasNonEmptyText(value) && !hasNonEmptyArray(value)) {
        errors.push(`idea_card.scene_script[0].${key} is required`);
      }
    }
  }

  if (!hasNonEmptyArray(ideaCard.b_roll_plan)) {
    errors.push("idea_card.b_roll_plan must include b-roll shots");
  }

  const poseDirection = ideaCard.pose_direction as Json | undefined;
  if (poseDirection && typeof poseDirection === "object" && !Array.isArray(poseDirection)) {
    for (const key of ["face", "hands", "body", "expression"]) {
      if (!hasNonEmptyText(poseDirection[key])) {
        errors.push(`idea_card.pose_direction.${key} is required`);
      }
    }
  }

  const microBehaviorGuide = ideaCard.micro_behavior_guide as Json | undefined;
  if (microBehaviorGuide && typeof microBehaviorGuide === "object" && !Array.isArray(microBehaviorGuide)) {
    for (const key of ["facial_expression", "eye_contact", "product_handling", "camera_attention", "smile_timing", "avoid_over_advertising"]) {
      if (!hasNonEmptyText(microBehaviorGuide[key])) {
        errors.push(`idea_card.micro_behavior_guide.${key} is required`);
      }
    }
  }

  const cameraDirection = ideaCard.camera_direction as Json | undefined;
  if (cameraDirection && typeof cameraDirection === "object" && !Array.isArray(cameraDirection)) {
    for (const key of ["framing", "movement", "lighting"]) {
      if (!hasNonEmptyText(cameraDirection[key])) {
        errors.push(`idea_card.camera_direction.${key} is required`);
      }
    }
  }

  const captionPack = ideaCard.caption_pack as Json | undefined;
  if (captionPack && typeof captionPack === "object" && !Array.isArray(captionPack)) {
    if (!hasNonEmptyArray(captionPack.caption_options)) {
      errors.push("idea_card.caption_pack.caption_options must include at least one caption");
    }
    if ((captionPack.caption_options as unknown[] | undefined)?.length !== undefined && (captionPack.caption_options as unknown[]).length < 3) {
      errors.push("idea_card.caption_pack.caption_options must include at least three captions");
    }
    if (!hasNonEmptyArray(captionPack.on_screen_text)) {
      errors.push("idea_card.caption_pack.on_screen_text must include at least one text overlay");
    }
  }

  const commentEngine = ideaCard.comment_engine as Json | undefined;
  if (commentEngine && typeof commentEngine === "object" && !Array.isArray(commentEngine)) {
    for (const key of ["pinned_comment", "audience_question", "reply_strategy"]) {
      if (!hasNonEmptyText(commentEngine[key])) {
        errors.push(`idea_card.comment_engine.${key} is required`);
      }
    }
  }

  const storyFollowup = ideaCard.story_followup as Json | undefined;
  if (storyFollowup && typeof storyFollowup === "object" && !Array.isArray(storyFollowup)) {
    for (const key of ["poll_question", "poll_options", "followup_frame"]) {
      const value = storyFollowup[key];
      if (!hasNonEmptyText(value) && !hasNonEmptyArray(value)) {
        errors.push(`idea_card.story_followup.${key} is required`);
      }
    }
  }

  if (!hasNonEmptyArray(ideaCard.editing_timeline)) {
    errors.push("idea_card.editing_timeline must include timed edit beats");
  }

  const variantPack = ideaCard.variant_pack as Json | undefined;
  if (variantPack && typeof variantPack === "object" && !Array.isArray(variantPack)) {
    for (const key of ["reels", "story", "carousel", "youtube_shorts", "short_15s"]) {
      if (!hasNonEmptyText(variantPack[key]) && typeof variantPack[key] !== "object") {
        errors.push(`idea_card.variant_pack.${key} is required`);
      }
    }
  }

  const brandSafety = ideaCard.brand_safety as Json | undefined;
  if (brandSafety && typeof brandSafety === "object" && !Array.isArray(brandSafety)) {
    for (const key of ["disclosure_text", "claim_boundary", "do_not_say", "evidence_note", "safer_alternative_phrase"]) {
      const value = brandSafety[key];
      if (!hasNonEmptyText(value) && !hasNonEmptyArray(value)) {
        errors.push(`idea_card.brand_safety.${key} is required`);
      }
    }
  }

  const productionPlan = ideaCard.production_plan as Json | undefined;
  if (productionPlan && typeof productionPlan === "object" && !Array.isArray(productionPlan)) {
    for (const key of ["shoot_time_minutes", "equipment", "solo_creator_friendly", "location_options", "production_versions"]) {
      const value = productionPlan[key];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`idea_card.production_plan.${key} is required`);
      }
    }
  }

  const personalizationSlots = ideaCard.personalization_slots as Json | undefined;
  if (personalizationSlots && typeof personalizationSlots === "object" && !Array.isArray(personalizationSlots)) {
    for (const key of ["product_name", "daily_context", "audience_pain", "signature_phrase"]) {
      if (!hasNonEmptyText(personalizationSlots[key])) {
        errors.push(`idea_card.personalization_slots.${key} is required`);
      }
    }
  }

  const strategicValue = ideaCard.strategic_value as Json | undefined;
  if (strategicValue && typeof strategicValue === "object" && !Array.isArray(strategicValue)) {
    for (const key of ["brand_equity", "audience_aftertaste", "partnership_signal"]) {
      if (!hasNonEmptyText(strategicValue[key])) {
        errors.push(`idea_card.strategic_value.${key} is required`);
      }
    }
  }

  errors.push(...validateCategoryLayerPack(ideaCard, layerPolicy));

  return errors;
}

function validateIdea(row: IdeaRow, categorySlug: string, personaSlug: string, platform: string, layerPolicy: CategoryLayerPolicy, language = "en") {
  const idea = row.payload;
  const errors: string[] = [];

  if (idea.__parse_error) errors.push("invalid JSONL row");
  if (typeof idea.external_idea_id !== "string" || idea.external_idea_id.length < 3) errors.push("external_idea_id is required");
  errors.push(...titleQualityErrors(idea.title, "title"));
  if (typeof idea.one_sentence_premise !== "string" || idea.one_sentence_premise.trim().length < 10) errors.push("one_sentence_premise is required");
  if (!Array.isArray(idea.mechanism_ids) || idea.mechanism_ids.length === 0) errors.push("mechanism_ids must be a non-empty array");
  if (idea.category_slug !== categorySlug) errors.push(`category_slug must match batch category: ${categorySlug}`);
  if (!Array.isArray(idea.persona_tags) || !idea.persona_tags.includes(personaSlug)) errors.push(`persona_tags must include ${personaSlug}`);
  if (!Array.isArray(idea.content_style_layers) || idea.content_style_layers.length === 0) errors.push("content_style_layers must be a non-empty array");
  if (!Array.isArray(idea.hook_options) || idea.hook_options.length === 0) errors.push("hook_options must be a non-empty array");
  if (!Array.isArray(idea.story_beats)) errors.push("story_beats must be an array");
  if (typeof idea.idea_card !== "object" || idea.idea_card === null || Array.isArray(idea.idea_card)) errors.push("idea_card must be an object");
  const hiddenCardKeys = findCreatorHiddenKeys(idea.idea_card);
  if (hiddenCardKeys.length) errors.push(`idea_card includes creator-hidden fields: ${hiddenCardKeys.join(", ")}`);
  const creatorFacingLeaks = findCreatorFacingLeaks(idea.idea_card, language !== "tr");
  if (creatorFacingLeaks.length) errors.push(`idea_card includes non-public creator-facing text: ${creatorFacingLeaks.slice(0, 12).join(", ")}`);
  if (idea.idea_card && typeof idea.idea_card === "object" && !Array.isArray(idea.idea_card)) {
    errors.push(...titleQualityErrors((idea.idea_card as Json).title ?? idea.title, "idea_card.title"));
  }
  errors.push(...validateIdeaCardProduction(idea.idea_card, layerPolicy));
  if (idea.platform && idea.platform !== platform) errors.push(`platform must match batch platform: ${platform}`);
  if (idea.originality_status === "duplicate") errors.push("originality_status is duplicate");

  const safetyNotes = asArray(idea.safety_notes).map(String).join(" ").toLowerCase();
  if (safetyNotes.includes("blocked") || safetyNotes.includes("unsafe")) {
    errors.push("safety_notes mark the idea as blocked/unsafe");
  }

  return errors;
}

function candidatePayload(idea: Json, batch: Json, layerPolicy: CategoryLayerPolicy, verifiedGeneration = false) {
  const ideaCard = idea.idea_card as Json;

  return {
    user_id: null,
    platform: batch.platform,
    format: String(idea.format ?? "reels_30_45"),
    language: batch.language ?? "tr",
    locale: idea.locale ?? (batch.language === "tr" ? "TR" : "US"),
    title: idea.title,
    one_sentence_premise: idea.one_sentence_premise,
    core_insight: idea.core_insight ?? null,
    opportunity_statement: idea.opportunity_statement ?? null,
    mechanism_ids: idea.mechanism_ids,
    hook_options: idea.hook_options,
    story_beats: idea.story_beats,
    comedy_remix: idea.comedy_remix ?? {},
    human_awareness: idea.human_awareness ?? {},
    production_requirements: idea.production_requirements ?? {},
    safety_status: "SAFE",
    perspective_prism_status: "PASS",
    confidence_band: "MEDIUM",
    status: idea.generation_decision === "reject"
      ? "blocked"
      : idea.generation_decision === "refine" || idea.generation_decision === "human_review_required"
        ? "needs_refinement"
        : "draft",
    decision_trace: {
      import_source: verifiedGeneration ? "verified_generation" : "admin_batch_import",
      safety_notes: idea.safety_notes ?? [],
      validation: {
        schema: true,
        category_persona_fit: true,
        safety: true,
        platform_fit: true,
        category_layer_policy: true,
      },
      category_layer_policy: {
        policy_slug: layerPolicy.policy_slug,
        scope_type: layerPolicy.scope_type,
        required_layers: layerPolicy.required_layers,
        premium_layers: layerPolicy.premium_layers,
        creator_visible: false,
      },
      generation: verifiedGeneration ? idea.generation ?? {} : {},
      generation_gate: verifiedGeneration ? idea.generation_gate ?? {} : {},
    },
    external_idea_id: idea.external_idea_id,
    generation_batch_id: batch.id,
    category_id: batch.category_id,
    persona_id: batch.persona_id,
    content_style_layers: idea.content_style_layers,
    candidate_source: batch.source_mode,
    _idea_card: ideaCard,
  };
}

function cardPayload(ideaId: string, candidate: Json) {
  const card = candidate._idea_card as Json;
  return {
    idea_id: ideaId,
    title: candidate.title,
    card: {
      ...card,
      id: ideaId,
      title: card.title ?? candidate.title,
      one_sentence_premise: card.one_sentence_premise ?? candidate.one_sentence_premise,
    },
    markdown: typeof card.markdown === "string" ? card.markdown : null,
  };
}

async function importBatch(batchId: string, body: Json, verifiedRunId?: string) {
  const batch = await resolveBatch(batchId);
  const category = await lookupCategoryById(String(batch.category_id));
  const persona = await lookupById("creator_personas", String(batch.persona_id));
  const layerPolicy = await lookupCategoryLayerPolicy(
    String(category.slug),
    String(category.family ?? ""),
    String(batch.platform),
  );

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: "importing",
    manifest: body.manifest ?? batch.manifest,
  });

  const ideaRows = ideaRowsFromBody(body);
  const errors: Json[] = [];
  const seenImportFingerprints = new Map<number, string>();
  let imported = 0;

  for (const row of ideaRows) {
    const validationErrors = validateIdea(
      row,
      String(category.slug),
      String(persona.slug),
      String(batch.platform),
      layerPolicy,
      String(batch.language ?? "en"),
    );
    if (verifiedRunId && jsonObject(row.payload.generation).run_id !== verifiedRunId) validationErrors.push("generation run mismatch");
    if (!verifiedRunId && (row.payload.generation || row.payload.generation_gate || row.payload.generation_decision)) validationErrors.push("generation provenance cannot be supplied through public import");
    if (isV2IdeaCard(jsonObject(row.payload.idea_card))) {
      const parsed = ideaCardSchema.safeParse(row.payload.idea_card);
      if (parsed.success) {
        if (parsed.data.category !== category.slug || parsed.data.personaSlug !== persona.slug || parsed.data.platform !== batch.platform) validationErrors.push("card lane identity must match batch");
        row.payload.idea_card = parsed.data;
      }
    }
    if (!validationErrors.length && row.payload.idea_card && typeof row.payload.idea_card === "object" && !Array.isArray(row.payload.idea_card)) {
      const card = row.payload.idea_card as Json;
      const fingerprint = richCardSignature(row.payload, card);
      const existingExternalId = seenImportFingerprints.get(Number(fingerprint.fingerprint_hash));
      if (existingExternalId) {
        validationErrors.push(`duplicate card fingerprint in import batch; matches ${existingExternalId}`);
      } else {
        seenImportFingerprints.set(Number(fingerprint.fingerprint_hash), String(row.payload.external_idea_id ?? row.line_number ?? "unknown"));
      }
    }

    if (validationErrors.length) {
      errors.push({
        batch_id: batch.id,
        source_file: row.source_file,
        line_number: row.line_number,
        external_idea_id: row.payload.external_idea_id ?? null,
        error_code: "VALIDATION_FAILED",
        error_message: validationErrors.join("; "),
        raw_payload: row.payload.__parse_error ? null : row.payload,
        raw_line: row.raw_line,
      });
      continue;
    }

    const candidateWithCard = candidatePayload(row.payload, batch, layerPolicy, Boolean(verifiedRunId));
    const { _idea_card: ideaCard, ...candidate } = candidateWithCard;

    let candidateId: string | null = null;
    try {
      if (verifiedRunId) {
        const input = { p_run_id: verifiedRunId, p_candidate: candidate, p_card: ideaCard };
        try {
          await postRows("rpc/import_generated_idea_card", input);
        } catch (error) {
          // A lost response may hide a committed transaction. Retry only the same
          // idempotent payload; never split the candidate/card writes again.
          if (error instanceof HttpError && error.status < 500) throw error;
          await postRows("rpc/import_generated_idea_card", input);
        }
      } else {
        const insertedCandidate = await postRows("idea_candidates", candidate) as Json[];
        candidateId = String(insertedCandidate[0].id);
        await postRows("idea_cards", cardPayload(candidateId, { ...candidate, _idea_card: ideaCard }));
      }
      imported += 1;
    } catch (error) {
      // An ambiguous atomic import must be reconciled by the run recovery path,
      // not converted into a definitive zero-import validation error.
      if (verifiedRunId && (!(error instanceof HttpError) || error.status >= 500)) throw error;
      let cleanupError: unknown = null;
      if (candidateId) {
        try {
          await deleteRows("idea_candidates", `id=eq.${candidateId}`);
        } catch (candidateCleanupError) {
          cleanupError = candidateCleanupError;
        }
      }
      errors.push({
        batch_id: batch.id,
        source_file: row.source_file,
        line_number: row.line_number,
        external_idea_id: row.payload.external_idea_id ?? null,
        error_code: "DB_INSERT_FAILED",
        error_message: `${error instanceof HttpError ? error.message : String(error)}${cleanupError ? `; orphan cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}` : ""}`,
        raw_payload: row.payload,
        raw_line: row.raw_line,
      });
    }
  }

  if (errors.length) {
    for (let i = 0; i < errors.length; i += 500) {
      await postRows("idea_import_errors", errors.slice(i, i + 500), "return=minimal");
    }
  }

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: "imported",
    stats: {
      imported,
      rejected: errors.length,
      total_rows: ideaRows.length,
    },
  });

  return { batch_id: batch.id, imported, rejected: errors.length, total_rows: ideaRows.length };
}

async function trainingContext(batchId: string, body: Json = {}) {
  const batch = await resolveBatch(batchId);
  const category = await lookupCategoryById(String(batch.category_id));
  const persona = await lookupById("creator_personas", String(batch.persona_id));
  const platform = String(batch.platform ?? body.platform ?? "instagram_reels");
  const categorySlug = String(category.slug);
  const layerPolicy = await lookupCategoryLayerPolicy(categorySlug, String(category.family ?? ""), platform);
  const patternProfile = await trainingProfileForScope(categorySlug, platform, Number(body.limit ?? 16));
  const trendRows = await getRows(
    "trend_signals",
    `select=source,source_url,platform,locale,country_code,signal,signal_scope,observed_at,expires_at,metadata,freshness_score,confidence_score&platform=in.(${encodeURIComponent(platform)},internet)&sanitized=eq.true&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&metadata->>category_slug=eq.${encodeURIComponent(categorySlug)}&order=confidence_score.desc&limit=${Math.max(1, Math.min(Number(body.trend_limit ?? 12), 50))}`,
  ) as Json[];
  const evalRows = body.include_eval_cases === false ? [] : await getRows(
    "generator_eval_cases",
    `select=slug,title,category_slug,input_brief,expected_patterns,forbidden_patterns,quality_rubric&enabled=eq.true&category_slug=eq.${encodeURIComponent(categorySlug)}&limit=${Math.max(1, Math.min(Number(body.eval_limit ?? 8), 30))}`,
  ) as Json[];

  return {
    batch_id: batch.id,
    external_batch_id: batch.external_batch_id,
    category: {
      id: category.id,
      slug: categorySlug,
      family: category.family ?? null,
      risk_level: category.risk_level ?? null,
    },
    persona: {
      id: persona.id,
      slug: persona.slug,
    },
    platform,
    generator_context: {
      use: "internal_generator_prompt_context",
      instruction: "Use these patterns as abstract planning signals only. Do not expose source names, scores, bands, training rows or internal policy data in creator-facing cards.",
      anti_copy_policy: "mechanism_only_no_surface_copy",
      creator_visible: false,
    },
    category_layer_policy: {
      policy_slug: layerPolicy.policy_slug,
      scope_type: layerPolicy.scope_type,
      required_layers: layerPolicy.required_layers,
      optional_layers: layerPolicy.optional_layers,
      premium_layers: layerPolicy.premium_layers,
      restricted_layers: layerPolicy.restricted_layers,
      practical_effects: layerPolicy.practical_effects,
      generator_instructions: layerPolicy.generator_instructions,
      quality_rules: layerPolicy.quality_rules,
      creator_visible: false,
    },
    pattern_profile: patternProfile.map((row) => ({
      pattern_id: row.pattern_id,
      pattern_name: row.pattern_name,
      pattern_family: row.pattern_family,
      signal_weight: row.signal_weight,
      example_count: row.example_count,
      quality_vector: row.quality_vector,
      creator_visible: false,
    })),
    trend_signals: trendRows.map((row) => ({
      source: row.source,
      source_url: row.source_url,
      platform: row.platform,
      locale: row.locale,
      country_code: row.country_code,
      signal: row.signal,
      signal_scope: row.signal_scope,
      observed_at: row.observed_at,
      expires_at: row.expires_at,
      metadata: row.metadata,
      freshness_score: row.freshness_score,
      confidence_score: row.confidence_score,
      creator_visible: false,
    })),
    eval_cases: evalRows.map((row) => ({
      slug: row.slug,
      title: row.title,
      category_slug: row.category_slug,
      input_brief: row.input_brief,
      expected_patterns: row.expected_patterns,
      forbidden_patterns: row.forbidden_patterns,
      quality_rubric: row.quality_rubric,
      creator_visible: false,
    })),
  };
}

function providerProfile(row: Json): ModelProviderProfile {
  return {
    provider: String(row.provider),
    protocol: String(row.protocol) as ModelProviderProfile["protocol"],
    model: String(row.model),
    baseUrl: row.base_url ? String(row.base_url) : null,
    apiKeyEnvVar: String(row.api_key_env_var),
    timeoutMs: Number(row.timeout_ms ?? 45000),
    features: (row.features ?? {}) as Json,
  };
}

function addUsage(total: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null }, usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null }) {
  for (const key of ["inputTokens", "outputTokens", "totalTokens"] as const) {
    total[key] = total[key] === null || usage[key] === null ? null : total[key] + usage[key];
  }
}

function issueCounts(values: string[]) {
  return values.reduce<Record<string, number>>((counts, code) => {
    counts[code] = (counts[code] ?? 0) + 1;
    return counts;
  }, {});
}

function criticHardGateCodes(value: unknown): string[] {
  const checks = jsonObject(jsonObject(value).checks);
  const mapping: Record<string, string> = {
    filmability: "critic_filmability_failed",
    first_frame_hook: "critic_hook_first_frame_mismatch",
    lane_fit: "critic_lane_recipe_mismatch",
    emotion_vibe: "critic_emotion_vibe_mismatch",
    proof_payoff: "critic_proof_payoff_failed",
    duration: "critic_duration_failed",
    safety: "critic_safety_failed",
    originality: "critic_originality_failed",
  };
  return Object.entries(mapping).filter(([check]) => checks[check] !== "pass").map(([, code]) => code);
}

async function updateRunStage(runId: string, stage: string) {
  await patchRows("idea_generation_runs", `id=eq.${runId}&status=eq.running`, {
    stage,
    heartbeat_at: new Date().toISOString(),
    lease_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
}

async function generateBatch(batchId: string, body: Json, execution: { queueOnly?: boolean; processQueued?: boolean } = {}) {
  const queueOnly = execution.queueOnly === true;
  const processQueued = execution.processQueued === true;
  const profileSlug = String(body.profile_slug ?? "").trim();
  if (!profileSlug) throw new HttpError(400, "profile_slug is required");
  const requestedTargetCount = Number(body.target_count ?? 1);
  if (requestedTargetCount !== 1) {
    throw new HttpError(400, "target_count must be 1; use bounded, idempotent requests for batch generation");
  }
  const requestKey = String(body.request_id ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)) throw new HttpError(400, "request_id must be a UUID reused when retrying this request");
  const candidateMultiplier = Number(body.candidate_multiplier ?? 5);
  if (candidateMultiplier !== 5) {
    throw new HttpError(400, "candidate_multiplier must be 5 for the V3 five-recipe contract");
  }
  const shadow = body.shadow !== false;
  const batch = await resolveBatch(batchId);
  let queuedRun: Json | null = null;
  const replayRows = await getRows("idea_generation_runs", `select=*&generation_batch_id=eq.${batch.id}&request_key=eq.${requestKey}&limit=1`) as Json[];
  if (replayRows.length) {
    let replay = replayRows[0];
    if (replay.profile_slug !== profileSlug || replay.shadow !== shadow || Number(replay.requested_count) !== requestedTargetCount || Number(replay.candidate_multiplier) !== candidateMultiplier) throw new HttpError(409, "request_id was used with different generation parameters");
    if (replay.status === "queued" && processQueued) queuedRun = replay;
    else if (replay.status === "queued") return { run_id: replay.id, replayed: true, status: "queued" };
    // Reconcile under the database lease lock, even if the profile was since disabled.
    // Never regenerate a possibly imported card when replaying an abandoned request.
    if (!queuedRun) {
      if (["running", "failed", "partial"].includes(String(replay.status))) replay = await postRows("rpc/reconcile_expired_idea_generation_run", { p_run_id: replay.id }) as Json;
      if (replay.status === "running") throw new HttpError(409, "generation request is already running; retry the same request_id later");
      return { run_id: replay.id, replayed: true, status: replay.status, imported: replay.imported_count ?? 0, reject: replay.reject_count ?? 0 };
    }
  }
  const profiles = await getRows(
    "idea_model_profiles",
    `select=*&profile_slug=eq.${encodeURIComponent(profileSlug)}&enabled=eq.true&limit=1`,
  ) as Json[];
  if (!profiles.length) throw new HttpError(404, `enabled model profile not found: ${profileSlug}`);
  const profileRow = profiles[0];
  const criticSlug = String(jsonObject(profileRow.features).critic_profile_slug ?? "");
  if (!criticSlug) throw new HttpError(409, "Configure features.critic_profile_slug with an independent enabled critic model");
  const criticRows = await getRows("idea_model_profiles", `select=*&profile_slug=eq.${encodeURIComponent(criticSlug)}&enabled=eq.true&limit=1`) as Json[];
  const criticRow = criticRows[0];
  if (!independentCritic(profileRow, criticRow)) throw new HttpError(409, "The critic must be enabled and use a different provider/model from the generator");
  const criticProfile = providerProfile(criticRow);
  const criticProfileHash = await sha256(stableJson(modelContract(criticRow)));
  if (queuedRun) {
    const queuedMetadata = jsonObject(queuedRun.metadata);
    if (queuedRun.model_profile_id !== profileRow.id
      || queuedRun.provider !== profileRow.provider || queuedRun.protocol !== profileRow.protocol || queuedRun.model !== profileRow.model
      || queuedRun.prompt_version !== PROMPT_VERSION || Number(queuedRun.schema_version) !== 2
      || queuedRun.taxonomy_version !== CREATIVE_TAXONOMY_VERSION
      || queuedMetadata.pipeline_version !== GENERATION_PIPELINE_VERSION
      || queuedMetadata.curriculum_version !== CARD_TRAINING_VERSION
      || queuedMetadata.scheduler_version !== CREATIVE_SCHEDULER_VERSION
      || queuedMetadata.concept_ranker_version !== CONCEPT_RANKER_VERSION
      || queuedMetadata.policy_version !== AUTOMATIC_POLICY_VERSION
      || stableJson(queuedMetadata.generator_snapshot) !== stableJson(modelContract(profileRow))
      || queuedMetadata.critic_profile_id !== criticRow.id || queuedMetadata.critic_profile_hash !== criticProfileHash) {
      throw new HttpError(409, "queued generation contract changed; create a new request_id for the current profiles and versions");
    }
  }
  const qualificationContractMatches = profileMatchesQualificationContract(profileRow, {
    promptVersion: PROMPT_VERSION,
    schemaVersion: 2,
    qualityGateVersion: QUALITY_GATE_VERSION,
  });
  if (!shadow && (!qualificationContractMatches || !criticMatchesQualificationContract(profileRow, criticRow))) {
    throw new HttpError(409, "Only profiles qualified for the active prompt, schema, and quality gate may generate non-shadow inventory");
  }

  if (String(batch.language ?? "en") !== "en") {
    throw new HttpError(409, "Automatic generation is English-only until language-specific qualification passes");
  }
  if (batch.platform !== "instagram_reels") throw new HttpError(409, "Automatic generation is Instagram Reels-only");
  let existingBatchCandidates = await getPagedRows(
    "idea_candidates",
    `select=id&generation_batch_id=eq.${batch.id}&order=created_at.asc`,
  );
  if (existingBatchCandidates.length >= Number(batch.target_count)) {
    // Recover legacy split-write orphans before the capacity check. The database
    // only cleans terminal/expired unprotected imports, never active work/cards.
    await postRows("rpc/reconcile_idea_generation_batch", { p_batch_id: batch.id });
    existingBatchCandidates = await getPagedRows("idea_candidates", `select=id&generation_batch_id=eq.${batch.id}&order=created_at.asc`);
  }
  const batchRemaining = Number(batch.target_count) - existingBatchCandidates.length;
  if (batchRemaining <= 0) throw new HttpError(409, "generation batch target_count is already filled");
  const targetCount = Math.min(requestedTargetCount, batchRemaining);
  const context = await trainingContext(batchId, { limit: 12, trend_limit: 8, include_eval_cases: false });
  const category = jsonObject(context.category);
  const persona = jsonObject(context.persona);
  const categorySlug = String(category.slug);
  const personaSlug = String(persona.slug);
  const existing = await getPagedRows(
    "idea_candidates",
    `select=id,title,one_sentence_premise,decision_trace&category_id=eq.${batch.category_id}&persona_id=eq.${batch.persona_id}&platform=eq.${encodeURIComponent(String(batch.platform))}&order=created_at.desc`,
  ) as Json[];
  const comparisonTexts = existing.map((row) => `${row.title ?? ""} ${row.one_sentence_premise ?? ""}`);
  const recentRecipes = existing.flatMap((row) => {
    const value = jsonObject(jsonObject(row.decision_trace).generation).creative_recipe;
    const parsed = creativeRecipeSchema.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  });
  const profile = providerProfile(profileRow);
  const runRows = queuedRun ? await patchRows("idea_generation_runs", `id=eq.${queuedRun.id}&status=eq.queued`, {
    status: "running",
    stage: "normalize",
    started_at: new Date().toISOString(),
    heartbeat_at: new Date().toISOString(),
    lease_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  }) as Json[] : await postRows("idea_generation_runs", {
    generation_batch_id: batch.id,
    model_profile_id: profileRow.id,
    profile_slug: profileSlug,
    provider: profile.provider,
    protocol: profile.protocol,
    model: profile.model,
    prompt_version: PROMPT_VERSION,
    taxonomy_version: CREATIVE_TAXONOMY_VERSION,
    schema_version: 2,
    status: queueOnly ? "queued" : "running",
    stage: queueOnly ? "queued" : "normalize",
    shadow,
    requested_count: targetCount,
    candidate_multiplier: candidateMultiplier,
    request_key: requestKey,
    metadata: { creator_visible: false, pipeline_version: GENERATION_PIPELINE_VERSION, curriculum_version: CARD_TRAINING_VERSION, taxonomy_version: CREATIVE_TAXONOMY_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION, concept_ranker_version: CONCEPT_RANKER_VERSION, qualification_status: profileRow.qualification_status, policy_version: AUTOMATIC_POLICY_VERSION, generator_snapshot: modelContract(profileRow), critic_profile_id: criticRow.id, critic_profile_hash: criticProfileHash },
  }) as Json[];
  if (!runRows.length) throw new HttpError(409, "generation request was already claimed by another worker");
  const runId = String(runRows[0].id);
  if (queueOnly) return { run_id: runId, status: "queued", replayed: false };
  const started = Date.now();
  const boundedProfile = (value: ModelProviderProfile) => {
    const remaining = 100000 - (Date.now() - started);
    if (remaining < 1000) throw new ModelProviderError("timeout", "Generation request time budget exhausted");
    return { ...value, timeoutMs: Math.min(value.timeoutMs ?? 30000, 30000, remaining) };
  };
  const usage = { inputTokens: 0 as number | null, outputTokens: 0 as number | null, totalTokens: 0 as number | null };
  const ideas: Json[] = [];
  const allIssues: string[] = [];
  let refineCount = 0;
  let rejectCount = 0;
  let approveCount = 0;
  const generatedDurations: number[] = [];
  const generatedTimingFingerprints: string[] = [];
  const generatedRecipes: CreativeRecipe[] = [];
  const historicalRecipes = [...recentRecipes];
  try {
    const existingBatchCards = await cardsForIdeas(existingBatchCandidates.map((candidate) => String(candidate.id)));
    const batchDurations: number[] = [];
    const batchTimingFingerprints: string[] = [];
    const seenTimingFingerprints = new Set<string>();
    for (const candidate of existingBatchCandidates) {
      const ideaId = String(candidate.id);
      const storedCard = existingBatchCards.get(ideaId);
      if (!storedCard) continue;
      const adaptedCard = adaptLegacyIdeaCard(storedCard, { ideaId }).card;
      if (Number.isFinite(adaptedCard.durationSeconds)) batchDurations.push(adaptedCard.durationSeconds);
      const fingerprint = timingFingerprint(adaptedCard);
      batchTimingFingerprints.push(fingerprint);
      seenTimingFingerprints.add(fingerprint);
    }

    const training = buildCardTrainingContext({
      category: context.category,
      persona: context.persona,
      category_layer_policy: context.category_layer_policy,
      pattern_profile: context.pattern_profile,
      trend_signals: context.trend_signals,
    });
    const system = CARD_WRITER_SYSTEM;

    for (let index = 0; index < targetCount; index += 1) {
      try {
      const globalSlotIndex = existingBatchCandidates.length + index;
      const scheduleTargetCount = Math.max(Number(batch.target_count), globalSlotIndex + 1);
      const requiredRuntimeProfile = plannedRuntimeProfile(categorySlug, globalSlotIndex, scheduleTargetCount);
      await updateRunStage(runId, "recipes");
      const scheduledRecipes = scheduleCreativeRecipes({
        lane: categorySlug as PurchaseLane,
        seed: `${batch.id}:${globalSlotIndex}`,
        recentRecipes,
      });
      const conceptResult = await generateStructured(boundedProfile(profile), {
        schemaName: "viralbox_concept_set_v3",
        jsonSchema: conceptSetJsonSchema,
        system,
        prompt: trainingPrompt(training, `Create exactly five materially different concept plans for slot ${index + 1}, one for each trusted recipe in the supplied order. Copy every recipe and its hookId/shootFormat exactly; do not choose or swap taxonomy values. Every concept uses runtimeProfile ${requiredRuntimeProfile}. Make firstFramePlan, soundPlan and the three emotion beats concrete and executable. Estimate proof beats, total spoken words, shots, locations, camera setups and resets conservatively; planning fields are not creator-facing claims.`, {
          requiredRuntimeProfile,
          scheduledRecipes: scheduledRecipes.map((recipe) => ({ recipe, creativeDirection: creativeDirectionForRecipe(recipe) })),
        }),
        validate: (value) => {
          const parsed = conceptSetSchema.parse(value);
          const issues = validateRecipeSet(parsed.concepts.map((concept) => concept.recipe), 5);
          if (issues.length || parsed.concepts.some((concept, conceptIndex) => creativeRecipeId(concept.recipe) !== creativeRecipeId(scheduledRecipes[conceptIndex]) || concept.runtimeProfile !== requiredRuntimeProfile)) {
            throw new Error(`generated concepts changed the scheduled recipes:${issues.join(",")}`);
          }
          return parsed;
        },
      });
      await updateRunStage(runId, "concepts");
      addUsage(usage, conceptResult.usage);

      const rankedConcepts = rankConceptPlans({
        concepts: conceptResult.value.concepts,
        comparisonTexts,
        durationPlanFor: (concept) => {
          if (concept.runtimeProfile !== requiredRuntimeProfile) throw new Error("runtime_profile_mismatch");
          return planCardDuration(categorySlug, globalSlotIndex, scheduleTargetCount, concept);
        },
      });
      let selected: (typeof rankedConcepts)[number] | undefined;
      for (const candidate of rankedConcepts) {
        if (!candidate.eligible) continue;
        const reserved = await postRows("rpc/reserve_idea_creative_signature", {
          p_run_id: runId,
          p_batch_id: batch.id,
          p_category_id: batch.category_id,
          p_persona_id: batch.persona_id,
          p_platform: String(batch.platform),
          p_signature: creativeRecipeId(candidate.concept.recipe),
        });
        if (reserved === true) {
          selected = candidate;
          break;
        }
      }
      if (!selected) {
        rejectCount += 1;
        allIssues.push(rankedConcepts.some((candidate) => candidate.eligible)
          ? "no_unreserved_creative_signature"
          : "no_original_runtime_compatible_concept");
        continue;
      }
      const selectedConcept = {
        ...selected.concept,
        runtimeProfile: requiredRuntimeProfile,
      } as typeof selected.concept & DurationPlanningConcept;
      const durationPlan = selected.durationPlan ?? planCardDuration(categorySlug, globalSlotIndex, scheduleTargetCount, selectedConcept);
      comparisonTexts.push(selected.candidateText);
      recentRecipes.push(selectedConcept.recipe);
      generatedRecipes.push(selectedConcept.recipe);
      if (selected.maximum >= 0.92) {
        allIssues.push("fingerprint_duplicate");
      }

      await updateRunStage(runId, "draft");
      const draftResult = await generateStructured(boundedProfile(profile), {
        schemaName: "viralbox_idea_card_v2",
        jsonSchema: ideaCardJsonSchema,
        system,
        prompt: cardDraftPrompt(training, selectedConcept, durationPlan.targetSeconds),
        validate: (value) => {
          const parsed = ideaCardSchema.parse(value);
          if (parsed.category !== categorySlug || parsed.personaSlug !== personaSlug || parsed.platform !== String(batch.platform)) {
            throw new Error("generated card lane identity does not match the batch");
          }
          if (parsed.hookId !== selectedConcept.hookId || parsed.shootFormat !== selectedConcept.shootFormat) {
            throw new Error("generated card does not preserve its selected concept contract");
          }
          if (parsed.presenceMode !== selectedConcept.recipe.presenceMode) {
            throw new Error("generated card does not preserve its scheduled presence mode");
          }
          if (parsed.durationSeconds !== durationPlan.targetSeconds) {
            throw new Error("generated card does not preserve its deterministic duration target");
          }
          return parsed;
        },
      });
      await updateRunStage(runId, "critic");
      addUsage(usage, draftResult.usage);
      const parsedDraft = draftResult.value as IdeaCard;
      let card = {
        ...parsedDraft,
        productionEstimate: buildProductionEstimate(parsedDraft, selectedConcept),
      };
      let rewriteRepaired = false;

      const runCritic = () => generateStructured(boundedProfile(criticProfile), {
        schemaName: "viralbox_card_critic_v3",
        jsonSchema: criticResultJsonSchema,
        system: CARD_CRITIC_SYSTEM,
        prompt: trainingPrompt(training, `Verify all nine required checks: filmability, first-frame/hook agreement, lane/persona specificity, emotion/vibe execution, natural English speech, proof/payoff integrity, exact duration, safety and originality. Apply the lane objectives to actions, not keywords. Report continuity_break, quantity_mismatch, invented_result, recipe_drift, hook_first_frame_mismatch, payoff_unmet, lane_structure_mismatch or physical_wait_missing when applicable. Treat absent evidence as a failure.`, { card, concept: selectedConcept, creativeDirection: creativeDirectionForRecipe(selectedConcept.recipe), targetSeconds: durationPlan.targetSeconds }),
        validate: (value) => criticResultSchema.parse(value),
      });
      let criticResult = await runCritic();
      addUsage(usage, criticResult.usage);
      allIssues.push(...criticResult.value.issueCodes);

      let deterministicGate = evaluateIdeaCardV22(card, { creativeRecipe: selectedConcept.recipe, concept: selectedConcept });
      if (criticResult.value.decision !== "reject" && (!criticPassed(criticResult.value) || deterministicGate.decision !== "approve")) {
        await updateRunStage(runId, "rewrite");
        const beforeRewriteHash = await cardContentHash(card);
        const rewriteResult = await generateStructured(boundedProfile(profile), {
          schemaName: "viralbox_idea_card_v2",
          jsonSchema: ideaCardJsonSchema,
          system,
          prompt: trainingPrompt(training, `Rewrite the card once. Resolve the critic edits and deterministic issues without introducing new claims or continuity errors. Preserve the concept and exact ${durationPlan.targetSeconds}s runtime. Return the complete corrected schema-v2 card with continuous timing.`, { edits: criticResult.value.editInstructions, issues: [...deterministicGate.hardGateCodes, ...deterministicGate.issueCodes, ...deterministicGate.humanReviewReasons], concept: selectedConcept, card: { ...card, productionEstimate: undefined } }),
          validate: (value) => {
            const parsed = ideaCardSchema.parse(value);
            if (parsed.category !== categorySlug || parsed.personaSlug !== personaSlug || parsed.platform !== String(batch.platform)) {
              throw new Error("rewritten card lane identity does not match the batch");
            }
            if (parsed.hookId !== selectedConcept.hookId || parsed.shootFormat !== selectedConcept.shootFormat) {
              throw new Error("rewritten card does not preserve its selected concept contract");
            }
            if (parsed.presenceMode !== selectedConcept.recipe.presenceMode) {
              throw new Error("rewritten card does not preserve its scheduled presence mode");
            }
            if (parsed.durationSeconds !== durationPlan.targetSeconds) {
              throw new Error("rewritten card does not preserve its deterministic duration target");
            }
            return parsed;
          },
        });
        addUsage(usage, rewriteResult.usage);
        const parsedRewrite = rewriteResult.value as IdeaCard;
        card = {
          ...parsedRewrite,
          productionEstimate: buildProductionEstimate(parsedRewrite, selectedConcept),
        };
        rewriteRepaired = rewriteResult.repaired;
        if (beforeRewriteHash === await cardContentHash(card)) {
          deterministicGate = evaluateIdeaCardV22(card, { creativeRecipe: selectedConcept.recipe, concept: selectedConcept, additionalHardGateCodes: ["rewrite_no_change"] });
        } else {
          criticResult = await runCritic();
          addUsage(usage, criticResult.usage);
          allIssues.push(...criticResult.value.issueCodes);
          deterministicGate = evaluateIdeaCardV22(card, { creativeRecipe: selectedConcept.recipe, concept: selectedConcept });
        }
      }

      const cardTimingFingerprint = timingFingerprint(card);
      const duplicateTimingTemplate = seenTimingFingerprints.has(cardTimingFingerprint);
      seenTimingFingerprints.add(cardTimingFingerprint);
      generatedDurations.push(card.durationSeconds);
      generatedTimingFingerprints.push(cardTimingFingerprint);
      batchDurations.push(card.durationSeconds);
      batchTimingFingerprints.push(cardTimingFingerprint);
      const gate = evaluateIdeaCardV22(card, {
        creativeRecipe: selectedConcept.recipe,
        concept: selectedConcept,
        fingerprintScore: selected.maximum,
        semanticScore: null,
        additionalHardGateCodes: [...deterministicGate.hardGateCodes, ...criticHardGateCodes(criticResult.value), ...(duplicateTimingTemplate ? ["timing_template_duplicate"] : [])],
        additionalIssueCodes: criticPassed(criticResult.value) ? [] : ["critic_unresolved"],
      });
      allIssues.push(...gate.hardGateCodes, ...gate.issueCodes, ...gate.humanReviewReasons);
      const finalDecision = criticResult.value.decision === "reject" ? "reject" : gate.decision;
      if (finalDecision === "approve") approveCount += 1;
      else if (finalDecision === "reject") rejectCount += 1;
      else refineCount += 1;
      const externalIdeaId = `${runId}_${String(index + 1).padStart(3, "0")}`;
      const envelope = generatedIdeaEnvelopeSchema.parse({
        externalIdeaId,
        categorySlug,
        personaSlug,
        platform: String(batch.platform),
        language: "en",
        concept: selectedConcept,
        creativeRecipe: selectedConcept.recipe,
        card,
        critic: criticResult.value,
        generation: {
          runId,
          profileSlug,
          provider: profile.provider,
          model: profile.model,
          promptVersion: PROMPT_VERSION,
          taxonomyVersion: CREATIVE_TAXONOMY_VERSION,
          creativeSignature: creativeRecipeId(selectedConcept.recipe),
          schemaVersion: 2,
          repaired: conceptResult.repaired || draftResult.repaired || criticResult.repaired || rewriteRepaired,
          durationPlan,
        },
      });

      ideas.push({
        external_idea_id: envelope.externalIdeaId,
        title: envelope.card.title,
        one_sentence_premise: envelope.card.conceptSummary,
        core_insight: envelope.card.viewerTakeaway,
        opportunity_statement: envelope.concept.proofPlan,
        mechanism_ids: envelope.concept.mechanismIds.length ? envelope.concept.mechanismIds : [envelope.concept.hookId],
        category_slug: categorySlug,
        persona_tags: [personaSlug],
        content_style_layers: stringArray(jsonObject(context.category_layer_policy).required_layers).length
          ? stringArray(jsonObject(context.category_layer_policy).required_layers)
          : ["creator_style_adapter"],
        hook_options: [{ hook_id: envelope.concept.hookId, line: envelope.card.steps[0]?.spokenLine ?? envelope.card.title }],
        story_beats: envelope.card.steps.map((step) => ({ stage: step.stage, action: step.action, purpose: step.purpose })),
        production_requirements: {
          required_items: envelope.card.requiredItems,
          duration_seconds: envelope.card.durationSeconds,
          runtime_profile: durationPlan.runtimeProfile,
          filming_minutes_low: envelope.card.productionEstimate?.captureMinutesLow,
          filming_minutes_high: envelope.card.productionEstimate?.captureMinutesHigh,
        },
        safety_notes: envelope.concept.riskNotes,
        platform: String(batch.platform),
        format: envelope.card.format,
        locale: "US",
        idea_card: envelope.card,
        generation_decision: finalDecision,
        generation: {
          run_id: runId,
          profile_slug: profileSlug,
          provider: profile.provider,
          model: profile.model,
          prompt_version: PROMPT_VERSION,
          pipeline_version: GENERATION_PIPELINE_VERSION,
          curriculum_version: CARD_TRAINING_VERSION,
          scheduler_version: CREATIVE_SCHEDULER_VERSION,
          concept_ranker_version: CONCEPT_RANKER_VERSION,
          taxonomy_version: CREATIVE_TAXONOMY_VERSION,
          creative_recipe: selectedConcept.recipe,
          creative_signature: creativeRecipeId(selectedConcept.recipe),
          concept_plan: selectedConcept,
          schema_version: 2,
          repaired: envelope.generation.repaired,
          duration_plan: durationPlan,
          creator_visible: false,
        },
        generation_gate: { ...gate, final_decision: finalDecision, policy_version: AUTOMATIC_POLICY_VERSION, critic_issue_codes: criticResult.value.issueCodes, critic_result: criticResult.value, critic_verification: { passed: criticPassed(criticResult.value), independent: true, card_hash: await cardContentHash(card), profile_id: criticRow.id, profile_hash: criticProfileHash, profile_snapshot: modelContract(criticRow), provider: criticProfile.provider, model: criticProfile.model }, creator_visible: false },
      });
      } catch (error) {
        if (error instanceof ModelProviderError && error.usage) addUsage(usage, error.usage);
        if (error instanceof ModelProviderError && ["configuration", "rate_limit", "timeout", "provider_error"].includes(error.code)) throw error;
        rejectCount += 1;
        allIssues.push(error instanceof ModelProviderError ? `provider_${error.code}` : "candidate_generation_failed");
      }
    }

    const runDurationDistribution = analyzeDurationDistribution(generatedDurations, generatedTimingFingerprints);
    const batchDurationDistribution = analyzeDurationDistribution(batchDurations, batchTimingFingerprints);
    const creativeDistribution50 = analyzeCreativeDistribution([...generatedRecipes, ...historicalRecipes].slice(0, 50));
    const creativeDistribution100 = analyzeCreativeDistribution([...generatedRecipes, ...historicalRecipes].slice(0, 100));
    allIssues.push(...runDurationDistribution.issueCodes, ...batchDurationDistribution.issueCodes);
    allIssues.push(...creativeDistribution50.issueCodes, ...creativeDistribution100.issueCodes);
    const distributionBlockingCodes = [
      ...batchDurationDistribution.issueCodes.filter((code) => code !== "batch_timing_template_duplicate"),
      ...creativeDistribution50.issueCodes,
      ...creativeDistribution100.issueCodes,
    ];
    if (distributionBlockingCodes.length) {
      let downgraded = 0;
      for (const idea of ideas) {
        if (idea.generation_decision === "approve") {
          idea.generation_decision = "refine";
          idea.generation_gate = { ...jsonObject(idea.generation_gate), final_decision: "refine", distribution_issues: distributionBlockingCodes };
          downgraded += 1;
        }
      }
      approveCount -= downgraded;
      refineCount += downgraded;
    }
    await updateRunStage(runId, "import");
    const imported = ideas.length ? await importBatch(batchId, { ideas, manifest: batch.manifest }, runId) : { imported: 0, rejected: 0 };
    const importRejectCount = Number(imported.rejected ?? 0);
    const totalRejectCount = rejectCount + importRejectCount;
    // A partial run must preserve at least one durably imported card. Treating an
    // all-rejected candidate set as partial makes recovery believe committed
    // output exists and can accidentally expose a failed generation as resumable.
    const importedCount = Number(imported.imported ?? 0);
    const runStatus = importedCount === 0
      ? "failed"
      : importRejectCount > 0 || rejectCount > 0
        ? "partial"
        : "completed";
    await patchRows("idea_generation_runs", `id=eq.${runId}&status=eq.running`, {
      status: runStatus,
      stage: importedCount > 0 ? "awaiting_embedding" : "failed",
      generated_count: ideas.length,
      imported_count: importedCount,
      refine_count: refineCount,
      reject_count: totalRejectCount,
      token_usage: usage,
      latency_ms: Date.now() - started,
      gate_results: {
        approve: approveCount,
        refine: refineCount,
        reject: rejectCount,
        import_reject: importRejectCount,
        duration_distribution: {
          run: runDurationDistribution,
          batch: batchDurationDistribution,
          existing_card_count: existingBatchCandidates.length,
        },
        creative_distribution: { window_50: creativeDistribution50, window_100: creativeDistribution100 },
      },
      issue_counts: issueCounts(allIssues),
      completed_at: new Date().toISOString(),
    });
    await postRows("rpc/release_pending_idea_creative_signatures", { p_run_id: runId });
    return { run_id: runId, shadow, ...imported, requested: targetCount, generated: ideas.length, approve: approveCount, refine: refineCount, reject: totalRejectCount };
  } catch (error) {
    // Finalization/import response loss cannot prove that nothing was imported.
    // Reconcile committed database evidence before writing a terminal status.
    const recovered = await postRows("rpc/reconcile_idea_generation_run", { p_run_id: runId, p_force: true }) as Json;
    await patchRows("idea_generation_runs", `id=eq.${runId}&status=in.(failed,partial,completed)`, {
      status: recovered.status,
      stage: recovered.stage,
      generated_count: Math.max(ideas.length, Number(recovered.generated_count ?? recovered.imported_count ?? 0)),
      imported_count: Number(recovered.imported_count ?? 0),
      refine_count: Number(recovered.refine_count ?? refineCount),
      reject_count: Math.max(rejectCount, Number(recovered.reject_count ?? 0)),
      token_usage: usage,
      latency_ms: Date.now() - started,
      issue_counts: issueCounts(allIssues),
      metadata: { ...jsonObject(runRows[0].metadata), ...jsonObject(recovered.metadata), creator_visible: false, error_code: error instanceof ModelProviderError ? error.code : error instanceof Error ? error.name : "unknown_error" },
      completed_at: new Date().toISOString(),
    });
    throw error;
  }
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function clampScore(value: number) {
  return Math.max(1, Math.min(99, Math.round(value * 100) / 100));
}

function clampQuality(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function normalizedText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s{}_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const legacyDuplicateStopwords = [
  [105, 99, 105, 110],
  [105, 231, 105, 110],
  [105, 108, 101],
  [97, 109, 97],
  [98, 105, 114],
  [102, 105, 107, 105, 114],
  [102, 105, 107, 114, 105, 110, 101],
  [100, 111, 110, 117, 115, 117, 114],
  [100, 246, 110, 252, 351, 252, 114],
  [103, 117, 118, 101, 110, 108, 105],
  [103, 252, 118, 101, 110, 108, 105],
  [107, 97, 114, 97, 114],
  [102, 105, 108, 116, 114, 101, 115, 105],
  [99, 101, 107, 105, 108, 101, 98, 105, 108, 105, 114],
  [231, 101, 107, 105, 108, 101, 98, 105, 108, 105, 114],
].map(codeWord);

function matcherPattern(terms: string[], codedTerms: Array<number[] | number[][]>) {
  const localTerms = codedTerms.map((term) => Array.isArray(term[0]) ? codePhrase(term as number[][]) : codeWord(term as number[]));
  return new RegExp(`\\b(${[...terms, ...localTerms].join("|")})\\b`, "u");
}

const evidenceNotePattern = matcherPattern(
  ["evidence", "proof", "source", "study", "report", "clinical"],
  [
    [107, 97, 121, 110, 97, 107],
    [107, 97, 110, 105, 116],
    [107, 97, 110, 305, 116],
    [114, 97, 112, 111, 114],
    [118, 101, 114, 105],
  ],
);
const disclosurePattern = matcherPattern(
  ["disclosure", "#ad", "partnerlik"],
  [
    [114, 101, 107, 108, 97, 109],
    [115, 112, 111, 110, 115, 111, 114, 108, 117],
    [[105, 115], [98, 105, 114, 108, 105, 103, 105]],
    [[105, 351], [98, 105, 114, 108, 105, 287, 105]],
  ],
);
const noMedicalClaimPattern = matcherPattern(
  ["no medical claim", "not medical"],
  [
    [[116, 101, 115, 104, 105, 115], [100, 101, 103, 105, 108]],
    [[116, 101, 351, 104, 105, 115], [100, 101, 287, 105, 108]],
    [[116, 105, 98, 98, 105], [105, 100, 100, 105, 97], [121, 111, 107]],
    [[116, 305, 98, 98, 105], [105, 100, 100, 105, 97], [121, 111, 107]],
  ],
);
const healthRiskPattern = matcherPattern(
  ["skin", "health", "medical", "treatment", "doctor", "diet", "weight", "supplement", "disease"],
  [
    [99, 105, 108, 116],
    [116, 101, 100, 97, 118, 105],
    [107, 105, 108, 111],
    [104, 97, 115, 116, 97, 108, 105, 107],
    [116, 101, 115, 104, 105, 115],
    [116, 101, 351, 104, 105, 115],
  ],
);
const schemaV2HealthClaimPattern = /\b(cure[sd]?|treat(?:s|ed|ing)?|heal(?:s|ed|ing)?|diagnos(?:e|es|ed|ing)|reverse[sd]?|prevent[sd]?|guarantee[sd]?|burns?\s+fat|lose\s+\d+|clinically\s+proven)\b/i;
const financeRiskPattern = matcherPattern(
  ["invest", "crypto", "stock", "guaranteed income"],
  [
    [121, 97, 116, 105, 114, 105, 109],
    [98, 111, 114, 115, 97],
    [[112, 97, 114, 97], [107, 97, 122, 97, 110]],
    [[103, 97, 114, 97, 110, 116, 105], [107, 97, 122, 97, 110, 99]],
  ],
);
const childRiskPattern = matcherPattern(
  ["child", "children", "kid", "kids", "family privacy"],
  [
    [98, 101, 98, 101, 107],
    [99, 111, 99, 117, 107],
    [231, 111, 99, 117, 107],
  ],
);
const sponsorRiskPattern = matcherPattern(
  ["sponsor", "sponsored", "ad", "advertisement", "partner", "affiliate", "gifted", "brand deal"],
  [
    [114, 101, 107, 108, 97, 109],
    [[105, 115], [98, 105, 114, 108, 105, 103, 105]],
    [[105, 351], [98, 105, 114, 108, 105, 287, 105]],
  ],
);
const dangerousChallengePattern = matcherPattern(
  ["physical danger", "harmful challenge", "injury risk", "moving vehicle", "jump from", "eat raw", "drink challenge"],
  [
    [[97, 114, 97, 99], [100, 105, 115, 105]],
    [[97, 114, 97, 231], [100, 305, 351, 305]],
    [[114, 105, 115, 107, 108, 105], [99, 104, 97, 108, 108, 101, 110, 103, 101]],
  ],
);
const claimBoundaryPattern = matcherPattern(
  ["boundary", "personal", "not medical", "claim"],
  [
    [115, 105, 110, 105, 114],
    [115, 305, 110, 305, 114],
    [107, 105, 115, 105, 115, 101, 108],
    [107, 105, 351, 105, 115, 101, 108],
    [98, 97, 103, 108, 97, 109],
    [98, 97, 287, 108, 97, 109],
    [[116, 101, 115, 104, 105, 115], [100, 101, 103, 105, 108]],
    [[116, 101, 351, 104, 105, 115], [100, 101, 287, 105, 108]],
    [105, 100, 100, 105, 97],
  ],
);

function textTokens(value: string) {
  const stopwords = new Set([
    "the",
    "and",
    "quality",
    "gate",
    "premium",
    "creator",
    "reels",
    "viral",
    ...legacyDuplicateStopwords,
  ]);
  return normalizedText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !stopwords.has(token));
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(textTokens(left));
  const rightTokens = new Set(textTokens(right));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }

  return Math.round((2 * overlap / (leftTokens.size + rightTokens.size)) * 10000) / 10000;
}

function lexicalSignature(candidate: Json, card: Json) {
  const tokens = textTokens([
    candidate.title,
    candidate.one_sentence_premise,
    objectText(candidate.hook_options),
    objectText(card.idea_summary),
    objectText(card.hook_performance_pack),
  ].join(" "));
  const uniqueTokens = [...new Set(tokens)].sort();
  return {
    token_count: tokens.length,
    unique_token_count: uniqueTokens.length,
    top_tokens: uniqueTokens.slice(0, 30),
    fingerprint: uniqueTokens.slice(0, 60).join("|"),
  };
}

function sectionFingerprint(value: unknown) {
  const tokens = textTokens(objectText(value));
  return [...new Set(tokens)].sort().join("|");
}

function richCardSignature(candidate: Json, card: Json) {
  const steps = Array.isArray(card.steps) ? card.steps.map(jsonObject) : [];
  const hook = sectionFingerprint([
    candidate.hook_options,
    card.hook_performance_pack,
    steps[0]?.spokenLine,
    steps[0]?.onScreenText,
  ]);
  const scene = sectionFingerprint([
    card.video_blueprint,
    card.scene_script,
    card.execution_ranges,
    card.per_second_frames,
    steps.map((step) => [step.purpose, step.goal, step.action, step.spokenLine]),
  ]);
  const shot = sectionFingerprint([
    card.shot_list,
    card.pose_direction,
    card.micro_behavior_guide,
    card.camera_direction,
    steps.map((step) => [step.shot, step.performanceNote]),
  ]);
  const edit = sectionFingerprint([
    card.editing_timeline,
    card.editing_notes,
    card.edit_assembly_guide,
    steps.map((step) => [step.editNote, step.onScreenText]),
  ]);
  const broll = sectionFingerprint(card.b_roll_plan);
  const premise = sectionFingerprint([
    candidate.title,
    candidate.one_sentence_premise,
    card.idea_summary,
    card.conceptSummary,
    card.viewerTakeaway,
  ]);
  const combined = [premise, hook, scene, shot, edit, broll].filter(Boolean).join("||");

  return {
    premise,
    action: sectionFingerprint(steps.map((step) => step.action)),
    hook,
    scene,
    shot,
    edit,
    broll,
    fingerprint: combined,
    fingerprint_hash: stableHash(combined),
  };
}

function arrayItemTexts(value: unknown) {
  return asArray(value)
    .map((item) => normalizedText(objectText(item)))
    .filter((text) => text.length > 8);
}

function duplicatePairs(values: string[], threshold = 0.82) {
  const pairs: Array<{ left: number; right: number; score: number }> = [];
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      const score = tokenSimilarity(values[left], values[right]);
      if (score >= threshold) pairs.push({ left, right, score });
    }
  }
  return pairs;
}

function cardElementDiversity(card: Json) {
  const steps = Array.isArray(card.steps) ? card.steps.map(jsonObject) : [];
  const checks = [
    { key: "steps.action", values: arrayItemTexts(steps.map((step) => step.action)) },
    { key: "steps.spokenLine", values: arrayItemTexts(steps.map((step) => step.spokenLine)) },
    { key: "hook_options", values: arrayItemTexts((card.hook_performance_pack as Json | undefined)?.hook_options ?? []) },
    { key: "scene_script", values: arrayItemTexts(card.scene_script) },
    { key: "shot_list", values: arrayItemTexts(card.shot_list) },
    { key: "b_roll_plan", values: arrayItemTexts(card.b_roll_plan) },
    { key: "editing_timeline", values: arrayItemTexts(card.editing_timeline) },
    { key: "execution_ranges", values: arrayItemTexts(card.execution_ranges) },
    { key: "per_second_frames", values: arrayItemTexts(card.per_second_frames) },
  ];
  const duplicateSections: Json[] = [];
  let duplicatePairCount = 0;

  for (const check of checks) {
    const pairs = duplicatePairs(check.values);
    if (!pairs.length) continue;
    duplicatePairCount += pairs.length;
    duplicateSections.push({
      section: check.key,
      duplicate_pairs: pairs.slice(0, 5),
      item_count: check.values.length,
    });
  }

  const totalItems = checks.reduce((sum, check) => sum + check.values.length, 0);
  const penalty = Math.min(45, duplicatePairCount * 9);
  const varietyBonus = Math.min(20, totalItems);
  const score = clampQuality(80 + varietyBonus - penalty);

  return {
    score,
    duplicate_pair_count: duplicatePairCount,
    duplicate_sections: duplicateSections,
    total_checked_items: totalItems,
  };
}

function claimEvidenceRows(candidate: Json, card: Json, safetyClassifier: Json) {
  const rows: Json[] = [];
  const boundaries = asArray(safetyClassifier.claim_boundaries).map(String);
  const brandSafetyText = normalizedText(objectText(card.brand_safety));
  const schemaV2 = Number(card.schemaVersion ?? card.schema_version) === 2 && Array.isArray(card.steps);
  const evidenceSourceText = schemaV2 ? objectText(card) : objectText(card.brand_safety);
  const evidenceText = schemaV2 ? normalizedText(evidenceSourceText) : brandSafetyText;
  const evidenceUrlMatch = evidenceSourceText.match(/https?:\/\/[^\s)]+/i);
  const hasEvidenceNote = evidenceNotePattern.test(evidenceText);
  const claimText = String(candidate.one_sentence_premise ?? candidate.title ?? "").slice(0, 500);

  for (const boundary of boundaries) {
    if (boundary === "sponsor_disclosure") {
      const hasDisclosure = schemaV2 ? hasEarlySponsorDisclosure(card) : disclosurePattern.test(evidenceText);
      rows.push({
        idea_id: candidate.id,
        generation_batch_id: candidate.generation_batch_id,
        claim_type: boundary,
        claim_text: hasDisclosure ? "Sponsor disclosure present in creator guidance." : claimText,
        evidence_url: null,
        evidence_status: hasDisclosure ? "provided" : "missing",
        metadata: { source: "quality_gate_v2_1", creator_visible: false },
      });
      continue;
    }

    rows.push({
      idea_id: candidate.id,
      generation_batch_id: candidate.generation_batch_id,
      claim_type: boundary,
      claim_text: claimText,
      evidence_url: evidenceUrlMatch?.[0] ?? null,
      evidence_status: evidenceUrlMatch ? "provided" : hasEvidenceNote ? "needs_review" : "missing",
      metadata: { source: "quality_gate_v2_1", creator_visible: false },
    });
  }

  return rows;
}

function aggregateClaimEvidenceStatus(rows: Json[]) {
  if (!rows.length) return "not_required";
  if (rows.some((row) => row.evidence_status === "missing")) return "missing";
  if (rows.some((row) => row.evidence_status === "needs_review")) return "needs_review";
  return "provided";
}

function secondOpinionResult(params: {
  duplicateScore: number;
  safetyClassifier: Json;
  brandScore: number;
  claimEvidenceStatus: string;
  decision: string;
}) {
  const reasons: string[] = [];
  const flags = asArray(params.safetyClassifier.flags).map(String);
  const severity = String(params.safetyClassifier.severity ?? "clear");
  const riskLevel = String(params.safetyClassifier.category_risk_level ?? "low");

  if (riskLevel === "restricted") reasons.push("restricted_category");
  if (severity === "human_review") reasons.push("safety_human_review");
  if (flags.includes("dangerous_challenge_review")) reasons.push("dangerous_challenge");
  if (flags.includes("missing_sponsor_disclosure")) reasons.push("missing_sponsor_disclosure");
  if (params.claimEvidenceStatus === "missing") reasons.push("missing_claim_evidence");
  if (params.claimEvidenceStatus === "needs_review") reasons.push("claim_evidence_needs_review");
  if (params.brandScore < 70) reasons.push("low_brand_safety");
  if (params.duplicateScore >= 0.86) reasons.push("semantic_duplicate_high");
  if (params.decision === "human_review_required") reasons.push("decision_requires_human_review");

  return {
    required: reasons.length > 0,
    reasons: reasons.length ? [...new Set(reasons)] : ["not_required"],
  };
}

function arrayLength(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function objectText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(objectText).join(" ");
  if (typeof value === "object") return Object.values(value as Json).map(objectText).join(" ");
  return "";
}

function classifySafety(candidate: Json, card: Json, category: Json) {
  const schemaV2 = Number(card.schemaVersion ?? card.schema_version) === 2 && Array.isArray(card.steps);
  const creatorCardText = normalizedText(objectText(card));
  const text = normalizedText([
    candidate.title,
    candidate.one_sentence_premise,
    objectText(candidate.hook_options),
    objectText(candidate.story_beats),
    objectText(card),
    objectText(candidate.decision_trace),
  ].join(" "));
  const brandSafetyText = normalizedText(objectText(card.brand_safety));
  const safetyEvidenceText = schemaV2 ? creatorCardText : brandSafetyText;
  const riskScanText = schemaV2 ? creatorCardText : text;
  const flags: string[] = privacySafetyFlags(card);
  const claimBoundaries: string[] = [];

  const stringFields = (value: unknown): string[] => typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value).flatMap(stringFields) : [];
  const claimScanText = normalizedText(stringFields(card).flatMap((field) => field.split(/(?<=[.!?;])\s+|\bbut\b/i)).filter((sentence) => !/^\s*(never\b|do not\b|don't\b|avoid\b|this is not medical advice\b)/i.test(sentence)).join(" "));
  const explicitNoMedicalClaim = noMedicalClaimPattern.test(riskScanText);
  const healthRisk = (schemaV2
    ? schemaV2HealthClaimPattern.test(claimScanText)
    : !explicitNoMedicalClaim && healthRiskPattern.test(riskScanText));
  const financeRisk = financeRiskPattern.test(riskScanText);
  const childRisk = childRiskPattern.test(riskScanText);
  const sponsorRisk = schemaV2 ? needsSponsorDisclosure(card) : sponsorRiskPattern.test(riskScanText);
  const dangerousChallengeRisk = dangerousChallengePattern.test(riskScanText);

  if (healthRisk) flags.push("health_or_body_claim_review");
  if (financeRisk) flags.push("finance_claim_review");
  if (childRisk) flags.push("minor_privacy_review");
  if (dangerousChallengeRisk) flags.push("dangerous_challenge_review");
  if (sponsorRisk && !(schemaV2 ? hasEarlySponsorDisclosure(card) : disclosurePattern.test(safetyEvidenceText))) {
    flags.push("missing_sponsor_disclosure");
  }
  if (String(category.risk_level ?? "low") === "restricted") flags.push("restricted_category_human_review");
  if (healthRisk && !claimBoundaryPattern.test(safetyEvidenceText)) {
    flags.push("missing_claim_boundary");
  }

  if (healthRisk) claimBoundaries.push("health_body_claim");
  if (financeRisk) claimBoundaries.push("finance_claim");
  if (sponsorRisk) claimBoundaries.push("sponsor_disclosure");
  if (childRisk) claimBoundaries.push("minor_privacy");

  const severity = flags.some((flag) => flag.includes("dangerous") || flag.includes("restricted"))
    ? "human_review"
    : flags.length >= 2
    ? "refine"
    : flags.length === 1
    ? "watch"
    : "clear";

  return {
    flags,
    severity,
    claim_boundaries: claimBoundaries,
    category_risk_level: category.risk_level ?? "low",
    checked_at: new Date().toISOString(),
  };
}

function creatorFitScore(candidate: Json, personaSlug: string) {
  const layers = asArray(candidate.content_style_layers);
  const mechanisms = asArray(candidate.mechanism_ids);
  const personaMatched = Boolean(candidate.persona_id) || Boolean(personaSlug);
  return clampQuality(
    55 +
      (personaMatched ? 18 : 0) +
      Math.min(layers.length, 5) * 3 +
      Math.min(mechanisms.length, 4) * 3,
  );
}

function platformFitScore(candidate: Json, card: Json, platform: string) {
  const variantPack = card.variant_pack as Json | undefined;
  const timeline = arrayLength(card.editing_timeline);
  const shotCount = arrayLength(card.shot_list);
  let score = 50 + Math.min(timeline, 5) * 5 + Math.min(shotCount, 5) * 4;
  if (platform === "instagram_reels" && hasNonEmptyText(variantPack?.reels)) score += 10;
  if (platform === "instagram_stories" && hasNonEmptyText(variantPack?.story)) score += 10;
  if (platform === "instagram_carousel" && hasNonEmptyText(variantPack?.carousel)) score += 10;
  if (hasNonEmptyArray(candidate.hook_options)) score += 5;
  return clampQuality(score);
}

function brandSafetyScore(card: Json, safetyClassifier: Json) {
  if (Number(card.schemaVersion ?? card.schema_version) === 2 && Array.isArray(card.steps)) {
    const severity = String(safetyClassifier.severity ?? "clear");
    return schemaV2BrandSafetyScore({
      flagCount: arrayLength(safetyClassifier.flags),
      severity: ["clear", "watch", "refine", "human_review"].includes(severity)
        ? severity as "clear" | "watch" | "refine" | "human_review"
        : "human_review",
      categoryRiskLevel: String(safetyClassifier.category_risk_level ?? "low"),
    });
  }
  const brandSafety = card.brand_safety as Json | undefined;
  let score = 45;
  for (const key of ["disclosure_text", "claim_boundary", "do_not_say", "evidence_note", "safer_alternative_phrase"]) {
    const value = brandSafety?.[key];
    if (hasNonEmptyText(value) || hasNonEmptyArray(value)) score += 9;
  }
  score -= arrayLength(safetyClassifier.flags) * 12;
  return clampQuality(score);
}

function categoryLayerPolicyScore(card: Json, layerPolicy: CategoryLayerPolicy) {
  const appliedLayers = appliedLayersFromCard(card);
  const required = uniqueStrings(layerPolicy.required_layers);
  const optional = uniqueStrings([...layerPolicy.optional_layers, ...layerPolicy.premium_layers]);
  const missingRequired = required.filter((layer) => !appliedLayers.includes(layer));
  const requiredCoverage = required.length
    ? (required.length - missingRequired.length) / required.length
    : 1;
  const optionalHits = optional.filter((layer) => appliedLayers.includes(layer)).length;
  const practicalEffects = (card.category_layer_pack as Json | undefined)?.practical_effects;
  const effectHits = required.filter((layer) => layerPracticalEffectExists(practicalEffects, layer)).length;
  const effectCoverage = required.length ? effectHits / required.length : 1;
  const score = 35 + requiredCoverage * 42 + effectCoverage * 16 + Math.min(optionalHits, 3) * 2.5;

  return {
    score: clampQuality(score),
    applied_layers: appliedLayers,
    missing_required_layers: missingRequired,
    required_coverage: Math.round(requiredCoverage * 10000) / 10000,
    practical_effect_coverage: Math.round(effectCoverage * 10000) / 10000,
    optional_layer_hits: optionalHits,
  };
}

function premiumCompletenessScore(card: Json, layerPolicy: CategoryLayerPolicy) {
  const hookPack = card.hook_performance_pack as Json | undefined;
  const captionPack = card.caption_pack as Json | undefined;
  let score = 45;
  score += Math.min(arrayLength(hookPack?.hook_options), 5) * 4;
  score += Math.min(arrayLength(card.scene_script), 5) * 3;
  score += Math.min(arrayLength(card.shot_list), 5) * 3;
  score += Math.min(arrayLength(card.b_roll_plan), 6) * 2;
  score += Math.min(arrayLength(card.editing_timeline), 5) * 2;
  score += Math.min(arrayLength(captionPack?.caption_options), 3) * 2;
  if (hasNonEmptyText(card.brand_lift_statement)) score += 4;
  if (hasNonEmptyText(card.premium_decision_note)) score += 4;
  if (card.strategic_value && typeof card.strategic_value === "object") score += 4;
  if (card.production_plan && typeof card.production_plan === "object") score += 3;
  const layerScore = categoryLayerPolicyScore(card, layerPolicy).score;
  return clampQuality(score * 0.86 + layerScore * 0.14);
}

function evaluateQualityCheck(
  candidate: Json,
  card: Json,
  category: Json,
  layerPolicy: CategoryLayerPolicy,
  personaSlug: string,
  platform: string,
  duplicate: { score: number; strictScore: number; ideaId: string | null; fingerprint?: Json | null },
  feedbackSummary?: Json | null,
  creatorFeedbackSummary?: Json | null,
  semanticMatch?: { score: number | null; model: string | null; version: string | null; ideaId: string | null },
  verification?: { contentHash: string; blockers: string[] },
) {
  const rawCard = card;
  if (!isV2IdeaCard(card)) card = adaptLegacyIdeaCard(card, { ideaId: String(candidate.id) }).card as unknown as Json;
  const safetyClassifier = classifySafety(candidate, card, category);
  const layerPolicyEvaluation = categoryLayerPolicyScore(card, layerPolicy);
  const premiumScore = premiumCompletenessScore(card, layerPolicy);
  const creatorScore = creatorFitScore(candidate, personaSlug);
  const platformScore = platformFitScore(candidate, card, platform);
  const brandScore = brandSafetyScore(card, safetyClassifier);
  const claimRows = claimEvidenceRows(candidate, card, safetyClassifier);
  const claimEvidenceStatus = aggregateClaimEvidenceStatus(claimRows);
  // V3 has no verified reach/watch/share telemetry. Keep the legacy database
  // field neutral and never infer performance from categorical outcome labels.
  const performanceScore = 50;
  const signature = lexicalSignature(candidate, card);
  const richSignature = richCardSignature(candidate, card);
  const elementDiversity = cardElementDiversity(card);
  const feedbackCount = Number(creatorFeedbackSummary?.shot_rating_count ?? 0);
  const feedbackAdjustment = feedbackCount >= 20
    ? Math.max(-5, Math.min(5, Number(creatorFeedbackSummary?.quality_adjustment ?? 0)))
    : 0;
  const generationContext = generationQualityContext(candidate.decision_trace);
  const v22 = evaluateIdeaCardV22(card, {
    ...generationContext,
    rawInput: rawCard,
    additionalIssueCodes: verification?.blockers ?? (isV2IdeaCard(rawCard) ? ["generation_verification_missing"] : []),
    fingerprintScore: duplicate.strictScore,
    semanticScore: semanticMatch?.score ?? null,
    embeddingModel: semanticMatch?.model ?? null,
    embeddingModelVersion: semanticMatch?.version ?? null,
    requireOriginalityEvidence: true,
    safetyFlags: [
      ...stringArray(safetyClassifier.flags),
      ...(claimEvidenceStatus === "missing" ? ["missing_claim_evidence"] : []),
      ...(claimEvidenceStatus === "needs_review" ? ["claim_evidence_review"] : []),
    ],
    feedbackAdjustment,
  });
  const editorialScore = v22.adjustedScore;
  const baseDecision = v22.decision as QualityDecision;
  const secondOpinion = secondOpinionResult({
    duplicateScore: Math.max(duplicate.score, duplicate.strictScore, semanticMatch?.score ?? 0),
    safetyClassifier,
    brandScore,
    claimEvidenceStatus,
    decision: baseDecision,
  });
  const decision = {
    decision: secondOpinion.required && baseDecision === "approve" ? "refine" : baseDecision,
    reasons: [...new Set([
      ...v22.hardGateCodes,
      ...v22.issueCodes,
      ...v22.humanReviewReasons,
      ...(secondOpinion.required ? secondOpinion.reasons : []),
    ])],
  };

  return {
    claimEvidenceRows: claimRows,
    qualityRow: {
    idea_id: candidate.id,
    generation_batch_id: candidate.generation_batch_id,
    category_id: candidate.category_id,
    persona_id: candidate.persona_id,
    semantic_duplicate_score: semanticMatch?.score ?? null,
    embedding_duplicate_score: semanticMatch?.score ?? null,
    duplicate_of_idea_id: semanticMatch?.ideaId ?? duplicate.ideaId,
    lexical_signature: {
      ...signature,
      rich_card_signature: richSignature,
      duplicate_match: duplicate.fingerprint ?? null,
      element_diversity: elementDiversity,
    },
    safety_classifier: safetyClassifier,
    claim_evidence_status: claimEvidenceStatus,
    premium_completeness_score: premiumScore,
    creator_fit_score: creatorScore,
    platform_fit_score: platformScore,
    brand_safety_score: brandScore,
    performance_calibrated_score: performanceScore,
    editorial_quality_score: editorialScore,
    craft_score: v22.craftScore,
    craft_scores: v22.dimensions,
    embedding_model: semanticMatch?.model ?? null,
    embedding_model_version: semanticMatch?.version ?? null,
    decision: decision.decision,
    reasons: decision.reasons,
    second_opinion_required: false,
    second_opinion_reasons: secondOpinion.reasons,
    evaluator_version: QUALITY_GATE_VERSION,
    metadata: {
      card_hash: verification?.contentHash ?? null,
      card_snapshot: cardSnapshot(rawCard),
      policy_version: AUTOMATIC_POLICY_VERSION,
      creator_visible: false,
      evaluated_at: new Date().toISOString(),
      performance_feedback: feedbackSummary ?? { total: 0, note: "no_feedback_available" },
      creator_feedback: creatorFeedbackSummary ?? { shot_rating_count: 0, quality_adjustment: 0 },
      embedding_status: semanticMatch?.score === null || semanticMatch?.score === undefined ? "not_computed" : "computed",
      creator_feedback_adjustment: v22.feedbackAdjustment,
      creator_feedback_components: ["filmability", "natural_language"],
      duration_policy: {
        runtime_profile: runtimeProfileForSeconds(Number(card.durationSeconds ?? card.duration_seconds ?? 0)),
        duration_seconds: Number(card.durationSeconds ?? card.duration_seconds ?? 0),
        production_estimate_version: String(jsonObject(card.productionEstimate).version ?? "not_available"),
        creator_visible: false,
      },
      uniqueness_policy: {
        no_duplicate_card_creation: true,
        strict_duplicate_score: duplicate.strictScore,
        element_diversity_score: elementDiversity.score,
        duplicate_element_pair_count: elementDiversity.duplicate_pair_count,
        creator_visible: false,
      },
      category_layer_policy: {
        policy_slug: layerPolicy.policy_slug,
        scope_type: layerPolicy.scope_type,
        required_layers: layerPolicy.required_layers,
        premium_layers: layerPolicy.premium_layers,
        score: layerPolicyEvaluation.score,
        required_coverage: layerPolicyEvaluation.required_coverage,
        practical_effect_coverage: layerPolicyEvaluation.practical_effect_coverage,
        missing_required_layers: layerPolicyEvaluation.missing_required_layers,
        optional_layer_hits: layerPolicyEvaluation.optional_layer_hits,
        creator_visible: false,
      },
    },
    },
  };
}

async function cardsForIdeas(ideaIds: string[]) {
  const cards = new Map<string, Json>();
  for (const idChunk of chunks(ideaIds, 100)) {
    const rows = await getRows("idea_cards", `select=idea_id,card&idea_id=in.(${idChunk.join(",")})`) as Json[];
    for (const row of rows) cards.set(String(row.idea_id), row.card as Json);
  }
  return cards;
}

async function duplicatePool(categoryId: string, personaId: string) {
  void categoryId; void personaId;
  return await getRows(
    "idea_candidates",
    `select=id,title,one_sentence_premise,category_id,persona_id,generation_batch_id,hook_options&order=created_at.desc&limit=500`,
  ) as Json[];
}

type DuplicateCandidate = { candidate: Json; card: Json; signature?: Json };

function signatureSimilarity(left: DuplicateCandidate, right: DuplicateCandidate) {
  const leftSections: Json = left.signature ?? richCardSignature(left.candidate, left.card);
  const rightSections: Json = right.signature ?? richCardSignature(right.candidate, right.card);
  const sectionScores = [
    tokenSimilarity(String(leftSections.premise), String(rightSections.premise)),
    tokenSimilarity(String(leftSections.hook), String(rightSections.hook)),
    tokenSimilarity(String(leftSections.scene), String(rightSections.scene)),
    tokenSimilarity(String(leftSections.shot), String(rightSections.shot)),
    tokenSimilarity(String(leftSections.edit), String(rightSections.edit)),
    tokenSimilarity(String(leftSections.broll), String(rightSections.broll)),
  ];
  const availableWeight = ["premise", "hook", "scene", "shot", "edit", "broll"].reduce((sum, key, index) =>
    sum + (leftSections[key] && rightSections[key] ? [0.18, 0.18, 0.20, 0.16, 0.18, 0.10][index] : 0), 0);
  const weighted = (
    sectionScores[0] * 0.18 +
    sectionScores[1] * 0.18 +
    sectionScores[2] * 0.20 +
    sectionScores[3] * 0.16 +
    sectionScores[4] * 0.18 +
    sectionScores[5] * 0.10
  ) / Math.max(availableWeight, 0.01);
  const leftFingerprint = String(leftSections.fingerprint ?? "");
  const rightFingerprint = String(rightSections.fingerprint ?? "");
  const exactFingerprint = leftFingerprint.length > 0 && leftFingerprint === rightFingerprint;
  const actionClone = tokenSimilarity(String(leftSections.action ?? ""), String(rightSections.action ?? "")) >= 0.92 && sectionScores[2] >= 0.8;

  return {
    score: Math.round((exactFingerprint ? 1 : Math.max(weighted, actionClone ? 0.92 : 0)) * 10000) / 10000,
    signature: rightSections,
    section_scores: {
      premise: sectionScores[0],
      hook: sectionScores[1],
      scene: sectionScores[2],
      shot: sectionScores[3],
      edit: sectionScores[4],
      broll: sectionScores[5],
    },
  };
}

function bestDuplicate(candidate: Json, card: Json, pool: DuplicateCandidate[]) {
  const currentText = `${candidate.title ?? ""} ${candidate.one_sentence_premise ?? ""}`;
  const currentSignature = richCardSignature(candidate, card);
  let best = { score: 0, strictScore: 0, ideaId: null as string | null, fingerprint: null as Json | null };
  for (const other of pool) {
    if (String(other.candidate.id) === String(candidate.id)) continue;
    const otherText = `${other.candidate.title ?? ""} ${other.candidate.one_sentence_premise ?? ""}`;
    const score = tokenSimilarity(currentText, otherText);
    const strict = signatureSimilarity({ candidate, card, signature: currentSignature }, other);
    const combinedStrictScore = Math.max(strict.score, score >= 0.74 && strict.score >= 0.68 ? 0.9 : strict.score);
    if (Math.max(score, combinedStrictScore) > Math.max(best.score, best.strictScore)) {
      best = {
        score,
        strictScore: combinedStrictScore,
        ideaId: String(other.candidate.id),
        fingerprint: {
          matched_idea_id: String(other.candidate.id),
          strict_score: combinedStrictScore,
          lexical_score: score,
          section_scores: strict.section_scores,
          matched_signature: strict.signature,
        },
      };
    }
  }
  return best;
}

async function creatorFeedbackSummary(categoryId: string, personaId: string, platform: string, language: string) {
  const rows = await getRows(
    "idea_creator_feedback_lane_summary",
    `select=shot_rating_count,average_shot_rating,quality_adjustment&category_id=eq.${categoryId}&persona_id=eq.${personaId}&platform=eq.${encodeURIComponent(platform)}&language=eq.${encodeURIComponent(language)}&limit=1`,
  ) as Json[];
  return rows[0] ?? { shot_rating_count: 0, average_shot_rating: null, quality_adjustment: 0 };
}

function scoreCandidate(candidate: Json) {
  // Craft scorer: structure + content signals only. No id/title hash lottery.
  const mechanismCount = asArray(candidate.mechanism_ids).length;
  const hookCount = asArray(candidate.hook_options).length;
  const layerCount = asArray(candidate.content_style_layers).length;
  const beatCount = asArray(candidate.story_beats).length;
  const title = String(candidate.title ?? "").trim();
  const premise = String(candidate.one_sentence_premise ?? "").trim();
  const titleWords = title ? title.split(/\s+/).filter(Boolean).length : 0;
  const premiseWords = premise ? premise.split(/\s+/).filter(Boolean).length : 0;
  const hasConcreteNumber = /\d/.test(`${title} ${premise}`);
  const hasQuestionHook = /\?/.test(`${title} ${premise}`);
  const hasActionVerb =
    /\b(hold|show|cut|open|close|turn|lift|set|tap|press|wipe|frame|step|pick|pull|push|write|draw|swipe|pour|tilt|remove|place)\b/i
      .test(`${title} ${premise}`);
  const craftBonus =
    Math.min(titleWords, 8) * 0.6 +
    Math.min(premiseWords, 18) * 0.35 +
    (hasConcreteNumber ? 4 : 0) +
    (hasQuestionHook ? 3 : 0) +
    (hasActionVerb ? 4 : 0);
  const structure =
    Math.min(mechanismCount, 4) * 4 +
    Math.min(hookCount, 4) * 3 +
    Math.min(layerCount, 5) * 2 +
    Math.min(beatCount, 8) * 1.25;
  const base = 42 + structure + craftBonus;
  const craftStructureScore = clampScore(base);
  // Novelty from lexical diversity vs length — deterministic, content-based.
  const uniqueTokenRatio = (() => {
    const tokens = `${title} ${premise}`.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    if (!tokens.length) return 0;
    return new Set(tokens).size / tokens.length;
  })();
  const noveltyScore = clampScore(48 + uniqueTokenRatio * 40 + Math.min(mechanismCount, 4) * 2);
  // Saturation: thinner structure → higher penalty (prefer rich craft cards).
  const saturationPenalty = clampScore(Math.max(0, 14 - structure * 0.35 - craftBonus * 0.15));

  return {
    idea_id: candidate.id,
    // No reach/watch/share outcome data exists, so V3 must not synthesize a
    // viral probability. The legacy dimension columns remain craft-only.
    viral_potential_score: null,
    psychology_fit_score: clampScore(craftStructureScore - 3 + Math.min(hookCount, 4) + (hasQuestionHook ? 2 : 0)),
    human_awareness_score: clampScore(craftStructureScore - 2 + Math.min(layerCount, 4) + (hasActionVerb ? 2 : 0)),
    feasibility_score: clampScore(68 + Math.min(beatCount, 6) * 2.5 + (hasActionVerb ? 3 : 0)),
    novelty_score: noveltyScore,
    comedy_remix_fit: clampScore(50 + Math.min(mechanismCount, 5) * 5),
    demand_opportunity_score: clampScore(craftStructureScore - 2),
    saturation_penalty: saturationPenalty,
    trust_sustainability_score: clampScore(craftStructureScore - 1 + (hasConcreteNumber ? 1 : 0)),
    config_version: "3.0.0-craft-readiness-no-viral-probability",
    score_breakdown: {
      scorer: "craft_structure_v1",
      inputs: {
        mechanism_count: mechanismCount,
        hook_count: hookCount,
        content_style_layer_count: layerCount,
        story_beat_count: beatCount,
        title_words: titleWords,
        premise_words: premiseWords,
        has_concrete_number: hasConcreteNumber,
        has_question_hook: hasQuestionHook,
        has_action_verb: hasActionVerb,
        unique_token_ratio: Number(uniqueTokenRatio.toFixed(3)),
        craft_bonus: Number(craftBonus.toFixed(2)),
        structure: Number(structure.toFixed(2)),
      },
      creator_visible: false,
    },
  };
}

async function scoreBatch(batchId: string, body: Json = {}) {
  const batch = await resolveBatch(batchId);
  const category = await lookupCategoryById(String(batch.category_id));
  const persona = await lookupById("creator_personas", String(batch.persona_id));
  const layerPolicy = await lookupCategoryLayerPolicy(
    String(category.slug),
    String(category.family ?? ""),
    String(batch.platform),
  );
  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, { status: "scoring" });
  const limit = Math.max(1, Math.min(Number(body.limit ?? body.chunk_size ?? 10000), 500));
  const offset = Math.max(0, Number(body.offset ?? 0));

  const candidates = await getRows(
    "idea_candidates",
    `select=id,title,one_sentence_premise,mechanism_ids,hook_options,story_beats,content_style_layers,safety_status,generation_batch_id,category_id,persona_id,platform,decision_trace&generation_batch_id=eq.${batch.id}&order=created_at.asc&limit=${limit}&offset=${offset}`,
  ) as Json[];
  const scoreRows = candidates.map(scoreCandidate);
  const cards = await cardsForIdeas(candidates.map((candidate) => String(candidate.id)));
  const qualityIds = candidates.map((candidate) => String(candidate.id));
  const existingEmbeddingRows: Json[] = [];
  for (const ids of chunks(qualityIds, 100)) existingEmbeddingRows.push(...await getRows("idea_semantic_embeddings", `select=idea_id,embedding_model,source_text_hash,metadata&idea_id=in.(${ids.join(",")})`) as Json[]);
  const corpusState = (await getRows("idea_embedding_corpus_state", "select=card_count,revision"))[0] as Json | undefined;
  const embeddingByIdea = new Map(existingEmbeddingRows.map((row) => [String(row.idea_id), row]));
  const externalDuplicatePool = await duplicatePool(String(batch.category_id), String(batch.persona_id));
  const poolCards = await cardsForIdeas(externalDuplicatePool.map((candidate) => String(candidate.id)));
  const duplicateCandidates = externalDuplicatePool.map((candidate) => ({
    candidate,
    card: poolCards.get(String(candidate.id)) ?? cards.get(String(candidate.id)) ?? {},
  })).map((entry) => ({
    ...entry,
    signature: richCardSignature(entry.candidate, entry.card),
  }));
  const feedbackSummary = null;
  const creatorFeedback = await creatorFeedbackSummary(
    String(batch.category_id),
    String(batch.persona_id),
    String(batch.platform),
    String(batch.language ?? "en"),
  );
  const currentEntries = candidates.map((candidate) => {
    const card = cards.get(String(candidate.id)) ?? {};
    return {
      candidate,
      card,
      signature: richCardSignature(candidate, card),
    };
  });
  const qualityEvaluations = await Promise.all(candidates.map(async (candidate, index) => {
    const candidateEntry = currentEntries[index];
    const candidateCard = candidateEntry.card;
    const sameBatchWindow = currentEntries.slice(Math.max(0, index - 24), index);
    const contentHash = await cardContentHash(candidateCard);
    const embedding = embeddingByIdea.get(String(candidate.id));
    const embeddingMeta = jsonObject(embedding?.metadata);
    const embeddingFresh = embedding?.source_text_hash === await sha256(semanticDocument(candidateCard))
      && embeddingMeta.document_version === SEMANTIC_DOCUMENT_VERSION && embeddingMeta.corpus_complete === true && embeddingMeta.comparison_scope === "global"
      && corpusState && embeddingMeta.corpus_revision === corpusState.revision && Number(embeddingMeta.corpus_count) === Number(corpusState.card_count);
    const generationBlockers = isV2IdeaCard(candidateCard) ? automaticGenerationBlockers(candidate.decision_trace, contentHash) : [];
    if (!embeddingFresh) generationBlockers.push("embedding_missing_or_stale");
    const evaluation = evaluateQualityCheck(
      candidate,
      candidateCard,
      category,
      layerPolicy,
      String(persona.slug),
      String(batch.platform),
      bestDuplicate(candidate, candidateCard, [...duplicateCandidates, ...sameBatchWindow]),
      feedbackSummary,
      creatorFeedback,
      {
        score: !embeddingFresh || embeddingMeta.nearest_similarity === null || embeddingMeta.nearest_similarity === undefined
          ? null
          : Number(jsonObject(embeddingByIdea.get(String(candidate.id))?.metadata).nearest_similarity),
        model: embeddingByIdea.get(String(candidate.id))?.embedding_model ? String(embeddingByIdea.get(String(candidate.id))?.embedding_model) : null,
        version: jsonObject(embeddingByIdea.get(String(candidate.id))?.metadata).model_version ? String(jsonObject(embeddingByIdea.get(String(candidate.id))?.metadata).model_version) : null,
        ideaId: jsonObject(embeddingByIdea.get(String(candidate.id))?.metadata).nearest_idea_id ? String(jsonObject(embeddingByIdea.get(String(candidate.id))?.metadata).nearest_idea_id) : null,
      },
      { contentHash, blockers: generationBlockers },
    );
    return {
      ...evaluation,
      embeddingFresh: Boolean(embeddingFresh),
      qualityRow: { ...evaluation.qualityRow, metadata: { ...evaluation.qualityRow.metadata, semantic_hash: await sha256(semanticDocument(candidateCard)), corpus_revision: embeddingFresh ? corpusState?.revision : null, corpus_count: embeddingFresh ? corpusState?.card_count : null } },
    };
  }));
  const qualityRows = qualityEvaluations.map((evaluation) => evaluation.qualityRow);
  const claimEvidenceRowsForBatch = qualityEvaluations.flatMap((evaluation) => evaluation.claimEvidenceRows);

  for (let i = 0; i < scoreRows.length; i += 500) {
    await postRows("idea_scores", scoreRows.slice(i, i + 500), "return=minimal");
  }

  for (let i = 0; i < qualityRows.length; i += 500) {
    await postRows(
      "idea_quality_checks?on_conflict=idea_id",
      qualityRows.slice(i, i + 500),
      "resolution=merge-duplicates,return=minimal",
    );
  }

  const candidateIdsByStatus = new Map<string, string[]>();
  for (const row of qualityRows) {
    const status = candidateStatusForQualityDecision(row.decision as QualityDecision);
    const ideaIds = candidateIdsByStatus.get(status) ?? [];
    ideaIds.push(String(row.idea_id));
    candidateIdsByStatus.set(status, ideaIds);
  }
  for (const [status, ideaIds] of candidateIdsByStatus) {
    for (const idChunk of chunks(ideaIds, 100)) {
      await patchRows(
        "idea_candidates",
        `generation_batch_id=eq.${batch.id}&id=in.(${idChunk.join(",")})`,
        { status },
      );
    }
  }

  // A V3 generation run owns exactly one requested card. Once its current
  // embedding and quality row are persisted, advance the durable state rather
  // than only deriving "completed" in the status response.
  const completedRunIds = [...new Set(qualityEvaluations.flatMap((evaluation, index) => {
    if (!evaluation.embeddingFresh) return [];
    const generation = jsonObject(jsonObject(candidates[index].decision_trace).generation);
    if (generation.taxonomy_version !== CREATIVE_TAXONOMY_VERSION) return [];
    const runId = String(generation.run_id ?? "");
    return isUuid(runId) ? [runId] : [];
  }))];
  for (const runIdChunk of chunks(completedRunIds, 100)) {
    await patchRows(
      "idea_generation_runs",
      `id=in.(${runIdChunk.join(",")})&generation_batch_id=eq.${batch.id}&stage=eq.awaiting_embedding`,
      { stage: "completed", heartbeat_at: new Date().toISOString() },
    );
  }

  for (let i = 0; i < claimEvidenceRowsForBatch.length; i += 500) {
    await postRows(
      "idea_claim_evidence?on_conflict=idea_id,claim_type,claim_text",
      claimEvidenceRowsForBatch.slice(i, i + 500),
      "resolution=merge-duplicates,return=minimal",
    );
  }

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: "scored",
    stats: {
      ...(batch.stats as Json),
      last_score_chunk: {
        offset,
        limit,
        scored: scoreRows.length,
        quality_checked: qualityRows.length,
        quality_approved: qualityRows.filter((row) => row.decision === "approve").length,
        quality_refine: qualityRows.filter((row) => row.decision === "refine").length,
        quality_rejected: qualityRows.filter((row) => row.decision === "reject").length,
        quality_human_review_required: qualityRows.filter((row) => row.decision === "human_review_required").length,
        claim_evidence_rows: claimEvidenceRowsForBatch.length,
        second_opinion_required: qualityRows.filter((row) => row.second_opinion_required === true).length,
      },
    },
  });

  return {
    batch_id: batch.id,
    scored: scoreRows.length,
    quality_checked: qualityRows.length,
    quality_approved: qualityRows.filter((row) => row.decision === "approve").length,
    quality_refine: qualityRows.filter((row) => row.decision === "refine").length,
    quality_rejected: qualityRows.filter((row) => row.decision === "reject").length,
    quality_human_review_required: qualityRows.filter((row) => row.decision === "human_review_required").length,
    claim_evidence_rows: claimEvidenceRowsForBatch.length,
    second_opinion_required: qualityRows.filter((row) => row.second_opinion_required === true).length,
    offset,
    limit,
  };
}

function scoreBand(score: number) {
  return score >= 80 ? "high" : "low";
}

function chunks<T>(rows: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    result.push(rows.slice(i, i + size));
  }

  return result;
}

async function generationRunStatus(batchId: string, runId: string) {
  if (!isUuid(runId)) throw new HttpError(400, "run_id must be a UUID");
  const rows = await getRows(
    "idea_generation_runs",
    `select=id,generation_batch_id,status,stage,shadow,requested_count,generated_count,imported_count,refine_count,reject_count,token_usage,latency_ms,gate_results,issue_counts,created_at,started_at,heartbeat_at,completed_at&id=eq.${runId}&generation_batch_id=eq.${batchId}&limit=1`,
  ) as Json[];
  if (!rows.length) throw new HttpError(404, "generation run not found");
  const run = rows[0];
  let stage = String(run.stage ?? run.status);
  let embeddingCount = 0;
  let qualityCount = 0;
  const importedCount = Number(run.imported_count ?? 0);
  if (stage === "awaiting_embedding" && importedCount > 0) {
    const candidates = await getPagedRows("idea_candidates", `select=id&decision_trace->generation->>run_id=eq.${runId}&order=created_at.asc`);
    const ids = candidates.map((candidate) => String(candidate.id));
    for (const idChunk of chunks(ids, 100)) {
      embeddingCount += (await getRows(
        "idea_semantic_embeddings",
        `select=idea_id&idea_id=in.(${idChunk.join(",")})&embedding=not.is.null&embedding_model=neq.pending`,
      ) as Json[]).length;
      qualityCount += (await getRows(
        "idea_quality_checks",
        `select=idea_id&idea_id=in.(${idChunk.join(",")})&evaluator_version=eq.${encodeURIComponent(QUALITY_GATE_VERSION)}`,
      ) as Json[]).length;
    }
    if (ids.length === importedCount && embeddingCount === importedCount && qualityCount === importedCount) stage = "completed";
  }
  return { ...run, stage, embedding_count: embeddingCount, quality_count: qualityCount };
}

function keepGenerationAlive(promise: Promise<unknown>) {
  const runtime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(value: Promise<unknown>): void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(promise);
  else void promise;
}

async function processQueuedGeneration(batchId: string, body: Json, runId: string) {
  try {
    await generateBatch(batchId, body, { processQueued: true });
  } catch {
    // Fail only an unclaimed queue item. Errors after the queued->running claim
    // are persisted by generateBatch's own catch block; a concurrent winner is
    // also left untouched because its status is no longer queued.
    await patchRows("idea_generation_runs", `id=eq.${runId}&status=eq.queued`, {
      status: "failed",
      stage: "failed",
      issue_counts: { queue_processing_failed: 1 },
      completed_at: new Date().toISOString(),
    }).catch(() => []);
  }
}

async function scoresForIdeas(ideaIds: string[]) {
  const latest = new Map<string, Json>();

  for (const idChunk of chunks(ideaIds, 100)) {
    // Publication only requires proof that deterministic scoring completed.
    // V3 deliberately stores no synthetic viral probability.
    const query = `select=idea_id,created_at&idea_id=in.(${idChunk.join(",")})&order=created_at.desc`;
    const rows = await getRows("idea_scores", query) as Json[];

    for (const row of rows) {
      const ideaId = String(row.idea_id);
      if (!latest.has(ideaId)) latest.set(ideaId, row);
    }
  }

  return latest;
}

function qualityFingerprintHash(row: Json | undefined) {
  const signature = row?.lexical_signature as Json | undefined;
  const rich = signature?.rich_card_signature as Json | undefined;
  const value = rich?.fingerprint_hash;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : "";
}

async function publishedFingerprintPool(categoryId: string, personaId: string) {
  void categoryId; void personaId;
  const inventoryRows = await getPagedRows(
    "idea_inventory",
    `select=idea_id&order=published_at.desc`,
  );
  const ideaIds = inventoryRows.map((row) => String(row.idea_id)).filter(Boolean);
  const fingerprints = new Map<string, string>();

  for (const idChunk of chunks(ideaIds, 100)) {
    const rows = await getRows(
      "idea_quality_checks",
      `select=idea_id,lexical_signature&idea_id=in.(${idChunk.join(",")})`,
    ) as Json[];
    for (const row of rows) {
      const hash = qualityFingerprintHash(row);
      if (hash) fingerprints.set(hash, String(row.idea_id));
    }
  }

  return fingerprints;
}

async function publishInventory(batchId: string, body: Json) {
  const batch = await resolveBatch(batchId);
  const generationRuns = await getPagedRows(
    "idea_generation_runs",
    `select=id,model_profile_id,profile_slug,shadow,status,prompt_version,schema_version,metadata&generation_batch_id=eq.${batch.id}&order=created_at.asc`,
  ) as Json[];
  const currentProfiles = await getPagedRows("idea_model_profiles", "select=*&enabled=eq.true&order=id.asc");
  const profilesById = new Map(currentProfiles.map((profile) => [String(profile.id), profile]));
  const publishableRuns = new Map(generationRuns.filter((run) => {
    const profile = profilesById.get(String(run.model_profile_id));
    const critic = profilesById.get(String(jsonObject(run.metadata).critic_profile_id));
    return run.shadow === false && ["completed", "partial"].includes(String(run.status)) && profile
      && run.prompt_version === PROMPT_VERSION && Number(run.schema_version) === 2
      && stableJson(jsonObject(run.metadata).generator_snapshot) === stableJson(modelContract(profile))
      && profileMatchesQualificationContract(profile, { promptVersion: PROMPT_VERSION, schemaVersion: 2, qualityGateVersion: QUALITY_GATE_VERSION })
      && criticMatchesQualificationContract(profile, critic);
  }).map((run) => [String(run.id), run]));
  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, { status: "publishing" });
  const hasChunk = body.limit !== undefined || body.chunk_size !== undefined || body.offset !== undefined;
  const limit = Math.max(1, Math.min(Number(body.limit ?? body.chunk_size ?? 10000), 500));
  const offset = Math.max(0, Number(body.offset ?? 0));
  const finalChunk = Boolean(body.final_chunk ?? body.complete ?? !hasChunk);

  const candidateQuery = `select=id,platform,language,content_style_layers,safety_status,status,decision_trace&generation_batch_id=eq.${batch.id}&order=created_at.asc`;
  const candidates = hasChunk
    ? await getRows("idea_candidates", `${candidateQuery}&limit=${limit}&offset=${offset}`) as Json[]
    : await getPagedRows("idea_candidates", candidateQuery);
  const scores = await scoresForIdeas(candidates.map((candidate) => String(candidate.id)));
  const qualityRows = await getPagedRows(
    "idea_quality_checks",
    `select=idea_id,decision,editorial_quality_score,craft_score,reasons,claim_evidence_status,second_opinion_required,lexical_signature,evaluator_version,embedding_duplicate_score,embedding_model,embedding_model_version,human_review_decision,metadata&generation_batch_id=eq.${batch.id}`,
  );
  const qualityByIdea = new Map(qualityRows.map((row) => [String(row.idea_id), row]));
  const publishedFingerprints = await publishedFingerprintPool(String(batch.category_id), String(batch.persona_id));
  const chunkFingerprints = new Map<string, string>();
  // ViralBox cards are one-time inventory assets. Ignore legacy reuse inputs.
  const maxReuseCount = 1;
  const qualityFloor = Math.max(90, Number(body.quality_floor ?? 90));
  const editorialQualityFloor = Math.max(90, Number(body.editorial_quality_floor ?? 90));
  if (!Number.isFinite(qualityFloor) || !Number.isFinite(editorialQualityFloor)) throw new HttpError(400, "Quality floors must be finite numbers");
  const inventoryRows: Json[] = [];
  const cardsByIdea = new Map<string, Json>();
  const existingInventoryIds = new Set<string>();
  const embeddingsByIdea = new Map<string, Json>();
  const corpusState = (await getRows("idea_embedding_corpus_state", "select=card_count,revision"))[0] as Json | undefined;
  for (const idChunk of chunks(candidates.map((candidate) => String(candidate.id)).filter(Boolean), 100)) {
    const [cardRows, existingInventory, embeddings] = await Promise.all([
      getRows("idea_cards", `select=idea_id,title,card&idea_id=in.(${idChunk.join(",")})`) as Promise<Json[]>,
      getRows("idea_inventory", `select=idea_id&idea_id=in.(${idChunk.join(",")})`) as Promise<Json[]>,
      getRows("idea_semantic_embeddings", `select=idea_id,embedding_model,source_text_hash,metadata&idea_id=in.(${idChunk.join(",")})`) as Promise<Json[]>,
    ]);
    for (const row of cardRows) {
      cardsByIdea.set(String(row.idea_id), row);
    }
    for (const row of existingInventory) existingInventoryIds.add(String(row.idea_id));
    for (const row of embeddings) embeddingsByIdea.set(String(row.idea_id), row);
  }

  for (const candidate of candidates) {
    const latestScore = scores.get(String(candidate.id));
    const quality = qualityByIdea.get(String(candidate.id));
    if (existingInventoryIds.has(String(candidate.id))) continue;
    if (!latestScore || candidate.safety_status !== "SAFE") continue;
    if (candidate.status !== "ready" || !quality) continue;
    if (candidate.language !== "en" || candidate.platform !== "instagram_reels") continue;
    const generation = jsonObject(jsonObject(candidate.decision_trace).generation);
    const generationRun = publishableRuns.get(String(generation.run_id));
    if (!generationRun) continue;
    const criticVerification = jsonObject(jsonObject(jsonObject(candidate.decision_trace).generation_gate).critic_verification);
    const runMetadata = jsonObject(generationRun.metadata);
    if (criticVerification.profile_id !== runMetadata.critic_profile_id || criticVerification.profile_hash !== runMetadata.critic_profile_hash) continue;
    const criticProfile = profilesById.get(String(criticVerification.profile_id));
    if (!criticProfile || criticVerification.profile_hash !== await sha256(stableJson(modelContract(criticProfile)))) continue;
    if (Number(quality.editorial_quality_score ?? 0) < editorialQualityFloor) continue;

    const rankScore = Number(quality.craft_score);
    if (rankScore < qualityFloor) continue;
    const cardRow = cardsByIdea.get(String(candidate.id));
    const importedCard = cardRow?.card && typeof cardRow.card === "object" && !Array.isArray(cardRow.card)
      ? cardRow.card as Json
      : undefined;
    if (!isRenderableImportedCard(importedCard, String(cardRow?.title ?? candidate.title ?? ""))) continue;
    const embedding = embeddingsByIdea.get(String(candidate.id));
    const embeddingMeta = jsonObject(embedding?.metadata);
    if (!corpusState || embeddingMeta.corpus_revision !== corpusState.revision || Number(embeddingMeta.corpus_count) !== Number(corpusState.card_count)) continue;
    if (publicationBlockers({ card: importedCard, trace: candidate.decision_trace, quality, contentHash: await cardContentHash(importedCard), semanticHash: await sha256(semanticDocument(importedCard)), gateVersion: QUALITY_GATE_VERSION, embedding }).length) continue;
    const fingerprintHash = qualityFingerprintHash(quality);
    if (fingerprintHash) {
      const existingIdeaId = publishedFingerprints.get(fingerprintHash) ?? chunkFingerprints.get(fingerprintHash);
      if (existingIdeaId && existingIdeaId !== String(candidate.id)) continue;
      chunkFingerprints.set(fingerprintHash, String(candidate.id));
    }

    inventoryRows.push({
      idea_id: candidate.id,
      category_id: batch.category_id,
      persona_id: batch.persona_id,
      platform: candidate.platform,
      language: candidate.language,
      content_style_layers: candidate.content_style_layers,
      internal_rank_score: rankScore,
      score_band: scoreBand(rankScore),
      quality_floor_passed: true,
      status: "available",
      max_reuse_count: maxReuseCount,
      metadata: {
        batch_id: batch.id,
        external_batch_id: batch.external_batch_id,
        quality_check_decision: quality.decision,
        editorial_quality_score: quality.editorial_quality_score,
        claim_evidence_status: quality.claim_evidence_status,
        second_opinion_required: quality.second_opinion_required,
        automatic_policy_version: AUTOMATIC_POLICY_VERSION,
        uniqueness_fingerprint_hash: fingerprintHash || null,
        duplicate_protected: true,
        creator_visible: false,
      },
    });
  }

  let insertedCount = 0;
  for (const rowChunk of chunks(inventoryRows, 500)) {
    const inserted = await postRows(
      "idea_inventory?on_conflict=idea_id",
      rowChunk,
      "resolution=ignore-duplicates,return=representation",
    ) as Json[];
    insertedCount += inserted.length;
  }

  const batchStats = (batch.stats as Json) ?? {};
  const publishedTotal = (await getPagedRows("idea_inventory", `select=idea_id&metadata->>batch_id=eq.${batch.id}&order=idea_id.asc`)).length;

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: finalChunk ? "published" : "publishing",
    completed_at: finalChunk ? new Date().toISOString() : batch.completed_at,
    stats: {
      ...batchStats,
      published_inventory: publishedTotal,
      last_publish_chunk: {
        offset,
        limit: hasChunk ? limit : candidates.length,
        considered: candidates.length,
        published_inventory: insertedCount,
        final_chunk: finalChunk,
      },
      quality_floor: qualityFloor,
      editorial_quality_floor: editorialQualityFloor,
    },
  });

  return {
    batch_id: batch.id,
    published_inventory: insertedCount,
    published_inventory_total: publishedTotal,
    offset: hasChunk ? offset : 0,
    limit: hasChunk ? limit : candidates.length,
    final_chunk: finalChunk,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    requireAdmin(req);

    const segments = routeSegments(req);
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));

    if (req.method === "POST" && (segments.length === 0 || segments.join("/") === "admin/generation-batches")) {
      return jsonResponse(201, await createBatch(body));
    }

    const profileRoute = segments[0] === "admin" ? segments.slice(1) : segments;
    if (req.method === "POST" && profileRoute[0] === "model-profiles" && profileRoute[1] && profileRoute[2] === "qualify") {
      const qualificationEvalId = String(body.qualification_eval_id ?? "");
      if (!isUuid(qualificationEvalId)) throw new HttpError(400, "qualification_eval_id must be a UUID");
      const result = await postRows("rpc/qualify_idea_model_profile", {
        p_profile_slug: profileRoute[1],
        p_eval_id: qualificationEvalId,
      }) as Json;
      return jsonResponse(200, result);
    }

    const batchId = segments[0] === "admin" ? segments[2] : segments[0];
    const action = segments[0] === "admin" ? segments[3] : segments[1];
    const actionResourceId = segments[0] === "admin" ? segments[4] : segments[2];

    if (!batchId || !action) {
      throw new HttpError(404, "Unknown admin generation batch route");
    }

    if (req.method === "POST" && action === "import") {
      return jsonResponse(200, await importBatch(batchId, body));
    }

    if ((req.method === "GET" || req.method === "POST") && action === "training-context") {
      return jsonResponse(200, await trainingContext(batchId, body));
    }

    if (req.method === "POST" && action === "generate") {
      const queued = await generateBatch(batchId, body, { queueOnly: true });
      keepGenerationAlive(processQueuedGeneration(batchId, body, String(queued.run_id)));
      return jsonResponse(202, queued);
    }

    if (req.method === "GET" && action === "runs" && actionResourceId) {
      return jsonResponse(200, await generationRunStatus(batchId, actionResourceId));
    }

    if (req.method === "POST" && action === "score") {
      return jsonResponse(200, await scoreBatch(batchId, body));
    }

    if (req.method === "POST" && action === "publish-inventory") {
      return jsonResponse(200, await publishInventory(batchId, body));
    }

    throw new HttpError(404, "Unknown admin generation batch action");
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message, details: error.details });
    }

    return jsonResponse(500, { error: error instanceof Error ? error.message : String(error) });
  }
});
