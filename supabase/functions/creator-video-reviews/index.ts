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
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
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
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
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
  const tokens = path.match(/[^.[\]]+/g) ?? [];
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
  addCheck(checks, "Hook", "hook_first_second_visual", "Ilk 1 saniyede gorsel hook var", "hook_performance_pack.first_second_visual_hook", true, "Ilk saniyede durdurma etkisi yaratan gorsel, hareket veya kontrast var mi?");
  addCheck(checks, "Hook", "hook_first_line", "Ilk cumle karttaki hook niyetini tasiyor", "hook_performance_pack.first_line_hook", true, "Konusulan ilk cumle veya ekrandaki ilk metin karttaki hook ile ayni vaadi veriyor mu?");
  if (asArray(hookPack.hook_options).length >= 3) {
    addCheck(checks, "Hook", "hook_variants_available", "Karttaki hook varyantlarindan biri kullanilmis", "hook_performance_pack.hook_options", false, "Creator karttaki hooklardan birini ya da ayni niyette uyarlanmis bir versiyonu kullanmis mi?");
  }

  asArray(card.scene_script).slice(0, 8).forEach((scene, index) => {
    const row = asObject(scene);
    addCheck(
      checks,
      "Sahne Akisi",
      `scene_script_${index + 1}`,
      `Sahne ${index + 1}: ${String(row.purpose ?? "kart amaci")} amaci islenmis`,
      `scene_script[${index}]`,
      true,
      "Bu sahnenin amaci videoda net hissediliyor mu; voiceover, spoken line veya ekrandaki text bunu destekliyor mu?",
    );
  });

  asArray(card.shot_list).slice(0, 8).forEach((shot, index) => {
    const row = asObject(shot);
    addCheck(
      checks,
      "B-roll",
      `shot_list_${index + 1}`,
      `Shot ${index + 1}: ${String(row.shot ?? row.type ?? "kart shot")} gorunuyor`,
      `shot_list[${index}]`,
      true,
      "Karttaki shot tipi videoda benzer niyetle cekilmis mi?",
    );
  });

  asArray(card.b_roll_plan ?? card.b_roll).slice(0, 8).forEach((shot, index) => {
    const row = asObject(shot);
    addCheck(
      checks,
      "B-roll",
      `b_roll_${index + 1}`,
      `B-roll: ${String(row.type ?? row.shot ?? "kart b-roll")} kullanilmis`,
      `b_roll_plan[${index}]`,
      false,
      "B-roll sahnesi reklamsi durmadan atmosfer, kanit veya gerceklik hissi katiyor mu?",
    );
  });

  for (const key of ["face", "hands", "body", "expression"]) {
    if (hasText(asObject(card.pose_direction)[key])) {
      addCheck(checks, "Poz ve Mikro Davranis", `pose_${key}`, `Poz yonu: ${key} uygulanmis`, `pose_direction.${key}`, false, "Yuz/beden/el kullanimi karttaki ton ve premium/relatable hedefe uyuyor mu?");
    }
  }
  for (const key of ["facial_expression", "eye_contact", "product_handling", "camera_attention", "smile_timing", "avoid_over_advertising"]) {
    if (hasText(asObject(card.micro_behavior_guide)[key])) {
      addCheck(checks, "Poz ve Mikro Davranis", `micro_${key}`, `Mikro davranis: ${key} uygulanmis`, `micro_behavior_guide.${key}`, false, "Creator'in mikro davranisi fazla reklam gibi durmadan karttaki niyeti tasiyor mu?");
    }
  }
  for (const key of ["framing", "movement", "lighting"]) {
    if (hasText(asObject(card.camera_direction)[key])) {
      addCheck(checks, "Poz ve Mikro Davranis", `camera_${key}`, `Kamera yonu: ${key} uygulanmis`, `camera_direction.${key}`, true, "Kamera kadraji, hareketi veya isigi karttaki cekim diline uyuyor mu?");
    }
  }

  asArray(card.editing_timeline).slice(0, 8).forEach((beat, index) => {
    const row = asObject(beat);
    addCheck(
      checks,
      "Edit Timeline",
      `edit_timeline_${index + 1}`,
      `Edit beat: ${String(row.beat ?? row.second ?? "kart beat")} takip edilmis`,
      `editing_timeline[${index}]`,
      true,
      "Video zaman akisi karttaki pattern interrupt, premise, proof/turn, payoff ve CTA ritmine uyuyor mu?",
    );
  });

  const captionPack = asObject(card.caption_pack);
  addCheck(checks, "Caption & Comment", "caption_present", "Caption girilmis", "caption_pack.caption_options", true, "Caption karttaki seceneklerden biri ya da ayni niyette guclu bir uyarlama mi?");
  if (asArray(captionPack.on_screen_text).length > 0) {
    addCheck(checks, "Caption & Comment", "onscreen_text_present", "Ekran yazisi kullanilmis", "caption_pack.on_screen_text", false, "Ekran text'i videonun hook, kanit veya payoff kismini daha anlasilir yapiyor mu?");
  }
  if (card.comment_engine) {
    addCheck(checks, "Caption & Comment", "comment_trigger_present", "Yorum tetikleyen soru veya pinned comment hazir", "comment_engine", false, "Yorum sorusu takipcinin cevap vermesini kolaylastiriyor mu?");
  }

  if (hasText(card.brand_lift_statement)) {
    addCheck(checks, "Brand Lift", "brand_lift_alignment", "Video creator marka algisini karttaki yone tasiyor", "brand_lift_statement", false, "Video creator'i karttaki marka pozisyonuna yaklastiriyor mu?");
  }

  const brandSafety = asObject(card.brand_safety);
  if (hasText(brandSafety.disclosure_text)) addCheck(checks, "Brand Safety", "disclosure_present", "Sponsor/disclosure gerekliligi kontrol edildi", "brand_safety.disclosure_text", true, "Sponsorluysa disclosure video/caption basinda yeterince acik mi?");
  if (hasText(brandSafety.claim_boundary)) addCheck(checks, "Brand Safety", "claim_boundary_present", "Claim boundary korunmus", "brand_safety.claim_boundary", true, "Saglik/finans/performans gibi iddialar kisisel baglam ve sinirla anlatilmis mi?");
  if (asArray(brandSafety.do_not_say).length > 0) addCheck(checks, "Brand Safety", "do_not_say_avoided", "Bunu soyleme listesi ihlal edilmemis", "brand_safety.do_not_say", true, "Karttaki yasakli/riski ifadeler videoda veya caption'da kullanilmamis mi?");

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
    short_summary: objectText(payload).trim() ? summary : "Bu kartta bu bolum icin ozel yonerge yok.",
    how_to_do_it: objectText(payload).trim() ? howTo : "Karttaki diger bolumleri takip et; bu sekme icin zorunlu ekstra aksiyon bulunmuyor.",
    what_good_looks_like: objectText(payload).trim() ? good : "Video genel kart fikrine sadik kaldigi surece bu bolum sorun sayilmaz.",
    common_mistakes: objectText(payload).trim() ? mistakes : [],
    example_execution: objectText(payload).trim() ? example : "Ornek gerekli degil.",
    source_payload: payload,
    checklist_items: checks.filter((check) => String(check.section) === title || (title === "Sahne Akisi" && String(check.section) === "Sahne Akisi")),
  };
}

function cardSections(card: Json, checks: Json[]) {
  return [
    section(
      card,
      "scene_flow",
      "Sahne Akisi",
      ["video_blueprint", "scene_script", "shot_list"],
      "Videonun hangi sirayla ilerleyecegini ve her sahnenin amacini gosterir.",
      "Sahneleri karttaki sirayla cek: once dikkat, sonra guven/kanit, sonra payoff ve CTA. Her sahne icin voiceover, konusma veya ekran yazisindan en az birini kullan.",
      "Izleyen kisi ilk saniyede konuyu anlar, ortada neden inanacagini gorur, finalde ne yapacagini bilir.",
      ["Sahneleri karistirmak", "Payoff'u gec vermek", "Kanit sahnesini sadece urun gosterimine cevirmek"],
      "0-2 saniyede final goruntu, 3-8 saniyede karar/premise, 9-20 saniyede kanit, finalde kaydetme CTA.",
      checks,
    ),
    section(
      card,
      "pose_micro_behavior",
      "Poz ve Mikro Davranis",
      ["pose_direction", "micro_behavior_guide", "camera_direction"],
      "Creator'in kamerada nasil duracagini, nereye bakacagini ve urunu nasil tutacagini anlatir.",
      "Yuz ifadesi, el hareketi, goz temasi ve kamera kadrajini karttaki tona gore uygula. Urunu gostermek yerine davranisin dogal hissini koru.",
      "Creator guvenilir, rahat ve reklamsi olmayan bir enerji verir; urun/konu kadrajda vardir ama zorla satilmaz.",
      ["Kameraya surekli bakmak", "Urunu fazla sallamak", "Abartili satis mimigi", "Isik/kadrajla premium hissi bozmak"],
      "Hook'ta kameraya bak, kanit anlatirken urune/aksiyona don, payoff'ta tekrar kameraya gelip sakin CTA ver.",
      checks,
    ),
    section(
      card,
      "b_roll",
      "B-roll",
      ["b_roll_plan", "shot_list"],
      "Videoyu tek konusmadan cikaran detay, hazirlik, close-up ve atmosfer cekimlerini listeler.",
      "B-roll'u ana cumleyi kanitlamak veya atmosferi guclendirmek icin kullan. Her shot'un bir amaci olsun: kanit, gerceklik, ortam veya gecis.",
      "Close-up, el hareketi, ortam detayi ve gerceklik ani videonun pahali ama insan hissini guclendirir.",
      ["Gereksiz stok goruntu gibi B-roll", "Ayni aciyi fazla tekrarlamak", "Before/after ile riskli iddia kurmak"],
      "Urun close-up + el hareketi + ortam detayi + kucuk gerceklik ani + guvenli alternatif shot.",
      checks,
    ),
    section(
      card,
      "edit_timeline",
      "Edit Timeline",
      ["editing_timeline", "editing_notes"],
      "Videonun saniye saniye ritmini ve hangi noktada ne olacagini tarif eder.",
      "Ilk 2 saniyede pattern interrupt, sonra premise, sonra proof/turn, finalde payoff ve save/comment CTA ritmini koru.",
      "Video hizli baslar, ortada netlesir, finalde izleyiciye kaydetme veya yorum atma nedeni verir.",
      ["Ilk saniyeyi bos gecirmek", "Proof kismini uzatmak", "CTA'yi cok hizli gecmek"],
      "0-2 sn hook, 3-8 sn premise, 9-20 sn proof/turn, 21-35 sn payoff, son 3 sn CTA.",
      checks,
    ),
    section(
      card,
      "caption_comment",
      "Caption & Comment",
      ["caption_pack", "comment_engine", "story_followup"],
      "Caption, ekran yazisi, pinned comment ve yorum tetikleyici soruyu hazirlar.",
      "Caption'i karttaki seceneklerden sec veya ayni niyette uyarlayarak yaz. Pinned comment ve yorum sorusu takipcinin kolay cevap verecegi kadar net olsun.",
      "Caption videoyu tekrar izletir, ekran yazisi ana fikri sabitler, yorum sorusu takipciyi konusmaya davet eder.",
      ["Caption'i sadece aciklama gibi yazmak", "Yorum sorusunu cok genel sormak", "Ekran yazisini kalabalik yapmak"],
      "Caption: 'Finalden onceki karar daha onemli.' Pinned comment: 'Siz bu kararda neyi elerdiniz?'",
      checks,
    ),
    section(
      card,
      "brand_lift",
      "Brand Lift",
      ["brand_lift_statement", "strategic_value", "creator_presence_mode", "atmosphere_direction"],
      "Bu fikrin creator'in marka algisina ne katmasi gerektigini aciklar.",
      "Videonun tonu, atmosferi ve anlatim bicimi creator'i karttaki marka pozisyonuna tasimali: daha guvenilir, daha premium, daha relatable veya daha uzman.",
      "Izleyici sadece fikri degil creator'in zevkini, karar kalitesini ve marka degerini hatirlar.",
      ["Fikri sadece taktik gibi yapmak", "Creator markasina katacagi hissi gostermemek", "Premium/relatable tonu karistirmak"],
      "Creator urunu zorlamadan karar standardini gosterir; takipci 'bu kisi secmeyi biliyor' hissiyle ayrilir.",
      checks,
    ),
    section(
      card,
      "brand_safety",
      "Brand Safety",
      ["brand_safety"],
      "Sponsor, claim, yasakli ifade ve guvenli alternatif dil sinirlarini belirler.",
      "Disclosure gerekiyorsa acik yaz. Kesin sonuc, tedavi, garanti, herkeste calisir gibi iddialardan uzak dur. Karttaki daha guvenli ifadeyi kullan.",
      "Video guven verir; sponsorluysa saklamaz, iddialari baglamla sinirlar ve marka riskini dusurur.",
      ["Disclosure saklamak", "Kesin sonuc vaadi", "Kanit gerektiren claim'i kanitsiz soylemek", "Do not say listesini ihlal etmek"],
      "Bunu 'herkeste calisir' yerine 'benim bugunku baglamimda daha guvenli secim bu' diye anlat.",
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
      admin_instruction: "Videoyu izlerken karttaki orijinal onerinin ayni niyetle uygulanip uygulanmadigini kontrol et. Birebir kopya arama; amac, ritim, guvenlik ve creator-fit yeterli mi bak.",
      checklist_template: asArray(item.checklist_items).map((check) => ({
        ...asObject(check),
        original_suggestion: valueAtPath(card, String(asObject(check).source_card_path ?? "")) ?? null,
        feedback_placeholder: "Creator'a net, uygulanabilir ve kisa feedback yaz.",
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
      durum: row.status === "pass" ? "Yapilmis" : row.status === "partial" ? "Kismen" : row.status === "missing" ? "Eksik" : "Uygun degil",
      evidence_summary: row.evidence_summary,
      revision_advice: row.revision_advice,
    });
  }

  return {
    final_decision: decision,
    headline: decision === "ready_to_post"
      ? "Video paylasima hazir."
      : decision === "brand_safety_blocked"
      ? "Brand safety duzeltilmeden paylasma."
      : decision === "needs_reshoot"
      ? "Bazi kritik bolumler yeniden cekilmeli."
      : "Revizyonla daha guclu olacak.",
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
    card_sections: cardSections(card, checks),
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
    `select=id,review_id,user_id,idea_id,attempt_number,original_filename,mime_type,status,final_decision,submitted_at,created_at,updated_at&status=eq.${encodeURIComponent(status)}&order=submitted_at.desc.nullslast,created_at.desc&limit=100`,
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
    if (req.method === "POST" && segments.length === 3 && segments[1] === "attempts") {
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