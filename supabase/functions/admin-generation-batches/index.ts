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

  const microBehaviorGuide = ideaCard.micro_behavior_guide as Json | undefined;
  if (microBehaviorGuide && typeof microBehaviorGuide === "object" && !Array.isArray(microBehaviorGuide)) {
    for (const key of ["facial_expression", "eye_contact", "product_handling", "camera_attention", "smile_timing", "avoid_over_advertising"]) {
      if (!hasNonEmptyText(microBehaviorGuide[key])) {
        errors.push(`idea_card.micro_behavior_guide.${key} is required`);
      }
    }
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
  return words.map(codeWord).join("\\\\s+");
}

const legacyDecisionFilterPattern = new RegExp(`\\\\bpremium\\\\s+${codePhrase([[107, 97, 114, 97, 114], [102, 105, 108, 116, 114, 101, 115, 105]])}\
\
async function generationRunStatus(batchId: string, runId: string) {\
  if (!isUuid(runId)) throw new HttpError(400, "run_id must be a UUID");\
  const rows = await getRows(\
    "idea_generation_runs",\
    `select=id,generation_batch_id,status,stage,shadow,requested_count,generated_count,imported_count,refine_count,reject_count,token_usage,latency_ms,gate_results,issue_counts,created_at,started_at,heartbeat_at,completed_at&id=eq.${runId}&generation_batch_id=eq.${batchId}&limit=1`,\
  ) as Json[];\
  if (!rows.length) throw new HttpError(404, "generation run not found");\
  const run = rows[0];\
  let stage = String(run.stage ?? run.status);\
  let embeddingCount = 0;\
  let qualityCount = 0;\
  const importedCount = Number(run.imported_count ?? 0);\
  if (stage === "awaiting_embedding" && importedCount > 0) {\
    const candidates = await getPagedRows("idea_candidates", `select=id&decision_trace->generation->>run_id=eq.${runId}&order=created_at.asc`);\
    const ids = candidates.map((candidate) => String(candidate.id));\
    for (const idChunk of chunks(ids, 100)) {\
      embeddingCount += (await getRows(\
        "idea_semantic_embeddings",\
        `select=idea_id&idea_id=in.(${idChunk.join(",")})&embedding=not.is.null&embedding_model=neq.pending`,\
      ) as Json[]).length;\
      qualityCount += (await getRows(\
        "idea_quality_checks",\
        `select=idea_id&idea_id=in.(${idChunk.join(",")})&evaluator_version=eq.${encodeURIComponent(QUALITY_GATE_VERSION)}`,\
      ) as Json[]).length;\
    }\
    if (ids.length === importedCount && embeddingCount === importedCount && qualityCount === importedCount) stage = "completed";\
  }\
  return { ...run, stage, embedding_count: embeddingCount, quality_count: qualityCount };\
}\
\
function keepGenerationAlive(promise: Promise<unknown>) {\
  const runtime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(value: Promise<unknown>): void } }).EdgeRuntime;\
  if (runtime?.waitUntil) runtime.waitUntil(promise);\
  else void promise;\
}\
\
async function processQueuedGeneration(batchId: string, body: Json, runId: string) {\
  try {\
    await generateBatch(batchId, body, { processQueued: true });\
  } catch {\
    // Fail only an unclaimed queue item. Errors after the queued->running claim\
    // are persisted by generateBatch's own catch block; a concurrent winner is\
    // also left untouched because its status is no longer queued.\
    await patchRows("idea_generation_runs", `id=eq.${runId}&status=eq.queued`, {\
      status: "failed",\
      stage: "failed",\
      issue_counts: { queue_processing_failed: 1 },\
      completed_at: new Date().toISOString(),\
    }).catch(() => []);\
  }\
}\
\
async function updateRunStage(runId: string, stage: string) {\
  await patchRows("idea_generation_runs", `id=eq.${runId}&status=eq.running`, {\
    stage,\
    heartbeat_at: new Date().toISOString(),\
    lease_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),\
  });\
}\
\
function criticHardGateCodes(value: unknown): string[] {\
  const checks = jsonObject(jsonObject(value).checks);\
  const mapping: Record<string, string> = {\
    filmability: "critic_filmability_failed",\
    first_frame_hook: "critic_hook_first_frame_mismatch",\
    lane_fit: "critic_lane_recipe_mismatch",\
    emotion_vibe: "critic_emotion_vibe_mismatch",\
    proof_payoff: "critic_proof_payoff_failed",\
    duration: "critic_duration_failed",\
    safety: "critic_safety_failed",\
    originality: "critic_originality_failed",\
  };\
  return Object.entries(mapping).filter(([check]) => checks[check] !== "pass").map(([, code]) => code);\
}\
\
async function creatorFeedbackSummary(categoryId: string, personaId: string, platform: string, language: string) {\
  const rows = await getRows(\
    "idea_creator_feedback_lane_summary",\
    `select=shot_rating_count,average_shot_rating,quality_adjustment&category_id=eq.${categoryId}&persona_id=eq.${personaId}&platform=eq.${encodeURIComponent(platform)}&language=eq.${encodeURIComponent(language)}&limit=1`,\
  ) as Json[];\
  return rows[0] ?? { shot_rating_count: 0, average_shot_rating: null, quality_adjustment: 0 };\
}\
\
function jsonObject(value: unknown): Json {\
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};\
}\\\\b`, "i");
const legacyCreatorLeakPattern = new RegExp(
  `\\\\b(${[
    codeWord([66, 117, 103, 117, 110]),
    codeWord([103, 111, 115, 116, 101, 114, 105, 114]),
    codeWord([103, 111, 115, 116, 101, 114]),
    codeWord([103, 117, 118, 101, 110, 108, 105]),
    codePhrase([[107, 101, 115, 105, 110], [99, 111, 122, 117, 109]]),
    codePhrase([[104, 101, 114, 107, 101, 115, 116, 101], [97, 121, 110, 105], [115, 111, 110, 117, 99, 117], [118, 101, 114, 105, 114]]),
    codePhrase([[99, 97, 112, 116, 105, 111, 110], [118, 101], [118, 105, 100, 101, 111], [98, 97, 115, 105, 110, 100, 97]]),
    codePhrase([[107, 97, 114, 97, 114], [102, 105, 108, 116, 114, 101, 115, 105]]),
  ].join("|")})\\\\b`,
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

async function trainingProfileForScope(categorySlug: string, platform: string, limit = 16) {
  return await rest("rpc/training_profile_for_scope", {
    method: "POST",
    body: JSON.stringify({
      p_category_slug: categorySlug,
      p_platform: platform,
      p_limit: Math.max(1, Math.min(limit, 50)),
    }),
  }) as Json[];
}

async function lookupById(table: string, id: string) {
  const rows = await getRows(table, `select=id,slug&id=eq.${id}&limit=1`) as Json[];
  if (!rows.length) {
    throw new HttpError(400, `${table} id not found: ${id}`);
  }

  return rows[0];
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
    const lines = String(file.content ?? "").split(/\
?\

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

function validateIdeaCardProduction(card: unknown, layerPolicy: CategoryLayerPolicy) {
  const errors: string[] = [];

  if (!card || typeof card !== "object" || Array.isArray(card)) {
    return errors;
  }

  const ideaCard = card as Json;
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

function candidatePayload(idea: Json, batch: Json, layerPolicy: CategoryLayerPolicy) {
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
    status: "draft",
    decision_trace: {
      import_source: "admin_batch_import",
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
      title: card.title ?? candidate.title,
      one_sentence_premise: card.one_sentence_premise ?? candidate.one_sentence_premise,
    },
    markdown: typeof card.markdown === "string" ? card.markdown : null,
  };
}

async function importBatch(batchId: string, body: Json) {
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

    const candidateWithCard = candidatePayload(row.payload, batch, layerPolicy);
    const { _idea_card: ideaCard, ...candidate } = candidateWithCard;

    try {
      const insertedCandidate = await postRows("idea_candidates", candidate) as Json[];
      const candidateId = String(insertedCandidate[0].id);
      await postRows("idea_cards", cardPayload(candidateId, { ...candidate, _idea_card: ideaCard }));
      imported += 1;
    } catch (error) {
      errors.push({
        batch_id: batch.id,
        source_file: row.source_file,
        line_number: row.line_number,
        external_idea_id: row.payload.external_idea_id ?? null,
        error_code: "DB_INSERT_FAILED",
        error_message: error instanceof HttpError ? error.message : String(error),
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
    `select=source,platform,locale,signal,metadata,freshness_score,confidence_score&platform=in.(${encodeURIComponent(platform)},internet)&metadata->>category_slug=eq.${encodeURIComponent(categorySlug)}&order=confidence_score.desc&limit=${Math.max(1, Math.min(Number(body.trend_limit ?? 12), 50))}`,
  ) as Json[];
  const evalRows = await getRows(
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
      platform: row.platform,
      locale: row.locale,
      signal: row.signal,
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
  return new RegExp(`\\\\b(${[...terms, ...localTerms].join("|")})\\\\b`, "u");
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
  return [...new Set(tokens)].sort().slice(0, 50).join("|");
}

function richCardSignature(candidate: Json, card: Json) {
  const hook = sectionFingerprint([
    candidate.hook_options,
    card.hook_performance_pack,
  ]);
  const scene = sectionFingerprint([
    card.video_blueprint,
    card.scene_script,
    card.execution_ranges,
    card.per_second_frames,
  ]);
  const shot = sectionFingerprint([
    card.shot_list,
    card.pose_direction,
    card.micro_behavior_guide,
    card.camera_direction,
  ]);
  const edit = sectionFingerprint([
    card.editing_timeline,
    card.editing_notes,
    card.edit_assembly_guide,
  ]);
  const broll = sectionFingerprint(card.b_roll_plan);
  const premise = sectionFingerprint([
    candidate.title,
    candidate.one_sentence_premise,
    card.idea_summary,
  ]);
  const combined = [premise, hook, scene, shot, edit, broll].filter(Boolean).join("||");

  return {
    premise,
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
  const checks = [
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
  const evidenceUrlMatch = objectText(card.brand_safety).match(/https?:\/\/[^\s)]+/i);
  const hasEvidenceNote = evidenceNotePattern.test(brandSafetyText);
  const claimText = String(candidate.one_sentence_premise ?? candidate.title ?? "").slice(0, 500);

  for (const boundary of boundaries) {
    if (boundary === "sponsor_disclosure") {
      const hasDisclosure = disclosurePattern.test(brandSafetyText);
      rows.push({
        idea_id: candidate.id,
        generation_batch_id: candidate.generation_batch_id,
        claim_type: boundary,
        claim_text: hasDisclosure ? "Sponsor disclosure present in brand safety guidance." : claimText,
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

function performanceCalibratedScore(feedbackSummary: Json | null | undefined) {
  const total = Number(feedbackSummary?.total ?? 0);
  if (!Number.isFinite(total) || total <= 0) return 50;

  const viral = Number(feedbackSummary?.viral ?? 0);
  const outperformed = Number(feedbackSummary?.outperformed ?? 0);
  const met = Number(feedbackSummary?.met_expectation ?? 0);
  const under = Number(feedbackSummary?.underperformed ?? 0);
  const score = 50 + ((viral * 22 + outperformed * 14 + met * 4 - under * 12) / total);
  return clampQuality(score);
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

function objectText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(objectText).join(" ");
  if (typeof value === "object") return Object.values(value as Json).map(objectText).join(" ");
  return "";
}

function classifySafety(candidate: Json, card: Json, category: Json) {
  const text = normalizedText([
    candidate.title,
    candidate.one_sentence_premise,
    objectText(candidate.hook_options),
    objectText(candidate.story_beats),
    objectText(card),
    objectText(candidate.decision_trace),
  ].join(" "));
  const brandSafetyText = normalizedText(objectText(card.brand_safety));
  const flags: string[] = [];
  const claimBoundaries: string[] = [];

  const explicitNoMedicalClaim = noMedicalClaimPattern.test(text);
  const healthRisk = !explicitNoMedicalClaim && healthRiskPattern.test(text);
  const financeRisk = financeRiskPattern.test(text);
  const childRisk = childRiskPattern.test(text);
  const sponsorRisk = sponsorRiskPattern.test(text);
  const dangerousChallengeRisk = dangerousChallengePattern.test(text);

  if (healthRisk) flags.push("health_or_body_claim_review");
  if (financeRisk) flags.push("finance_claim_review");
  if (childRisk) flags.push("minor_privacy_review");
  if (dangerousChallengeRisk) flags.push("dangerous_challenge_review");
  if (sponsorRisk && !disclosurePattern.test(brandSafetyText)) {
    flags.push("missing_sponsor_disclosure");
  }
  if (String(category.risk_level ?? "low") === "restricted") flags.push("restricted_category_human_review");
  if (healthRisk && !claimBoundaryPattern.test(brandSafetyText)) {
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

function qualityDecision(params: {
  duplicateScore: number;
  strictDuplicateScore: number;
  safetyClassifier: Json;
  claimEvidenceStatus: string;
  premiumScore: number;
  elementDiversityScore: number;
  duplicateElementPairCount: number;
  layerPolicyScore: number;
  missingPolicyLayers: string[];
  creatorScore: number;
  platformScore: number;
  brandScore: number;
  editorialScore: number;
}) {
  const reasons: string[] = [];
  const flags = asArray(params.safetyClassifier.flags).map(String);
  const severity = String(params.safetyClassifier.severity ?? "clear");

  if (params.strictDuplicateScore >= 0.92) reasons.push("card_fingerprint_duplicate");
  if (params.duplicateScore >= 0.86) reasons.push("semantic_duplicate_high");
  else if (params.duplicateScore >= 0.74) reasons.push("semantic_duplicate_possible");
  if (params.elementDiversityScore < 76) reasons.push("card_elements_too_similar");
  if (params.duplicateElementPairCount > 0) reasons.push("duplicate_card_elements");
  if (severity === "human_review") reasons.push("safety_human_review");
  if (severity === "refine") reasons.push("safety_refine_required");
  if (flags.includes("missing_sponsor_disclosure")) reasons.push("missing_sponsor_disclosure");
  if (flags.includes("missing_claim_boundary")) reasons.push("missing_claim_boundary");
  if (params.claimEvidenceStatus === "missing") reasons.push("missing_claim_evidence");
  if (params.claimEvidenceStatus === "needs_review") reasons.push("claim_evidence_needs_review");
  if (params.premiumScore < 82) reasons.push("premium_completeness_below_threshold");
  if (params.layerPolicyScore < 85 || params.missingPolicyLayers.length > 0) reasons.push("category_layer_policy_incomplete");
  if (params.creatorScore < 72) reasons.push("creator_fit_below_threshold");
  if (params.platformScore < 72) reasons.push("platform_fit_below_threshold");
  if (params.brandScore < 78) reasons.push("brand_safety_below_threshold");
  if (params.editorialScore < 78) reasons.push("editorial_quality_below_threshold");

  if (severity === "human_review") return { decision: "human_review_required", reasons };
  if (params.strictDuplicateScore >= 0.92 || params.duplicateScore >= 0.86 || params.elementDiversityScore < 68 || params.duplicateElementPairCount >= 2 || flags.includes("dangerous_challenge_review")) {
    return { decision: "reject", reasons };
  }
  if (reasons.length > 0) return { decision: "refine", reasons };
  return { decision: "approve", reasons: ["quality_gate_v2_passed"] };
}

function evaluateQualityCheck(
  candidate: Json,
  card: Json,
  category: Json,
  layerPolicy: CategoryLayerPolicy,
  personaSlug: string,
  platform: string,
  duplicate: { score: number; strictScore: number; ideaId: string | null; fingerprint?: Json },
  feedbackSummary?: Json | null,
) {
  const safetyClassifier = classifySafety(candidate, card, category);
  const layerPolicyEvaluation = categoryLayerPolicyScore(card, layerPolicy);
  const premiumScore = premiumCompletenessScore(card, layerPolicy);
  const creatorScore = creatorFitScore(candidate, personaSlug);
  const platformScore = platformFitScore(candidate, card, platform);
  const brandScore = brandSafetyScore(card, safetyClassifier);
  const claimRows = claimEvidenceRows(candidate, card, safetyClassifier);
  const claimEvidenceStatus = aggregateClaimEvidenceStatus(claimRows);
  const performanceScore = performanceCalibratedScore(feedbackSummary);
  const signature = lexicalSignature(candidate, card);
  const richSignature = richCardSignature(candidate, card);
  const elementDiversity = cardElementDiversity(card);
  const embeddingDuplicateScore = duplicate.score;
  const editorialScore = clampQuality(
    premiumScore * 0.26 +
      creatorScore * 0.15 +
      platformScore * 0.15 +
      brandScore * 0.22 +
      performanceScore * 0.07 +
      (100 - Math.max(duplicate.score, duplicate.strictScore, embeddingDuplicateScore) * 100) * 0.10 +
      elementDiversity.score * 0.05,
  );
  const decision = qualityDecision({
    duplicateScore: Math.max(duplicate.score, embeddingDuplicateScore),
    strictDuplicateScore: duplicate.strictScore,
    safetyClassifier,
    claimEvidenceStatus,
    premiumScore,
    elementDiversityScore: elementDiversity.score,
    duplicateElementPairCount: Number(elementDiversity.duplicate_pair_count ?? 0),
    layerPolicyScore: layerPolicyEvaluation.score,
    missingPolicyLayers: layerPolicyEvaluation.missing_required_layers,
    creatorScore,
    platformScore,
    brandScore,
    editorialScore,
  });
  const secondOpinion = secondOpinionResult({
    duplicateScore: Math.max(duplicate.score, duplicate.strictScore, embeddingDuplicateScore),
    safetyClassifier,
    brandScore,
    claimEvidenceStatus,
    decision: String(decision.decision),
  });

  return {
    claimEvidenceRows: claimRows,
    qualityRow: {
    idea_id: candidate.id,
    generation_batch_id: candidate.generation_batch_id,
    category_id: candidate.category_id,
    persona_id: candidate.persona_id,
    semantic_duplicate_score: duplicate.score,
    embedding_duplicate_score: Math.max(embeddingDuplicateScore, duplicate.strictScore),
    duplicate_of_idea_id: duplicate.ideaId,
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
    decision: decision.decision,
    reasons: decision.reasons,
    second_opinion_required: secondOpinion.required,
    second_opinion_reasons: secondOpinion.reasons,
    evaluator_version: "quality-gate-v2.1.0",
    metadata: {
      creator_visible: false,
      evaluated_at: new Date().toISOString(),
      performance_feedback: feedbackSummary ?? { total: 0, note: "no_feedback_available" },
      embedding_status: "ready_for_embedding_service",
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

async function duplicatePool(categoryId: string, personaId: string, _batchId: string) {
  return await getRows(
    "idea_candidates",
    `select=id,title,one_sentence_premise,category_id,persona_id,generation_batch_id&category_id=eq.${categoryId}&persona_id=eq.${personaId}&order=created_at.desc&limit=80`,
  ) as Json[];
}

type DuplicateCandidate = { candidate: Json; card: Json; signature?: Json };

function signatureSimilarity(left: DuplicateCandidate, right: DuplicateCandidate) {
  const leftSections = left.signature ?? richCardSignature(left.candidate, left.card);
  const rightSections = right.signature ?? richCardSignature(right.candidate, right.card);
  const sectionScores = [
    tokenSimilarity(String(leftSections.premise), String(rightSections.premise)),
    tokenSimilarity(String(leftSections.hook), String(rightSections.hook)),
    tokenSimilarity(String(leftSections.scene), String(rightSections.scene)),
    tokenSimilarity(String(leftSections.shot), String(rightSections.shot)),
    tokenSimilarity(String(leftSections.edit), String(rightSections.edit)),
    tokenSimilarity(String(leftSections.broll), String(rightSections.broll)),
  ];
  const weighted = (
    sectionScores[0] * 0.18 +
    sectionScores[1] * 0.18 +
    sectionScores[2] * 0.20 +
    sectionScores[3] * 0.16 +
    sectionScores[4] * 0.18 +
    sectionScores[5] * 0.10
  );
  const exactFingerprint = leftSections.fingerprint_hash === rightSections.fingerprint_hash && leftSections.fingerprint.length > 0;

  return {
    score: Math.round((exactFingerprint ? 1 : weighted) * 10000) / 10000,
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

async function performanceFeedbackSummary(categoryId: string, personaId: string, platform: string) {
  const rows = await getRows(
    "idea_performance_feedback",
    `select=outcome_label&category_id=eq.${categoryId}&persona_id=eq.${personaId}&platform=eq.${encodeURIComponent(platform)}&order=created_at.desc&limit=200`,
  ) as Json[];

  const summary: Json = {
    total: rows.length,
    unknown: 0,
    underperformed: 0,
    met_expectation: 0,
    outperformed: 0,
    viral: 0,
  };

  for (const row of rows) {
    const label = String(row.outcome_label ?? "unknown");
    summary[label] = Number(summary[label] ?? 0) + 1;
  }

  return summary;
}

function scoreCandidate(candidate: Json) {
  const mechanismCount = asArray(candidate.mechanism_ids).length;
  const hookCount = asArray(candidate.hook_options).length;
  const layerCount = asArray(candidate.content_style_layers).length;
  const beatCount = asArray(candidate.story_beats).length;
  const hashBonus = stableHash(String(candidate.id)) % 26;
  const base = 35 + Math.min(mechanismCount, 4) * 4 + Math.min(hookCount, 4) * 3 +
    Math.min(layerCount, 5) * 2 + Math.min(beatCount, 8) * 1.25 + hashBonus;
  const viralPotentialScore = clampScore(base);

  return {
    idea_id: candidate.id,
    viral_potential_score: viralPotentialScore,
    psychology_fit_score: clampScore(viralPotentialScore - 4 + (hookCount % 5)),
    human_awareness_score: clampScore(viralPotentialScore - 3 + Math.min(layerCount, 4)),
    feasibility_score: clampScore(70 + Math.min(beatCount, 5) * 2),
    novelty_score: clampScore(55 + (stableHash(String(candidate.title)) % 35)),
    comedy_remix_fit: clampScore(50 + Math.min(mechanismCount, 5) * 5),
    demand_opportunity_score: clampScore(viralPotentialScore - 2),
    saturation_penalty: clampScore(stableHash(String(candidate.one_sentence_premise)) % 12),
    trust_sustainability_score: clampScore(viralPotentialScore - 1),
    config_version: "1.1.0-comedy-remix",
    score_breakdown: {
      scorer: "deterministic_batch_baseline",
      inputs: {
        mechanism_count: mechanismCount,
        hook_count: hookCount,
        content_style_layer_count: layerCount,
        story_beat_count: beatCount,
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
  const externalDuplicatePool = await duplicatePool(String(batch.category_id), String(batch.persona_id), String(batch.id));
  const poolCards = await cardsForIdeas(externalDuplicatePool.map((candidate) => String(candidate.id)));
  const duplicateCandidates = externalDuplicatePool.map((candidate) => ({
    candidate,
    card: poolCards.get(String(candidate.id)) ?? cards.get(String(candidate.id)) ?? {},
  })).map((entry) => ({
    ...entry,
    signature: richCardSignature(entry.candidate, entry.card),
  }));
  const feedbackSummary = await performanceFeedbackSummary(
    String(batch.category_id),
    String(batch.persona_id),
    String(batch.platform),
  );
  const currentEntries = candidates.map((candidate) => {
    const card = cards.get(String(candidate.id)) ?? {};
    return {
      candidate,
      card,
      signature: richCardSignature(candidate, card),
    };
  });
  const qualityEvaluations = candidates.map((candidate, index) => {
    const candidateEntry = currentEntries[index];
    const candidateCard = candidateEntry.card;
    const sameBatchWindow = currentEntries.slice(Math.max(0, index - 24), index);
    return evaluateQualityCheck(
      candidate,
      candidateCard,
      category,
      layerPolicy,
      String(persona.slug),
      String(batch.platform),
      bestDuplicate(candidate, candidateCard, [...duplicateCandidates, ...sameBatchWindow]),
      feedbackSummary,
    );
  });
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
  if (score >= 86) return "high";
  if (score >= 72) return "mid";
  return "low";
}

function chunks<T>(rows: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    result.push(rows.slice(i, i + size));
  }

  return result;
}

async function scoresForIdeas(ideaIds: string[]) {
  const latest = new Map<string, Json>();

  for (const idChunk of chunks(ideaIds, 100)) {
    const query = `select=idea_id,viral_potential_score,created_at&idea_id=in.(${idChunk.join(",")})&order=created_at.desc`;
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
  const inventoryRows = await getPagedRows(
    "idea_inventory",
    `select=idea_id&category_id=eq.${categoryId}&persona_id=eq.${personaId}&order=published_at.desc`,
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
  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, { status: "publishing" });
  const hasChunk = body.limit !== undefined || body.chunk_size !== undefined || body.offset !== undefined;
  const limit = Math.max(1, Math.min(Number(body.limit ?? body.chunk_size ?? 10000), 500));
  const offset = Math.max(0, Number(body.offset ?? 0));
  const finalChunk = Boolean(body.final_chunk ?? body.complete ?? !hasChunk);

  const candidateQuery = `select=id,platform,language,content_style_layers,safety_status&generation_batch_id=eq.${batch.id}&order=created_at.asc`;
  const candidates = hasChunk
    ? await getRows("idea_candidates", `${candidateQuery}&limit=${limit}&offset=${offset}`) as Json[]
    : await getPagedRows("idea_candidates", candidateQuery);
  const scores = await scoresForIdeas(candidates.map((candidate) => String(candidate.id)));
  const qualityRows = await getPagedRows(
    "idea_quality_checks",
    `select=idea_id,decision,editorial_quality_score,reasons,claim_evidence_status,second_opinion_required,lexical_signature&generation_batch_id=eq.${batch.id}`,
  );
  const qualityByIdea = new Map(qualityRows.map((row) => [String(row.idea_id), row]));
  const publishedFingerprints = await publishedFingerprintPool(String(batch.category_id), String(batch.persona_id));
  const chunkFingerprints = new Map<string, string>();
  // ViralBox cards are one-time inventory assets. Ignore legacy reuse inputs.
  const maxReuseCount = 1;
  const qualityFloor = Number(body.quality_floor ?? 55);
  const editorialQualityFloor = Number(body.editorial_quality_floor ?? 78);
  const inventoryRows: Json[] = [];

  for (const candidate of candidates) {
    const latestScore = scores.get(String(candidate.id));
    const quality = qualityByIdea.get(String(candidate.id));
    if (!latestScore || candidate.safety_status !== "SAFE") continue;
    if (!quality || quality.decision !== "approve") continue;
    if (Number(quality.editorial_quality_score ?? 0) < editorialQualityFloor) continue;

    const rankScore = Number(latestScore.viral_potential_score);
    if (rankScore < qualityFloor) continue;
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
        uniqueness_fingerprint_hash: fingerprintHash || null,
        duplicate_protected: true,
        creator_visible: false,
      },
    });
  }

  for (const rowChunk of chunks(inventoryRows, 500)) {
    await postRows(
      "idea_inventory?on_conflict=idea_id",
      rowChunk,
      "resolution=merge-duplicates,return=minimal",
    );
  }

  const batchStats = (batch.stats as Json) ?? {};
  const previousPublished = hasChunk ? Number(batchStats.published_inventory ?? 0) : 0;
  const publishedTotal = previousPublished + inventoryRows.length;

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
        published_inventory: inventoryRows.length,
        final_chunk: finalChunk,
      },
      quality_floor: qualityFloor,
      editorial_quality_floor: editorialQualityFloor,
    },
  });

  return {
    batch_id: batch.id,
    published_inventory: inventoryRows.length,
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

    const batchId = segments[0] === "admin" ? segments[2] : segments[0];
    const action = segments[0] === "admin" ? segments[3] : segments[1];

    if (!batchId || !action) {
      throw new HttpError(404, "Unknown admin generation batch route");
    }

    if (req.method === "POST" && action === "import") {
      return jsonResponse(200, await importBatch(batchId, body));
    }

    if ((req.method === "GET" || req.method === "POST") && action === "training-context") {
      return jsonResponse(200, await trainingContext(batchId, body));
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