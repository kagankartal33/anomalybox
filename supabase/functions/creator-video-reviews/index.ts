type Json = Record<string, unknown>;

const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-m4v", "video/webm"];
const maxVideoBytes = 524288000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
const adminApiToken = Deno.env.get("ADMIN_API_TOKEN") ?? Deno.env.get("INTERNAL_API_TOKEN") ?? "local-admin-token";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase URL and service role key are required");
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  if (!res.ok) throw new HttpError(res.status, "Supabase REST request failed", data);
  return data;
}

async function getRows(table: string, query: string) {
  return await rest(`${table}?${query}`, { method: "GET" }) as Json[];
}

async function postRows(tableOrPath: string, payload: unknown, prefer = "return=representation") {
  return await rest(tableOrPath, {
    method: "POST",
    body: JSON.stringify(payload),
  }, prefer) as Json[];
}

async function patchRows(table: string, query: string, payload: unknown, prefer = "return=representation") {
  return await rest(`${table}?${query}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, prefer) as Json[];
}

async function requireUser(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  if (!bearer) throw new HttpError(401, "Authorization bearer token is required");

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey!,
      authorization: `Bearer ${bearer}`,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok || !data?.id) throw new HttpError(401, "Invalid creator session", data);
  return { id: String(data.id), email: String(data.email ?? "") };
}

function requireAdmin(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  const token = req.headers.get("x-admin-token") ?? bearer;
  if (token !== adminApiToken) throw new HttpError(401, "Unauthorized admin request");
}

function routeSegments(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const marker = parts.indexOf("creator-video-reviews");
  return marker >= 0 ? parts.slice(marker + 1) : parts;
}

function safeFilename(value: unknown) {
  const raw = String(value ?? "review-video.mp4");
  const normalized = raw.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return (normalized || "review-video.mp4").slice(0, 120);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function objectText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(objectText).join(" ");
  if (typeof value === "object") return Object.values(value as Json).map(objectText).join(" ");
  return "";
}

function truncate(value: string, length = 280) {
  return value.length > length ? `${value.slice(0, length - 1).trim()}...` : value;
}

function valueAtPath(source: Json, path: string): unknown {
  const tokens = path.match(/[^.[\\]]+/g) ?? [];
  return tokens.reduce((acc: unknown, key) => {
    if (Array.isArray(acc)) return acc[Number(key)];
    return asObject(acc)[key];
  }, source);
}

function safeReview(row: Json): Json {
  const {
    software_checks: _softwareChecks,
    ai_analysis_internal: _aiAnalysisInternal,
    admin_private_notes: _adminPrivateNotes,
    ...safe
  } = row;
  return safe;
}

function safeAttempt(row: Json): Json {
  const {
    admin_private_notes: _adminPrivateNotes,
    ...safe
  } = row;
  return safe;
}

function safeCheck(row: Json): Json {
  const {
    internal_evidence: _internalEvidence,
    ai_provider: _aiProvider,
    confidence: _confidence,
    ...safe
  } = row;
  return safe;
}

function validateMimeAndSize(body: Json) {
  const mimeType = String(body.mime_type ?? "");
  if (!allowedMimeTypes.includes(mimeType)) throw new HttpError(400, "Unsupported video mime type");
  const size = Number(body.file_size_bytes ?? 0);
  if (!Number.isFinite(size) || size <= 0 || size > maxVideoBytes) {
    throw new HttpError(400, "Invalid video file size");
  }
}

function metadataFromBody(body: Json) {
  const metadata = asObject(body.video_metadata);
  return {
    duration_seconds: metadata.duration_seconds ?? null,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    has_audio: metadata.has_audio ?? null,
  };
}

function addCheck(
  checks: Json[],
  section: string,
  key: string,
  label: string,
  sourceCardPath: string,
  required = true,
  adminLookFor?: string,
) {
  checks.push({
    section,
    check_key: key,
    label,
    source_card_path: sourceCardPath,
    is_required: required,
    admin_look_for: adminLookFor ?? label,
  });
}

function checklistFromCard(card: Json) {
  const checks: Json[] = [];
  const hookPack = asObject(card.hook_performance_pack);
  addCheck(checks, "Hook", "hook_first_second_visual", "The first second includes a visual hook", "hook_performance_pack.first_second_visual_hook", true, "Does the first second include a visual, movement, or contrast that creates a stop-scroll moment?");
  addCheck(checks, "Hook", "hook_first_line", "The first line carries the card's hook intent", "hook_performance_pack.first_line_hook", true, "Does the spoken first line or opening on-screen text deliver the same promise as the card hook?");
  if (asArray(hookPack.hook_options).length >= 3) {
    addCheck(checks, "Hook", "hook_variants_available", "One of the card's hook variants is used", "hook_performance_pack.hook_options", false, "Did the creator use one of the card hooks or a version adapted with the same intent?");
  }

  asArray(card.scene_script).slice(0, 8).forEach((scene, index) => {
    const row = asObject(scene);
    addCheck(
      checks,
      "Scene Flow",
      `scene_script_${index + 1}`,
      `Scene ${index + 1}: ${String(row.purpose ?? "card purpose")} is covered`,
      `scene_script[${index}]`,
      true,
      "Is the purpose of this scene clear in the video, and is it supported by voiceover, spoken line, or on-screen text?",
    );
  });

  asArray(card.shot_list).slice(0, 8).forEach((shot, index) => {
    const row = asObject(shot);
    addCheck(
      checks,
      "B-roll",
      `shot_list_${index + 1}`,
      `Shot ${index + 1}: ${String(row.shot ?? row.type ?? "card shot")} appears`,
      `shot_list[${index}]`,
      true,
      "Is the shot type from the card captured with a similar intent in the video?",
    );
  });

  asArray(card.b_roll_plan ?? card.b_roll).slice(0, 8).forEach((shot, index) => {
    const row = asObject(shot);
    addCheck(
      checks,
      "B-roll",
      `b_roll_${index + 1}`,
      `B-roll: ${String(row.type ?? row.shot ?? "card b-roll")} is used`,
      `b_roll_plan[${index}]`,
      false,
      "Does the B-roll add atmosphere, proof, or realism without feeling like an obvious ad insert?",
    );
  });

  for (const key of ["face", "hands", "body", "expression"]) {
    if (hasText(asObject(card.pose_direction)[key])) {
      addCheck(checks, "Pose & Micro Behavior", `pose_${key}`, `Pose direction: ${key} is applied`, `pose_direction.${key}`, false, "Do face, body, and hand usage match the card's tone and premium/relatable goal?");
    }
  }
  for (const key of ["facial_expression", "eye_contact", "product_handling", "camera_attention", "smile_timing", "avoid_over_advertising"]) {
    if (hasText(asObject(card.micro_behavior_guide)[key])) {
      addCheck(checks, "Pose & Micro Behavior", `micro_${key}`, `Micro behavior: ${key} is applied`, `micro_behavior_guide.${key}`, false, "Does the creator's micro behavior carry the card's intent without looking overly promotional?");
    }
  }
  for (const key of ["framing", "movement", "lighting"]) {
    if (hasText(asObject(card.camera_direction)[key])) {
      addCheck(checks, "Pose & Micro Behavior", `camera_${key}`, `Camera direction: ${key} is applied`, `camera_direction.${key}`, true, "Do framing, movement, or lighting match the visual language of the card?");
    }
  }

  asArray(card.editing_timeline).slice(0, 8).forEach((beat, index) => {
    const row = asObject(beat);
    addCheck(
      checks,
      "Edit Timeline",
      `edit_timeline_${index + 1}`,
      `Edit beat: ${String(row.beat ?? row.second ?? "card beat")} is followed`,
      `editing_timeline[${index}]`,
      true,
      "Does the video's timing follow the card's pattern interrupt, premise, proof/turn, payoff, and CTA rhythm?",
    );
  });

  const captionPack = asObject(card.caption_pack);
  addCheck(checks, "Caption & Comment", "caption_present", "Caption is included", "caption_pack.caption_options", true, "Is the caption one of the card options, or a strong adaptation with the same intent?");
  if (asArray(captionPack.on_screen_text).length > 0) {
    addCheck(checks, "Caption & Comment", "onscreen_text_present", "On-screen text is used", "caption_pack.on_screen_text", false, "Does the on-screen text make the hook, proof, or payoff easier to understand?");
  }
  if (card.comment_engine) {
    addCheck(checks, "Caption & Comment", "comment_trigger_present", "Comment trigger or pinned comment is ready", "comment_engine", false, "Does the comment question make it easy for followers to respond?");
  }

  if (hasText(card.brand_lift_statement)) {
    addCheck(checks, "Brand Lift", "brand_lift_alignment", "The video moves creator perception toward the card's brand direction", "brand_lift_statement", false, "Does the video move the creator closer to the brand position described in the card?");
  }

  const brandSafety = asObject(card.brand_safety);
  if (hasText(brandSafety.disclosure_text)) addCheck(checks, "Brand Safety", "disclosure_present", "Sponsor/disclosure requirement is checked", "brand_safety.disclosure_text", true, "If sponsored, is the disclosure clear enough at the start of the video and caption?");
  if (hasText(brandSafety.claim_boundary)) addCheck(checks, "Brand Safety", "claim_boundary_present", "Claim boundary is protected", "brand_safety.claim_boundary", true, "Are health, finance, performance, or similar claims framed with personal context and limits?");
  if (asArray(brandSafety.do_not_say).length > 0) addCheck(checks, "Brand Safety", "do_not_say_avoided", "The do-not-say list is respected", "brand_safety.do_not_say", true, "Were the card's restricted or risky phrases avoided in the video and caption?");

  return checks;
}

function sourcePayload(card: Json, paths: string[]) {
  const payload: Json = {};
  for (const path of paths) {
    const value = valueAtPath(card, path);
    if (value !== undefined && value !== null && objectText(value).trim()) payload[path] = value;
  }
  return payload;
}

function section(
  card: Json,
  key: string,
  title: string,
  paths: string[],
  summary: string,
  howTo: string,
  good: string,
  mistakes: string[],
  example: string,
  checks: Json[],
) {
  const payload = sourcePayload(card, paths);
  return {
    key,
    title,
    short_summary: objectText(payload).trim() ? summary : "This card has no dedicated guidance for this section.",
    how_to_do_it: objectText(payload).trim() ? howTo : "Follow the other card sections; this tab does not require an extra action.",
    what_good_looks_like: objectText(payload).trim() ? good : "As long as the video stays faithful to the core card idea, this section is not a blocker.",
    common_mistakes: objectText(payload).trim() ? mistakes : [],
    example_execution: objectText(payload).trim() ? example : "No example is required.",
    source_payload: payload,
    checklist_items: checks.filter((check) => String(check.section) === title),
  };
}

function cardSections(card: Json, checks: Json[]) {
  return [
    section(
      card,
      "scene_flow",
      "Scene Flow",
      ["video_blueprint", "scene_script", "shot_list"],
      "Shows the order of the video and the job of each scene.",
      "Shoot the scenes in the card's order: attention first, then trust/proof, then payoff and CTA. Use at least one of voiceover, spoken line, or on-screen text for each scene.",
      "The viewer understands the topic in the first second, sees why to trust it in the middle, and knows what to do at the end.",
      ["Mixing the scene order", "Delivering the payoff too late", "Turning the proof scene into plain product display"],
      "0-2s final visual, 3-8s decision/premise, 9-20s proof, final seconds save CTA.",
      checks,
    ),
    section(
      card,
      "pose_micro_behavior",
      "Pose & Micro Behavior",
      ["pose_direction", "micro_behavior_guide", "camera_direction"],
      "Explains how the creator should stand, look, move, and handle the subject on camera.",
      "Match expression, hand movement, eye contact, and framing to the card's tone. Keep the behavior natural instead of forcing the product or topic into the frame.",
      "The creator feels credible, relaxed, and not overly promotional; the subject is present without feeling pushed.",
      ["Looking into the camera the entire time", "Over-handling the product", "Using exaggerated sales expressions", "Breaking the premium feel with poor lighting or framing"],
      "Look to camera for the hook, turn to the product/action during proof, then return calmly for the CTA.",
      checks,
    ),
    section(
      card,
      "b_roll",
      "B-roll",
      ["b_roll_plan", "shot_list"],
      "Lists the detail, preparation, close-up, and atmosphere shots that keep the video from feeling like a single talking head.",
      "Use B-roll to prove the main line or strengthen the atmosphere. Every shot should have a job: proof, realism, setting, or transition.",
      "Close-ups, hand movement, environment details, and small real moments make the video feel premium but human.",
      ["Using pointless stock-like B-roll", "Repeating the same angle too often", "Creating risky before/after claims"],
      "Product close-up + hand movement + environment detail + small reality moment + safer alternative shot.",
      checks,
    ),
    section(
      card,
      "edit_timeline",
      "Edit Timeline",
      ["editing_timeline", "editing_notes"],
      "Defines the second-by-second rhythm of the video and what should happen at each point.",
      "Keep the rhythm: pattern interrupt in the first 2 seconds, then premise, proof/turn, payoff, and a save/comment CTA.",
      "The video starts fast, clarifies in the middle, and gives the viewer a reason to save or comment at the end.",
      ["Wasting the first second", "Dragging out the proof section", "Rushing the CTA"],
      "0-2s hook, 3-8s premise, 9-20s proof/turn, 21-35s payoff, final 3s CTA.",
      checks,
    ),
    section(
      card,
      "caption_comment",
      "Caption & Comment",
      ["caption_pack", "comment_engine", "story_followup"],
      "Prepares the caption, on-screen text, pinned comment, and comment-trigger question.",
      "Choose one of the card's caption options or adapt it with the same intent. The pinned comment and question should be specific enough for followers to answer easily.",
      "The caption makes the video worth replaying, on-screen text anchors the main idea, and the question invites a real response.",
      ["Writing the caption like a plain explanation", "Asking a generic comment question", "Overloading the screen text"],
      "Caption: 'The decision before the final result matters more.' Pinned comment: 'What would you remove from this decision?'",
      checks,
    ),
    section(
      card,
      "brand_lift",
      "Brand Lift",
      ["brand_lift_statement", "strategic_value", "creator_presence_mode", "atmosphere_direction"],
      "Explains what this idea should add to the creator's brand perception.",
      "The tone, atmosphere, and delivery should move the creator toward the card's brand position: more credible, premium, relatable, or expert.",
      "The viewer remembers not only the idea, but the creator's taste, decision quality, and brand value.",
      ["Treating the idea like a simple tactic", "Not showing what the idea adds to the creator brand", "Mixing premium and relatable tones without intention"],
      "The creator shows decision quality without forcing the product; the viewer leaves thinking, 'this creator knows how to choose.'",
      checks,
    ),
    section(
      card,
      "brand_safety",
      "Brand Safety",
      ["brand_safety"],
      "Sets the sponsor, claim, restricted wording, and safer-language boundaries.",
      "Use clear disclosure when needed. Avoid claims like guaranteed results, treatment, warranty, or works for everyone. Use the safer wording from the card.",
      "The video feels trustworthy; if sponsored, it is transparent, limits claims by context, and reduces brand risk.",
      ["Hiding disclosure", "Promising a guaranteed result", "Making an evidence-based claim without evidence", "Violating the do-not-say list"],
      "Say 'in my context today, this is the safer choice' instead of 'this works for everyone.'",
      checks,
    ),
  ];
}

function creatorCardSections(card: Json, checks: Json[]) {
  return [
    section(
      card,
      "scene_flow",
      "Scene Flow",
      ["video_blueprint", "scene_script", "shot_list", "b_roll_plan", "pose_direction", "micro_behavior_guide", "camera_direction"],
      "Shoot the Reel in the card's exact order.",
      "Follow the scene order, capture each required shot once, and keep the camera/framing clear.",
      "The creator can shoot the draft without guessing what comes next.",
      ["Repeating the same action", "Adding context before the hook", "Skipping the required frame"],
      "Shoot the hook first, then the proof/action, then the final payoff.",
      checks,
    ),
    section(
      card,
      "edit_timeline",
      "Edit Assembly Guide",
      ["editing_timeline", "editing_notes", "edit_assembly_guide", "scene_script", "shot_list"],
      "Assemble the final Reel with the card's timing and cut rhythm.",
      "Use the listed clip order, cut points, overlays, voice sync, and final checklist.",
      "The edit is clean, readable, and ready for human review.",
      ["Using every take", "Adding decorative transitions", "Letting overlays arrive too late"],
      "Cut each scene at the listed moment, keep overlays readable, and check the final frame before exporting.",
      checks,
    ),
  ];
}

function adminReviewGuide(card: Json, checks: Json[]) {
  const sections = cardSections(card, checks);
  return {
    status_options: ["pass", "partial", "missing", "not_applicable"],
    final_decision_options: ["ready_to_post", "minor_revisions", "needs_reshoot", "brand_safety_blocked"],
    sections: sections.map((item) => ({
      ...item,
      admin_instruction: "While watching the video, check whether the card's original recommendation was executed with the same intent. Do not look for an exact copy; judge purpose, rhythm, safety, and creator fit.",
      checklist_template: asArray(item.checklist_items).map((check) => ({
        ...asObject(check),
        original_suggestion: valueAtPath(card, String(asObject(check).source_card_path ?? "")) ?? null,
        feedback_placeholder: "Write clear, practical, concise feedback for the creator.",
      })),
    })),
  };
}

function creatorReport(decision: string, overallFeedback: string, checkRows: Json[]) {
  const sections: Json = {};
  for (const row of checkRows) {
    const sectionName = String(row.section);
    if (!sections[sectionName]) sections[sectionName] = [];
    (sections[sectionName] as Json[]).push({
      label: row.label,
      status: row.status,
      status_label: row.status === "pass" ? "Completed" : row.status === "partial" ? "Partially done" : row.status === "missing" ? "Missing" : "Not applicable",
      evidence_summary: row.evidence_summary,
      revision_advice: row.revision_advice,
    });
  }

  return {
    final_decision: decision,
    headline: decision === "ready_to_post"
      ? "Your video is ready to post."
      : decision === "brand_safety_blocked"
      ? "Do not post until brand safety is fixed."
      : decision === "needs_reshoot"
      ? "A few critical sections should be reshot."
      : "This will be stronger with revision.",
    overall_feedback: overallFeedback,
    sections,
    raw_scores_visible: false,
    viral_success_guaranteed: false,
  };
}

async function ideaCardForIdea(ideaId: string) {
  const rows = await getRows("idea_cards", `select=id,idea_id,title,card&idea_id=eq.${ideaId}&limit=1`);
  if (!rows.length) throw new HttpError(404, "Idea card not found");
  return rows[0];
}

async function signedVideoUrl(attempt: Json) {
  const path = String(attempt.storage_path ?? "");
  const bucket = String(attempt.storage_bucket ?? "creator-review-videos");
  if (!path) return null;

  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey!,
        authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) return null;
    const signedURL = String(data?.signedURL ?? data?.signedUrl ?? "");
    if (!signedURL) return null;
    return signedURL.startsWith("http") ? signedURL : `${supabaseUrl}/storage/v1${signedURL}`;
  } catch {
    return null;
  }
}

async function insertEvent(reviewId: string, userId: string | null, eventType: string, actor: string, metadata: Json) {
  await postRows("creator_video_review_events", {
    review_id: reviewId,
    user_id: userId,
    event_type: eventType,
    actor,
    metadata,
  }, "return=minimal");
}

async function loadOwnedReview(userId: string, reviewId: string, select = "*") {
  const rows = await getRows(
    "creator_video_reviews",
    `select=${select}&id=eq.${encodeURIComponent(reviewId)}&user_id=eq.${userId}&limit=1`,
  );
  if (!rows.length) throw new HttpError(404, "Review not found");
  return rows[0];
}

async function loadReview(reviewId: string, select = "*") {
  const rows = await getRows("creator_video_reviews", `select=${select}&id=eq.${encodeURIComponent(reviewId)}&limit=1`);
  if (!rows.length) throw new HttpError(404, "Review not found");
  return rows[0];
}

async function loadAttempt(reviewId: string, attemptId: string) {
  const rows = await getRows(
    "creator_video_review_attempts",
    `select=*&id=eq.${encodeURIComponent(attemptId)}&review_id=eq.${encodeURIComponent(reviewId)}&limit=1`,
  );
  if (!rows.length) throw new HttpError(404, "Review attempt not found");
  return rows[0];
}

async function createAttempt(review: Json, body: Json, attemptNumber: number) {
  validateMimeAndSize(body);
  const reviewId = String(review.id);
  const userId = String(review.user_id);
  const attemptId = crypto.randomUUID();
  const filename = safeFilename(body.original_filename);
  const storagePath = `${userId}/${reviewId}/${attemptId}/${filename}`;
  const metadata = metadataFromBody(body);

  const attempts = await postRows("creator_video_review_attempts", {
    id: attemptId,
    review_id: reviewId,
    user_id: userId,
    idea_id: review.idea_id,
    attempt_number: attemptNumber,
    storage_bucket: "creator-review-videos",
    storage_path: storagePath,
    original_filename: filename,
    mime_type: body.mime_type,
    file_size_bytes: body.file_size_bytes,
    ...metadata,
    caption: body.caption ?? null,
    transcript: body.transcript ?? null,
    status: "pending_upload",
  });

  await patchRows("creator_video_reviews", `id=eq.${reviewId}`, {
    current_attempt_id: attemptId,
    storage_bucket: "creator-review-videos",
    storage_path: storagePath,
    original_filename: filename,
    mime_type: body.mime_type,
    file_size_bytes: body.file_size_bytes,
    ...metadata,
    caption: body.caption ?? null,
    transcript: body.transcript ?? null,
    status: "pending_upload",
    review_method: "manual_admin",
  }, "return=minimal");

  await insertEvent(reviewId, userId, "attempt_created", "creator", { attempt_id: attemptId, attempt_number: attemptNumber });

  return {
    attempt: safeAttempt(attempts[0]),
    upload: {
      bucket: "creator-review-videos",
      path: storagePath,
      max_file_size_bytes: maxVideoBytes,
      allowed_mime_types: allowedMimeTypes,
    },
  };
}

async function createReview(userId: string, body: Json) {
  const deliveryItemId = String(body.delivery_item_id ?? "");
  if (!deliveryItemId) throw new HttpError(400, "delivery_item_id is required");

  const items = await getRows(
    "idea_box_items",
    `select=id,user_id,idea_id,delivery_id,slot_index&user_id=eq.${userId}&id=eq.${encodeURIComponent(deliveryItemId)}&limit=1`,
  );
  if (!items.length) throw new HttpError(403, "Delivery item does not belong to creator");
  validateMimeAndSize(body);

  const item = items[0];
  const reviewId = crypto.randomUUID();
  const attemptId = crypto.randomUUID();
  const filename = safeFilename(body.original_filename);
  const storagePath = `${userId}/${reviewId}/${attemptId}/${filename}`;
  const metadata = metadataFromBody(body);

  const inserted = await postRows("creator_video_reviews", {
    id: reviewId,
    user_id: userId,
    delivery_item_id: deliveryItemId,
    idea_id: item.idea_id,
    storage_bucket: "creator-review-videos",
    storage_path: storagePath,
    original_filename: filename,
    mime_type: body.mime_type,
    file_size_bytes: body.file_size_bytes,
    ...metadata,
    caption: body.caption ?? null,
    transcript: body.transcript ?? null,
    status: "pending_upload",
    review_method: "manual_admin",
    software_checks: { training_use: "never", ai_enabled: false, review_method: "manual_admin" },
    ai_analysis_internal: { provider: "none", status: "disabled", creator_visible: false },
  });

  const review = inserted[0];
  const attempts = await postRows("creator_video_review_attempts", {
    id: attemptId,
    review_id: reviewId,
    user_id: userId,
    idea_id: item.idea_id,
    attempt_number: 1,
    storage_bucket: "creator-review-videos",
    storage_path: storagePath,
    original_filename: filename,
    mime_type: body.mime_type,
    file_size_bytes: body.file_size_bytes,
    ...metadata,
    caption: body.caption ?? null,
    transcript: body.transcript ?? null,
    status: "pending_upload",
  });
  await patchRows("creator_video_reviews", `id=eq.${reviewId}`, { current_attempt_id: attemptId }, "return=minimal");
  await insertEvent(reviewId, userId, "review_created", "creator", { attempt_id: attemptId, creator_visible: true });

  return {
    review: { ...safeReview(review), current_attempt_id: attemptId },
    attempt: safeAttempt(attempts[0]),
    upload: {
      bucket: "creator-review-videos",
      path: storagePath,
      max_file_size_bytes: maxVideoBytes,
      allowed_mime_types: allowedMimeTypes,
    },
  };
}

async function createNewAttempt(userId: string, reviewId: string, body: Json) {
  const review = await loadOwnedReview(userId, reviewId);
  const rows = await getRows(
    "creator_video_review_attempts",
    `select=attempt_number&review_id=eq.${encodeURIComponent(reviewId)}&order=attempt_number.desc&limit=1`,
  );
  const nextAttemptNumber = rows.length ? Number(rows[0].attempt_number) + 1 : 1;
  return await createAttempt(review, body, nextAttemptNumber);
}

async function submitAttempt(userId: string, reviewId: string, attemptId: string, body: Json) {
  await loadOwnedReview(userId, reviewId);
  const attempt = await loadAttempt(reviewId, attemptId);
  if (String(attempt.user_id) !== userId) throw new HttpError(403, "Review attempt does not belong to creator");
  const patch = {
    status: "under_review",
    submitted_at: new Date().toISOString(),
    caption: body.caption ?? attempt.caption ?? null,
    transcript: body.transcript ?? attempt.transcript ?? null,
  };
  const updatedAttempts = await patchRows("creator_video_review_attempts", `id=eq.${attemptId}`, patch);
  const updatedReviews = await patchRows("creator_video_reviews", `id=eq.${reviewId}`, {
    status: "under_review",
    submitted_at: patch.submitted_at,
    current_attempt_id: attemptId,
    caption: patch.caption,
    transcript: patch.transcript,
  });
  await insertEvent(reviewId, userId, "attempt_submitted", "creator", { attempt_id: attemptId, creator_visible: true });
  return { review: safeReview(updatedReviews[0]), attempt: safeAttempt(updatedAttempts[0]) };
}

async function checksForReview(reviewId: string) {
  const rows = await getRows(
    "creator_video_review_checks",
    `select=id,attempt_id,review_id,user_id,idea_id,section,check_key,label,source_card_path,is_required,status,evidence_start_seconds,evidence_end_seconds,evidence_summary,revision_advice,created_at,updated_at&review_id=eq.${encodeURIComponent(reviewId)}&order=created_at.asc`,
  );
  return rows.map(safeCheck);
}

async function attemptsForReview(reviewId: string) {
  const attempts = await getRows(
    "creator_video_review_attempts",
    `select=id,review_id,user_id,idea_id,attempt_number,storage_bucket,storage_path,original_filename,mime_type,file_size_bytes,duration_seconds,width,height,has_audio,caption,transcript,status,final_decision,creator_feedback,submitted_at,reviewed_at,reviewed_by,created_at,updated_at&review_id=eq.${encodeURIComponent(reviewId)}&order=attempt_number.asc`,
  );
  return attempts.map(safeAttempt);
}

async function getReview(userId: string, reviewId: string) {
  const review = await loadOwnedReview(
    userId,
    reviewId,
    "id,user_id,delivery_item_id,idea_id,current_attempt_id,storage_bucket,storage_path,original_filename,mime_type,file_size_bytes,duration_seconds,width,height,has_audio,caption,transcript,status,final_decision,creator_report,failure_reason,raw_video_expires_at,submitted_at,reviewed_at,reviewed_by,completed_at,created_at,updated_at",
  );
  const cardRow = await ideaCardForIdea(String(review.idea_id));
  const card = asObject(cardRow.card);
  const checks = checklistFromCard(card);
  return {
    review: safeReview(review),
    attempts: await attemptsForReview(reviewId),
    checks: await checksForReview(reviewId),
    card_sections: creatorCardSections(card, checks),
  };
}

async function listReviews(userId: string) {
  const reviews = await getRows(
    "creator_video_reviews",
    `select=id,delivery_item_id,idea_id,current_attempt_id,original_filename,mime_type,status,final_decision,creator_report,submitted_at,reviewed_at,created_at,updated_at&user_id=eq.${userId}&order=created_at.desc&limit=50`,
  );
  return { reviews: reviews.map(safeReview) };
}

async function adminQueue(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "under_review";
  const attempts = await getRows(
    "creator_video_review_attempts",
    `select=id,review_id,user_id,idea_id,attempt_number,original_filename,mime_type,status,final_decision,submitted_at,created_at,updated_at&status=eq.${encodeURIComponent(status)}&order=created_at.desc&limit=100`,
  );
  return { attempts: attempts.map(safeAttempt) };
}

async function adminDetail(reviewId: string) {
  const review = await loadReview(reviewId);
  const attempts = await attemptsForReview(reviewId);
  const currentAttempt = attempts.find((attempt) => String(attempt.id) === String(review.current_attempt_id)) ?? attempts[attempts.length - 1] ?? null;
  const cardRow = await ideaCardForIdea(String(review.idea_id));
  const card = asObject(cardRow.card);
  const checks = checklistFromCard(card);
  const signedUrl = currentAttempt ? await signedVideoUrl(currentAttempt) : null;
  return {
    review: safeReview(review),
    attempts,
    current_attempt: currentAttempt ? { ...currentAttempt, signed_video_url: signedUrl } : null,
    idea_card: { id: cardRow.id, title: cardRow.title, card },
    card_sections: cardSections(card, checks),
    admin_review_guide: adminReviewGuide(card, checks),
    checklist_template: checks.map((check) => ({
      ...check,
      original_suggestion: valueAtPath(card, String(check.source_card_path ?? "")) ?? null,
    })),
  };
}

function reviewStatusForDecision(decision: string) {
  if (decision === "ready_to_post") return "ready_to_post";
  if (decision === "brand_safety_blocked") return "blocked";
  return "revision_requested";
}

async function manualReview(reviewId: string, attemptId: string, body: Json) {
  const review = await loadReview(reviewId);
  const attempt = await loadAttempt(reviewId, attemptId);
  const decision = String(body.final_decision ?? "");
  if (!["ready_to_post", "minor_revisions", "needs_reshoot", "brand_safety_blocked"].includes(decision)) {
    throw new HttpError(400, "Invalid final_decision");
  }

  const cardRow = await ideaCardForIdea(String(review.idea_id));
  const card = asObject(cardRow.card);
  const template = checklistFromCard(card);
  const templateByKey = new Map(template.map((check) => [String(check.check_key), check]));
  const incomingChecks = asArray(body.checks).map(asObject);
  const rows = incomingChecks.map((item) => {
    const key = String(item.check_key ?? "");
    const templateItem = templateByKey.get(key);
    if (!templateItem) throw new HttpError(400, `Unknown checklist item: ${key}`);
    const status = String(item.status ?? "");
    if (!["pass", "partial", "missing", "not_applicable"].includes(status)) {
      throw new HttpError(400, `Invalid checklist status for ${key}`);
    }
    return {
      attempt_id: attemptId,
      review_id: reviewId,
      user_id: review.user_id,
      idea_id: review.idea_id,
      section: templateItem.section,
      check_key: key,
      label: templateItem.label,
      source_card_path: templateItem.source_card_path,
      is_required: templateItem.is_required !== false,
      status,
      confidence: 0,
      evidence_summary: item.evidence_summary ?? null,
      revision_advice: item.revision_advice ?? null,
      internal_evidence: {
        creator_visible: false,
        review_method: "manual_admin",
        training_use: "never",
        admin_private_note: item.admin_private_note ?? null,
      },
      ai_provider: null,
    };
  });

  if (!rows.length) throw new HttpError(400, "At least one checklist item is required");
  if (decision === "ready_to_post") {
    const required = template.filter((check) => check.is_required !== false);
    const rowsByKey = new Map(rows.map((row) => [String(row.check_key), row]));
    const notApproved = required.filter((check) => {
      const row = rowsByKey.get(String(check.check_key));
      return !row || !["pass", "not_applicable"].includes(String(row.status));
    });
    if (notApproved.length) {
      throw new HttpError(400, "ready_to_post requires all required checklist items to pass or be not_applicable", notApproved.map((row) => row.check_key));
    }
  }

  for (let i = 0; i < rows.length; i += 100) {
    await postRows(
      "creator_video_review_checks?on_conflict=attempt_id,check_key",
      rows.slice(i, i + 100),
      "resolution=merge-duplicates,return=minimal",
    );
  }

  const status = reviewStatusForDecision(decision);
  const now = new Date().toISOString();
  const overallFeedback = String(body.overall_feedback ?? "");
  const report = creatorReport(decision, overallFeedback, rows);

  const updatedAttempts = await patchRows("creator_video_review_attempts", `id=eq.${attemptId}`, {
    status,
    final_decision: decision,
    creator_feedback: overallFeedback,
    admin_private_notes: body.admin_private_notes ?? null,
    reviewed_at: now,
  });
  const updatedReviews = await patchRows("creator_video_reviews", `id=eq.${reviewId}`, {
    status,
    final_decision: decision,
    creator_report: report,
    reviewed_at: now,
    completed_at: status === "ready_to_post" || status === "blocked" ? now : null,
    admin_private_notes: body.admin_private_notes ?? null,
    current_attempt_id: attemptId,
  });

  await insertEvent(reviewId, String(review.user_id), "manual_review_saved", "admin", {
    attempt_id: attemptId,
    decision,
    status,
    checklist_count: rows.length,
    creator_visible: true,
  });

  return {
    review: safeReview(updatedReviews[0]),
    attempt: safeAttempt(updatedAttempts[0]),
    checks: rows.map(safeCheck),
    report,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const segments = routeSegments(req);
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));

    if (segments[0] === "admin") {
      requireAdmin(req);
      if (req.method === "GET" && segments.length === 1) {
        return jsonResponse(200, await adminQueue(req));
      }
      if (req.method === "GET" && segments[1] === "creator-video-reviews" && segments.length === 3) {
        return jsonResponse(200, await adminDetail(segments[2]));
      }
      if (
        req.method === "POST" &&
        segments[1] === "creator-video-reviews" &&
        segments[3] === "attempts" &&
        segments[5] === "manual-review"
      ) {
        return jsonResponse(200, await manualReview(segments[2], segments[4], body));
      }
      throw new HttpError(404, "Unknown admin creator video review route");
    }

    const user = await requireUser(req);

    if (req.method === "POST" && segments.length === 0) {
      return jsonResponse(201, await createReview(user.id, body));
    }
    if (req.method === "GET" && segments.length === 0) {
      return jsonResponse(200, await listReviews(user.id));
    }
    if (req.method === "GET" && segments.length === 1) {
      return jsonResponse(200, await getReview(user.id, segments[0]));
    }
    if (req.method === "POST" && segments.length === 2 && segments[1] === "attempts") {
      return jsonResponse(201, await createNewAttempt(user.id, segments[0], body));
    }
    if (req.method === "POST" && segments.length === 4 && segments[1] === "attempts" && segments[3] === "submit") {
      return jsonResponse(200, await submitAttempt(user.id, segments[0], segments[2], body));
    }
    if (req.method === "POST" && segments.length === 2 && segments[1] === "analyze") {
      throw new HttpError(410, "AI/software video analysis is disabled; manual admin review is required");
    }

    throw new HttpError(404, "Unknown creator video review route");
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message, details: error.details });
    }

    return jsonResponse(500, { error: error instanceof Error ? error.message : String(error) });
  }
});