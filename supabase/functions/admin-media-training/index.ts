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

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireAdmin(req: Request) {
  const expected = Deno.env.get("ADMIN_API_TOKEN") ?? Deno.env.get("INTERNAL_API_TOKEN");
  if (!expected) throw new HttpError(500, "ADMIN_API_TOKEN or INTERNAL_API_TOKEN is not configured");

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = req.headers.get("x-admin-token") ?? bearer;
  if (token !== expected) throw new HttpError(401, "Unauthorized admin request");
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
    headers: { ...restHeaders(prefer), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new HttpError(res.status, "Supabase REST request failed", data);
  return data;
}

async function getRows(table: string, query: string) {
  return await rest(`${table}?${query}`, { method: "GET" }) as Json[];
}

async function postRows(tableOrPath: string, payload: unknown, prefer = "return=representation") {
  return await rest(tableOrPath, { method: "POST", body: JSON.stringify(payload) }, prefer);
}

async function patchRows(table: string, query: string, payload: unknown) {
  return await rest(`${table}?${query}`, { method: "PATCH", body: JSON.stringify(payload) });
}

async function rpc(name: string, payload: unknown) {
  return await rest(`rpc/${name}`, { method: "POST", body: JSON.stringify(payload) });
}

async function lookupBySlug(table: string, slug: string) {
  const rows = await getRows(table, `select=id,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (!rows.length) throw new HttpError(400, `${table} slug not found: ${slug}`);
  return rows[0];
}

async function sourceRef(idOrExternalId: string, body: Json = {}) {
  const uuid = isUuid(idOrExternalId);
  if (!uuid) return await resolveSource(idOrExternalId);
  return {
    id: idOrExternalId,
    category_id: body.category_id ?? null,
    persona_id: body.persona_id ?? null,
    platform: body.platform ?? "instagram_reels",
    language: body.language ?? "tr",
    stats: {},
  } as Json;
}

async function lookupById(table: string, id: string) {
  const rows = await getRows(table, `select=id,slug&id=eq.${id}&limit=1`);
  if (!rows.length) throw new HttpError(400, `${table} id not found: ${id}`);
  return rows[0];
}

function isUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function routeSegments(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const fnIndex = parts.indexOf("admin-media-training");
  if (fnIndex >= 0) return parts.slice(fnIndex + 1);
  const adminIndex = parts.indexOf("admin");
  if (adminIndex >= 0) return parts.slice(adminIndex);
  return parts;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\\./, "");
    url.pathname = url.pathname.replace(/\\/+$/, "");
    return url.toString().replace(/\\/$/, "");
  } catch {
    return raw.toLowerCase().replace(/[?#].*$/, "").replace(/\\/+$/, "");
  }
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function textFromAsset(asset: Json) {
  return normalizeText([
    asset.caption,
    asset.transcript,
    asset.admin_notes,
    JSON.stringify(asset.frame_metadata ?? {}),
    JSON.stringify(asset.metadata ?? {}),
  ].join(" "));
}

function classifyPresence(text: string, personaSlug?: string) {
  if (personaSlug) return personaSlug;
  if (includesAny(text, ["luxury", "editorial", "premium", "quiet", "hotel", "atelier"])) return "luxury_editor";
  if (includesAny(text, ["relatable", "real", "mistake", "messy", "honest"])) return "relatable_lifestyle";
  if (includesAny(text, ["expert", "proof", "guide", "how to", "checklist", "tutorial"])) return "expert_guide";
  if (includesAny(text, ["funny", "joke", "absurd", "comedy", "mizah"])) return "comedy_observer";
  return "adaptive_creator_presence";
}

function shotTaxonomy(text: string) {
  const shots = [
    includesAny(text, ["mirror", "ayna"]) ? "mirror_talk" : "",
    includesAny(text, ["desk", "table", "tezgah", "vanity"]) ? "desk_setup" : "",
    includesAny(text, ["hotel", "lobby", "room"]) ? "hotel_shot" : "",
    includesAny(text, ["car", "arabada"]) ? "car_shot" : "",
    includesAny(text, ["product", "urun", "close", "macro"]) ? "product_close_up" : "",
    includesAny(text, ["hand", "el", "sorting", "tray"]) ? "hand_sorting" : "",
    includesAny(text, ["street", "pov", "walk"]) ? "street_pov" : "",
    includesAny(text, ["split", "duet"]) ? "split_screen" : "",
    includesAny(text, ["transition", "cut", "reveal"]) ? "transition_reveal" : "",
    includesAny(text, ["overlay", "on screen", "text"]) ? "text_overlay" : "",
  ];
  return uniqueStrings(shots.length ? shots : ["creator_led_reels_frame"]);
}

function derivedPatterns(text: string, categorySlug?: string) {
  const ids = [
    includesAny(text, ["comment", "poll", "yorum", "sor"]) ? "VTP-005" : "",
    includesAny(text, ["behind", "bts", "process", "mistake", "messy", "proof"]) ? "VTP-007" : "",
    includesAny(text, ["sponsor", "ad", "partner", "affiliate", "disclosure"]) ? "VTP-009" : "",
    includesAny(text, ["save", "checklist", "step", "template", "decision tree", "kaydet"]) ? "VTP-013" : "",
    includesAny(text, ["series", "episode", "part"]) ? "VTP-014" : "",
    includesAny(text, ["curate", "taste", "editorial", "filter"]) ? "VTP-018" : "",
    includesAny(text, ["curiosity", "unexpected", "first second", "hook", "surprise"]) ? "VTP-020" : "",
    includesAny(text, ["shopping", "buy", "worth", "product", "urun"]) ? "VTP-021" : "",
    includesAny(text, ["expert", "guide", "proof", "analysis", "breakdown"]) ? "VTP-023" : "",
    includesAny(text, ["review", "comparison", "honest", "trust"]) ? "VTP-025" : "",
    includesAny(text, ["claim", "receipt", "boundary", "evidence"]) ? "VTP-028" : "",
    includesAny(text, ["shorts", "reels", "short form"]) ? "VTP-029" : "",
    includesAny(text, ["objection", "question", "pushback", "reply"]) ? "VTP-032" : "",
    includesAny(text, ["ritual", "daily", "habit"]) ? "VTP-033" : "",
    includesAny(text, ["myth", "misconception", "wrong belief"]) ? "VTP-035" : "",
    includesAny(text, ["local", "city", "turkey", "istanbul"]) ? "VTP-037" : "",
    includesAny(text, ["save", "checklist", "utility", "template", "decision"]) ? "VTP-038" : "",
    (["beauty", "fashion", "food", "luxury"].includes(categorySlug ?? "") || includesAny(text, ["sensory", "texture", "close up", "close-up", "macro"])) ? "VTP-039" : "",
    includesAny(text, ["sponsor", "sponsored", "ad", "partner", "affiliate", "brand safety"]) ? "VTP-040" : "",
    "VTP-026",
    "VTP-027",
  ];
  return uniqueStrings(ids);
}

function riskSignals(text: string, asset: Json) {
  const flags = [
    String(asset.rights_status ?? "unknown") === "unknown" ? "rights_unknown" : "",
    includesAny(text, ["child", "minor", "kid", "cocuk"]) ? "minor_privacy_review" : "",
    includesAny(text, ["celebrity", "public figure", "famous", "unlu"]) ? "public_figure_review" : "",
    includesAny(text, ["health", "skin condition", "medical", "diet", "finance", "investment", "crypto"]) ? "claim_boundary_required" : "",
    includesAny(text, ["sponsor", "ad", "partner", "affiliate"]) && !includesAny(text, ["disclosure", "#ad", "sponsorlu"]) ? "missing_sponsor_disclosure" : "",
    includesAny(text, ["copyrighted audio", "licensed music", "movie clip", "tv clip"]) ? "copyrighted_clip_or_audio" : "",
  ];
  return uniqueStrings(flags);
}

function analysisForAsset(asset: Json, categorySlug?: string, personaSlug?: string) {
  const text = textFromAsset(asset);
  const shots = shotTaxonomy(text);
  const patterns = derivedPatterns(text, categorySlug);
  const risks = riskSignals(text, asset);
  const rightsStatus = String(asset.rights_status ?? "unknown");
  const blocked = rightsStatus === "unknown" || String(asset.training_use ?? "") === "quarantine";
  const highReview = risks.some((risk) => ["rights_unknown", "minor_privacy_review", "public_figure_review", "copyrighted_clip_or_audio"].includes(risk));
  const riskLevel = highReview ? "restricted" : risks.length ? "medium" : "low";
  const status = blocked || highReview ? "quarantined" : "approved";
  const sourceType = String(asset.source_type ?? "manual_transcript");
  const visual = shots.includes("product_close_up")
    ? "first-second tactile close-up creates immediate sensory proof without copying the source scene"
    : shots.includes("mirror_talk")
      ? "direct creator presence opens with face-to-camera tension and quick context"
      : "fast first-frame context shift establishes the premise before explanation";

  return {
    status,
    riskLevel,
    risks,
    copyRisk: status === "approved" ? "low" : "high",
    observationKind: sourceType === "upload" ? "video_pattern" : sourceType === "instagram_reels_url" ? "reels_url_pattern" : "transcript_pattern",
    hookPattern: includesAny(text, ["save", "checklist", "kaydet"])
      ? "utility-first hook that promises a reusable decision aid"
      : includesAny(text, ["mistake", "wrong", "before", "instead"])
        ? "assumption reversal hook that interrupts expected creator polish"
        : "visual premise hook translated into a reusable Reels opening mechanism",
    firstSecondVisual: visual,
    sceneRhythm: {
      opening: "0-2s pattern interrupt with visual context",
      premise: "3-8s concise promise or reversal",
      proof_turn: "9-20s process proof, boundary, or decision filter",
      payoff: "21-35s saved takeaway or commentable resolution",
      cta: "final 3s save/comment continuation",
      creator_visible: false,
    },
    shotTaxonomy: shots,
    captionMechanism: {
      type: includesAny(text, ["question", "comment", "poll", "yorum"]) ? "comment_prompt" : includesAny(text, ["save", "checklist", "kaydet"]) ? "saveable_utility" : "premise_caption",
      search_intent: includesAny(text, ["how", "guide", "checklist", "tutorial"]) ? "high" : "medium",
      controversy_level: includesAny(text, ["wrong", "myth", "mistake"]) ? "controlled" : "low",
      creator_visible: false,
    },
    commentTrigger: includesAny(text, ["comment", "poll", "yorum"]) ? "ask the audience to supply a personal context or decision point" : "invite a low-risk preference answer",
    saveTrigger: includesAny(text, ["save", "checklist", "kaydet"]) ? "reusable checklist or decision filter" : "compact takeaway worth revisiting",
    creatorPresenceMode: classifyPresence(text, personaSlug),
    categoryLayerSignals: uniqueStrings([
      "scene_energy_curve_layer",
      "platform_conversion_layer",
      risks.length ? "risk_reputation_layer" : "",
      includesAny(text, ["premium", "luxury", "editorial"]) ? "luxury_signal_layer" : "",
      includesAny(text, ["sponsor", "ad", "partner"]) ? "sponsor_softness_layer" : "",
      includesAny(text, ["save", "checklist", "template"]) ? "save_worthy_utility_layer" : "",
      includesAny(text, ["mistake", "messy", "real"]) ? "relatability_break_layer" : "",
    ]),
    derivedPatternIds: patterns,
    trainingWeight: status === "approved" ? Math.min(0.9, 0.55 + patterns.length * 0.025) : 0.1,
    quarantineReason: status === "approved" ? null : risks.join(",") || "not_promotable",
  };
}

async function resolveSource(idOrExternalId: string) {
  const filter = isUuid(idOrExternalId)
    ? `id=eq.${idOrExternalId}`
    : `external_source_id=eq.${encodeURIComponent(idOrExternalId)}`;
  const rows = await getRows(
    "media_training_sources",
    `select=id,external_source_id,title,purpose,status,category_id,persona_id,platform,language,rights_policy,metadata,stats,created_at,updated_at&${filter}&limit=1`,
  );
  if (!rows.length) throw new HttpError(404, `media training source not found: ${idOrExternalId}`);
  return rows[0];
}

async function createSource(body: Json) {
  const categorySlug = String(body.category_slug ?? "");
  const personaSlug = String(body.persona_slug ?? "");
  const category = categorySlug ? await lookupBySlug("categories", categorySlug) : null;
  const persona = personaSlug ? await lookupBySlug("creator_personas", personaSlug) : null;
  const externalSourceId = slugify(String(body.external_source_id ?? body.title ?? `media_${Date.now()}`));

  const inserted = await postRows("media_training_sources", {
    external_source_id: externalSourceId,
    title: String(body.title ?? `Media training ${externalSourceId}`),
    purpose: String(body.purpose ?? "media_pattern_training"),
    status: "ready",
    category_id: category?.id ?? null,
    persona_id: persona?.id ?? null,
    platform: String(body.platform ?? "instagram_reels"),
    language: String(body.language ?? "tr"),
    rights_policy: String(body.rights_policy ?? "pattern_only_anti_copy"),
    metadata: { ...(body.metadata as Json ?? {}), creator_visible: false },
  });
  return (inserted as Json[])[0];
}

async function dedupeAsset(payload: Json) {
  const checks = [
    payload.file_hash ? `file_hash=eq.${encodeURIComponent(String(payload.file_hash))}` : "",
    payload.normalized_url_hash ? `normalized_url_hash=eq.${encodeURIComponent(String(payload.normalized_url_hash))}` : "",
    payload.text_hash ? `text_hash=eq.${encodeURIComponent(String(payload.text_hash))}` : "",
  ].filter(Boolean);

  for (const check of checks) {
    const rows = await getRows("media_training_assets", `select=*&${check}&limit=1`);
    if (rows.length) return rows[0];
  }
  return null;
}

async function addAssets(sourceId: string, body: Json) {
  const source = await sourceRef(sourceId, body);
  const category = body.category_slug
    ? await lookupBySlug("categories", String(body.category_slug))
    : source.category_id
      ? await lookupById("categories", String(source.category_id))
      : null;
  const persona = body.persona_slug
    ? await lookupBySlug("creator_personas", String(body.persona_slug))
    : source.persona_id
      ? await lookupById("creator_personas", String(source.persona_id))
      : null;
  const assets = (Array.isArray(body.assets) ? body.assets : [body]) as Json[];
  const created: Json[] = [];
  const duplicates: Json[] = [];

  for (const asset of assets) {
    const normalizedUrl = normalizeUrl(asset.source_url);
    const normalizedText = normalizeText([asset.caption, asset.transcript, asset.admin_notes].join(" "));
    const payload: Json = {
      source_id: source.id,
      source_type: String(asset.source_type ?? (normalizedUrl ? "instagram_reels_url" : "manual_transcript")),
      source_url: asset.source_url ? String(asset.source_url) : null,
      storage_path: asset.storage_path ? String(asset.storage_path) : null,
      file_hash: asset.file_hash ? String(asset.file_hash).toLowerCase() : null,
      normalized_url_hash: normalizedUrl ? await sha256(normalizedUrl) : null,
      text_hash: normalizedText ? await sha256(normalizedText) : null,
      caption: asset.caption ? String(asset.caption) : null,
      transcript: asset.transcript ? String(asset.transcript) : null,
      admin_notes: asset.admin_notes ? String(asset.admin_notes) : null,
      category_id: source.category_id ?? category?.id ?? null,
      persona_id: source.persona_id ?? persona?.id ?? null,
      platform: String(asset.platform ?? source.platform ?? "instagram_reels"),
      rights_status: String(asset.rights_status ?? "unknown"),
      training_use: String(asset.training_use ?? "pattern_only"),
      status: "ready",
      frame_metadata: (asset.frame_metadata ?? {}) as Json,
      metadata: { ...(asset.metadata as Json ?? {}), creator_visible: false },
    };

    const duplicate = await dedupeAsset(payload);
    if (duplicate) {
      duplicates.push({ id: duplicate.id, duplicate_of: duplicate.id, source_type: duplicate.source_type });
      continue;
    }

    const inserted = await postRows("media_training_assets", payload);
    created.push((inserted as Json[])[0]);
  }

  return { source_id: source.id, created: created.length, duplicate_assets: duplicates.length, assets: created, duplicates };
}

async function createReviewItems(source: Json, asset: Json, observation: Json | null, risks: string[]) {
  const items = risks.length ? risks : ["manual_review_required"];
  for (const risk of items) {
    await postRows("media_training_review_queue", {
      source_id: source.id,
      asset_id: asset.id,
      observation_id: observation?.id ?? null,
      reason_type: risk,
      severity: risk === "rights_unknown" || risk.includes("copyrighted") ? "blocked" : "high",
      status: "open",
      notes: "Media training observation requires admin review before promotion.",
      metadata: { creator_visible: false },
    }, "return=minimal");
  }
}

async function analyzeSource(sourceId: string) {
  const source = await sourceRef(sourceId);
  const assets = await getRows(
    "media_training_assets",
    `select=id,source_id,source_type,source_url,storage_path,file_hash,normalized_url_hash,text_hash,caption,transcript,admin_notes,category_id,persona_id,platform,rights_status,training_use,status,frame_metadata,analysis_summary,metadata,created_at,updated_at&source_id=eq.${source.id}&order=created_at.asc`,
  );
  let approved = 0;
  let quarantined = 0;
  let duplicates = 0;

  await patchRows("media_training_sources", `id=eq.${source.id}`, { status: "analyzing" });

  for (const asset of assets) {
    const category = asset.category_id ? await lookupById("categories", String(asset.category_id)) : null;
    const persona = asset.persona_id ? await lookupById("creator_personas", String(asset.persona_id)) : null;
    const runRows = await postRows("media_training_analysis_runs", {
      source_id: source.id,
      asset_id: asset.id,
      analysis_mode: asset.source_type === "upload" ? "frame_metadata" : asset.source_type === "manual_transcript" ? "transcript_only" : "manual_fallback",
      status: "running",
      input_summary: {
        source_type: asset.source_type,
        has_caption: Boolean(asset.caption),
        has_transcript: Boolean(asset.transcript),
        has_frame_metadata: Object.keys((asset.frame_metadata ?? {}) as Json).length > 0,
        creator_visible: false,
      },
    });
    const run = (runRows as Json[])[0];
    const analysis = analysisForAsset(asset, String(category?.slug ?? ""), String(persona?.slug ?? ""));
    const hashInput = JSON.stringify({
      category_slug: category?.slug ?? null,
      persona_slug: persona?.slug ?? null,
      hook_pattern: analysis.hookPattern,
      first_second_visual: analysis.firstSecondVisual,
      scene_rhythm: analysis.sceneRhythm,
      shot_taxonomy: analysis.shotTaxonomy,
      caption_mechanism: analysis.captionMechanism,
      creator_presence_mode: analysis.creatorPresenceMode,
      derived_pattern_ids: analysis.derivedPatternIds,
      normalized_text: textFromAsset(asset).slice(0, 2000),
    });
    const contentHash = await sha256(hashInput);
    const existing = await getRows("media_training_observations", `select=*&content_hash=eq.${contentHash}&limit=1`);
    if (existing.length) {
      duplicates += 1;
      await patchRows("media_training_assets", `id=eq.${asset.id}`, {
        status: "analyzed",
        analysis_summary: { duplicate_observation_id: existing[0].id, creator_visible: false },
      });
      await patchRows("media_training_analysis_runs", `id=eq.${run.id}`, {
        status: "completed",
        completed_at: new Date().toISOString(),
        output_summary: { duplicate_observation_id: existing[0].id, creator_visible: false },
      });
      continue;
    }

    const inserted = await postRows("media_training_observations", {
      source_id: source.id,
      asset_id: asset.id,
      content_hash: contentHash,
      observation_kind: analysis.observationKind,
      platform: String(asset.platform ?? source.platform ?? "instagram_reels"),
      category_slug: category?.slug ?? null,
      persona_slug: persona?.slug ?? null,
      locale: "TR",
      hook_pattern: analysis.hookPattern,
      first_second_visual: analysis.firstSecondVisual,
      scene_rhythm: analysis.sceneRhythm,
      shot_taxonomy: analysis.shotTaxonomy,
      caption_mechanism: analysis.captionMechanism,
      comment_trigger: analysis.commentTrigger,
      save_trigger: analysis.saveTrigger,
      creator_presence_mode: analysis.creatorPresenceMode,
      category_layer_signals: analysis.categoryLayerSignals,
      derived_pattern_ids: analysis.derivedPatternIds,
      copy_risk: analysis.copyRisk,
      risk_level: analysis.riskLevel,
      rights_status: asset.rights_status,
      training_use: asset.training_use === "eval_only" ? "eval_only" : asset.training_use === "negative_example" ? "negative_example" : "pattern_only",
      training_weight: analysis.trainingWeight,
      status: analysis.status,
      quarantine_reason: analysis.quarantineReason,
      metadata: {
        creator_visible: false,
        source_slug: "media_training_v1",
        anti_copy: true,
        raw_surface_policy: "never expose source url, file name, exact caption, exact transcript, creator name, public figure name or exact scene",
        media_asset_id: asset.id,
      },
    });
    const observation = (inserted as Json[])[0];

    if (analysis.status === "approved") approved += 1;
    else {
      quarantined += 1;
      await createReviewItems(source, asset, observation, analysis.risks);
    }

    await patchRows("media_training_assets", `id=eq.${asset.id}`, {
      status: analysis.status === "approved" ? "approved" : "quarantined",
      analysis_summary: {
        observation_id: observation.id,
        risk_level: analysis.riskLevel,
        risks: analysis.risks,
        derived_pattern_ids: analysis.derivedPatternIds,
        creator_visible: false,
      },
    });
    await patchRows("media_training_analysis_runs", `id=eq.${run.id}`, {
      status: "completed",
      completed_at: new Date().toISOString(),
      output_summary: {
        observation_id: observation.id,
        status: analysis.status,
        risk_level: analysis.riskLevel,
        creator_visible: false,
      },
    });
  }

  await patchRows("media_training_sources", `id=eq.${source.id}`, {
    status: quarantined > 0 && approved === 0 ? "quarantined" : "analyzed",
    stats: { total_assets: assets.length, approved_observations: approved, quarantined_observations: quarantined, duplicate_observations: duplicates },
  });

  return { source_id: source.id, total_assets: assets.length, approved_observations: approved, quarantined_observations: quarantined, duplicate_observations: duplicates };
}

function sourceKindForObservation(kind: unknown) {
  if (kind === "video_pattern") return "media_video";
  if (kind === "reels_url_pattern") return "media_reels_url";
  return "media_transcript";
}

async function promoteTraining(sourceId: string, body: Json) {
  const source = await sourceRef(sourceId, body);
  const compileVersion = String(body.compile_version ?? "2026-v4-media-training");
  await postRows("viral_training_sources?on_conflict=slug", {
    slug: "media_training_v1",
    title: "Media/Reels Pattern Training v1",
    source_type: "media_training",
    uri: "internal://media-training-v1",
    coverage_start_year: 2026,
    coverage_end_year: 2026,
    reliability_notes: "Admin-reviewed media observations promoted as anti-copy, pattern-only training signals.",
    metadata: {
      training_policy: "pattern_only_anti_copy",
      source_class: "media_training",
      compile_version: compileVersion,
      creator_visible: false,
    },
    enabled: true,
  }, "resolution=merge-duplicates,return=representation");

  const sourceRows = await getRows("viral_training_sources", "select=id&slug=eq.media_training_v1&limit=1");
  const trainingSource = sourceRows[0];
  const observations = await getRows(
    "media_training_observations",
    `select=id,source_id,asset_id,content_hash,observation_kind,platform,category_slug,persona_slug,locale,hook_pattern,first_second_visual,scene_rhythm,shot_taxonomy,caption_mechanism,comment_trigger,save_trigger,creator_presence_mode,category_layer_signals,derived_pattern_ids,copy_risk,risk_level,rights_status,training_use,training_weight,status,metadata&source_id=eq.${source.id}&status=eq.approved&rights_status=in.(owned,permissioned,public_research)&order=created_at.asc`,
  );

  let promoted = 0;
  for (const observation of observations) {
    await postRows("dataset_training_observations?on_conflict=content_hash", {
      content_hash: observation.content_hash,
      source_path: `media:${observation.id}`,
      source_kind: sourceKindForObservation(observation.observation_kind),
      platform: observation.platform,
      category_slug: observation.category_slug,
      locale: observation.locale ?? "TR",
      title_algorithmic: `Media training signal ${String(observation.content_hash).slice(0, 12)}`,
      text_signals: {
        hook_pattern: observation.hook_pattern,
        first_second_visual: observation.first_second_visual,
        scene_rhythm: observation.scene_rhythm,
        shot_taxonomy: observation.shot_taxonomy,
        caption_mechanism: observation.caption_mechanism,
        comment_trigger: observation.comment_trigger,
        save_trigger: observation.save_trigger,
        creator_presence_mode: observation.creator_presence_mode,
        category_layer_signals: observation.category_layer_signals,
        creator_visible: false,
      },
      metric_signals: {
        training_weight: observation.training_weight,
        media_pattern_confidence: observation.training_weight,
        creator_visible: false,
      },
      derived_pattern_ids: observation.derived_pattern_ids,
      named_entity_refs: [],
      training_weight: observation.training_weight,
      copy_risk: observation.copy_risk,
      risk_level: observation.risk_level,
      training_use: observation.training_use,
      metadata: {
        source_slug: "media_training_v1",
        compile_version: compileVersion,
        media_observation_id: observation.id,
        media_asset_id: observation.asset_id,
        anti_copy: true,
        creator_visible: false,
        raw_surface_policy: "no source url, file name, exact caption, exact transcript, creator name or exact scene",
      },
    }, "resolution=merge-duplicates,return=minimal");

    const suffix = String(observation.content_hash).slice(0, 12);
    await postRows("viral_training_examples?on_conflict=source_id,external_ref", {
      source_id: trainingSource.id,
      external_ref: observation.content_hash,
      year: 2026,
      platform: observation.platform,
      category_slug: observation.category_slug,
      title: `Media training pattern ${suffix}`,
      phenomenon_type: "marketing_case",
      abstracted_mechanism: `A media-derived Reels mechanism combines ${observation.hook_pattern}, ${observation.first_second_visual}, and ${observation.creator_presence_mode} without copying source surfaces.`,
      reusable_pattern: `Translate the observation into category-safe scene rhythm, shot taxonomy, caption/comment engine, and brand-safety boundaries. Pattern ids: ${(observation.derived_pattern_ids as string[]).join(", ")}.`,
      participation_mode: "creator_adapts_mechanism_only",
      emotional_triggers: ["curiosity", "trust", "save_value"],
      format_signals: observation.shot_taxonomy,
      safety_risks: observation.risk_level === "low" ? [] : ["review_claims_and_rights"],
      copy_risk: observation.copy_risk,
      training_use: observation.training_use,
      risk_level: observation.risk_level,
      metadata: {
        source_class: "media_training",
        source_slug: "media_training_v1",
        anti_copy: true,
        creator_visible: false,
        media_observation_id: observation.id,
      },
    }, "resolution=merge-duplicates,return=minimal");

    await patchRows("media_training_observations", `id=eq.${observation.id}`, { status: "promoted" });
    promoted += 1;
  }

  await rest("trend_signals?source=eq.media_training_v1", { method: "DELETE" }, "return=minimal");
  const trendRows = observations.slice(0, 200).map((observation) => ({
    source: "media_training_v1",
    platform: observation.platform,
    locale: observation.locale ?? "TR",
    signal: `Media-safe Reels mechanism: ${observation.hook_pattern}; ${observation.first_second_visual}`,
    metadata: {
      media_observation_id: observation.id,
      category_slug: observation.category_slug,
      pattern_ids: observation.derived_pattern_ids,
      freshness_policy: "low_freshness_high_craft_confidence",
      creator_visible: false,
    },
    freshness_score: 35,
    confidence_score: Math.round(Number(observation.training_weight ?? 0.5) * 100) / 100,
  }));
  if (trendRows.length) await postRows("trend_signals", trendRows, "return=minimal");

  await rest("generator_eval_cases?slug=like.media_eval_%", { method: "DELETE" }, "return=minimal");
  const evalRows = observations.slice(0, 50).map((observation) => ({
    slug: `media_eval_${String(observation.content_hash).slice(0, 12)}`,
    title: `Media leak guard ${String(observation.content_hash).slice(0, 12)}`,
    category_slug: observation.category_slug,
    persona_slug: observation.persona_slug,
    input_brief: {
      source: "media_training_v1",
      category_slug: observation.category_slug,
      platform: observation.platform,
      pattern_ids: observation.derived_pattern_ids,
      creator_visible: false,
    },
    expected_patterns: observation.derived_pattern_ids,
    forbidden_patterns: [
      "source url",
      "file name",
      "exact caption",
      "exact transcript",
      "creator name",
      "public figure name",
      "exact scene",
      "copy the reel",
    ],
    quality_rubric: {
      must_translate: ["hook_performance_pack", "scene_script", "shot_list", "caption_pack", "brand_safety"],
      must_not_leak_training_source: true,
      creator_visible: false,
    },
    enabled: true,
  }));
  if (evalRows.length) await postRows("generator_eval_cases", evalRows, "return=minimal");

  const shouldCompile = body.compile !== false;
  const compile = shouldCompile
    ? await rpc("compile_viral_training_profile", { p_version: compileVersion })
    : { skipped: true, version: compileVersion };
  if (body.update_source_status === true) {
    await patchRows("media_training_sources", `id=eq.${source.id}`, {
      status: "promoted",
      stats: { ...((source.stats ?? {}) as Json), promoted_observations: promoted, compile_version: compileVersion },
    });
  }

  return { source_id: source.id, promoted_observations: promoted, compile };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    requireAdmin(req);
    const segments = routeSegments(req);
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));

    if (req.method === "POST" && (segments.length === 0 || segments.join("/") === "admin/media-training-sources")) {
      return jsonResponse(201, await createSource(body));
    }

    const sourceId = segments[0] === "admin" ? segments[2] : segments[0];
    const action = segments[0] === "admin" ? segments[3] : segments[1];

    if (!sourceId || !action) throw new HttpError(404, "Unknown admin media training route");
    if (req.method === "POST" && action === "assets") return jsonResponse(200, await addAssets(sourceId, body));
    if (req.method === "POST" && action === "analyze") return jsonResponse(200, await analyzeSource(sourceId));
    if (req.method === "POST" && action === "promote-training") return jsonResponse(200, await promoteTraining(sourceId, body));

    throw new HttpError(404, "Unknown admin media training action");
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message, details: error.details });
    }
    return jsonResponse(500, { error: error instanceof Error ? error.message : String(error) });
  }
});