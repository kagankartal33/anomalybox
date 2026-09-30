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

function validateIdea(row: IdeaRow, categorySlug: string, personaSlug: string, platform: string) {
  const idea = row.payload;
  const errors: string[] = [];

  if (idea.__parse_error) errors.push("invalid JSONL row");
  if (typeof idea.external_idea_id !== "string" || idea.external_idea_id.length < 3) errors.push("external_idea_id is required");
  if (typeof idea.title !== "string" || idea.title.trim().length < 3) errors.push("title is required");
  if (typeof idea.one_sentence_premise !== "string" || idea.one_sentence_premise.trim().length < 10) errors.push("one_sentence_premise is required");
  if (!Array.isArray(idea.mechanism_ids) || idea.mechanism_ids.length === 0) errors.push("mechanism_ids must be a non-empty array");
  if (idea.category_slug !== categorySlug) errors.push(`category_slug must match batch category: ${categorySlug}`);
  if (!Array.isArray(idea.persona_tags) || !idea.persona_tags.includes(personaSlug)) errors.push(`persona_tags must include ${personaSlug}`);
  if (!Array.isArray(idea.content_style_layers) || idea.content_style_layers.length === 0) errors.push("content_style_layers must be a non-empty array");
  if (!Array.isArray(idea.hook_options) || idea.hook_options.length === 0) errors.push("hook_options must be a non-empty array");
  if (!Array.isArray(idea.story_beats)) errors.push("story_beats must be an array");
  if (typeof idea.idea_card !== "object" || idea.idea_card === null || Array.isArray(idea.idea_card)) errors.push("idea_card must be an object");
  if (idea.platform && idea.platform !== platform) errors.push(`platform must match batch platform: ${platform}`);
  if (idea.originality_status === "duplicate") errors.push("originality_status is duplicate");

  const safetyNotes = asArray(idea.safety_notes).map(String).join(" ").toLowerCase();
  if (safetyNotes.includes("blocked") || safetyNotes.includes("unsafe")) {
    errors.push("safety_notes mark the idea as blocked/unsafe");
  }

  return errors;
}

function candidatePayload(idea: Json, batch: Json) {
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
  const category = await lookupById("categories", String(batch.category_id));
  const persona = await lookupById("creator_personas", String(batch.persona_id));

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: "importing",
    manifest: body.manifest ?? batch.manifest,
  });

  const ideaRows = ideaRowsFromBody(body);
  const errors: Json[] = [];
  let imported = 0;

  for (const row of ideaRows) {
    const validationErrors = validateIdea(
      row,
      String(category.slug),
      String(persona.slug),
      String(batch.platform),
    );

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

    const candidate = candidatePayload(row.payload, batch);
    const ideaCard = candidate._idea_card;
    delete candidate._idea_card;

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

async function scoreBatch(batchId: string) {
  const batch = await resolveBatch(batchId);
  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, { status: "scoring" });

  const candidates = await getPagedRows(
    "idea_candidates",
    `select=id,title,one_sentence_premise,mechanism_ids,hook_options,story_beats,content_style_layers,safety_status&generation_batch_id=eq.${batch.id}&order=created_at.asc`,
  );
  const scoreRows = candidates.map(scoreCandidate);

  for (let i = 0; i < scoreRows.length; i += 500) {
    await postRows("idea_scores", scoreRows.slice(i, i + 500), "return=minimal");
  }

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: "scored",
    stats: {
      ...(batch.stats as Json),
      scored: scoreRows.length,
    },
  });

  return { batch_id: batch.id, scored: scoreRows.length };
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

async function publishInventory(batchId: string, body: Json) {
  const batch = await resolveBatch(batchId);
  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, { status: "publishing" });

  const candidates = await getPagedRows(
    "idea_candidates",
    `select=id,platform,language,content_style_layers,safety_status&generation_batch_id=eq.${batch.id}&order=created_at.asc`,
  );
  const scores = await scoresForIdeas(candidates.map((candidate) => String(candidate.id)));
  const maxReuseCount = Number(body.max_reuse_count ?? 999999);
  const qualityFloor = Number(body.quality_floor ?? 55);
  const inventoryRows: Json[] = [];

  for (const candidate of candidates) {
    const latestScore = scores.get(String(candidate.id));
    if (!latestScore || candidate.safety_status !== "SAFE") continue;

    const rankScore = Number(latestScore.viral_potential_score);
    if (rankScore < qualityFloor) continue;

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

  await patchRows("idea_generation_batches", `id=eq.${batch.id}`, {
    status: "published",
    completed_at: new Date().toISOString(),
    stats: {
      ...(batch.stats as Json),
      published_inventory: inventoryRows.length,
      quality_floor: qualityFloor,
    },
  });

  return { batch_id: batch.id, published_inventory: inventoryRows.length };
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

    if (req.method === "POST" && action === "score") {
      return jsonResponse(200, await scoreBatch(batchId));
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