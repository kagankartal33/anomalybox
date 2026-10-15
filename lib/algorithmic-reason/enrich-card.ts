import {
  CREATOR_MODE_LABELS,
  CREATOR_PERSONA_LABELS,
  FACELESS_FORMATS,
  LANE_MATRIX,
  parseCreatorMode,
  parseCreatorPersona,
  parsePurchaseLane,
  presenceFromPersonaSlug,
} from "./compatibility";
import { analyzeCardHook } from "./analyzer";
import { recommendHooks } from "./fit";
import { getHookById } from "./taxonomy";
import type { CreatorMode, CreatorPersona, HookTypeDefinition } from "./types";

const SIGNAL_PLAIN: Record<string, string> = {
  watch_time: "izlemeye devam eder",
  completion_rate: "videoyu bitirir",
  dm_share: "birine gönderir",
  save_rate: "kaydeder",
  loop_replay: "başa sarıp tekrar izler",
  engagement_velocity: "hemen tepki verir",
  comment_depth: "yorum yazar",
  profile_visit: "profile gider",
  affinity_score: "hesabı hatırlar",
};

export const SHOOT_FORMAT_LABELS_TR: Record<CreatorMode, string> = {
  talking_head: "Konuşarak",
  voiceover: "Seslendirme",
  hands_only: "Sadece eller",
  pov: "POV",
  screen_recording: "Ekran kaydı",
  object_led: "Nesne odaklı",
  text_led: "Metin odaklı",
  interview: "Söyleşi",
};

export const PRESENCE_LABELS_TR: Record<CreatorPersona, string> = {
  editorial_insider: "Editoryal içeriden",
  calm_expert_editor: "Sakin uzman",
  relatable_confidant: "Yakın sırdaş",
  high_status_minimalist: "Sade seçkinci",
  faceless_curator: "Yüzsüz küratör",
  busy_founder_creator: "Meşgul kurucu",
};

export function inferShootFormat(text: string, declared?: string | null): CreatorMode {
  const parsed = parseCreatorMode(declared ?? undefined);
  if (parsed) return parsed;
  const t = text.toLowerCase();
  if (/(text-led|text first|typograph|sessiz açılış|ekranda yazı|900.?1400)/i.test(t)) return "text_led";
  if (/(screen recording|ekran kaydı|dashboard|ui zoom|ekran görüntüsü)/i.test(t)) return "screen_recording";
  if (/(hands-only|hands only|sadece el|top-down|masa üstü|makro doku|macro)/i.test(t)) return "hands_only";
  if (/(object-led|nesne odaklı|döner tabla|tek nesne)/i.test(t)) return "object_led";
  if (/\bpov\b|göz hizası tek el|göğüs monte|kafa monteli/.test(t)) return "pov";
  if (/(voiceover|seslendirme|dış ses)/i.test(t)) return "voiceover";
  if (/(interview|söyleşi|a-cam|b-cam|iki kişi)/i.test(t)) return "interview";
  return "talking_head";
}

export function synthesizeWhy(hook: HookTypeDefinition): string {
  const verb = SIGNAL_PLAIN[hook.targetSignal] ?? "kaydeder";
  return `${hook.nameTr}: ${hook.descriptionTr.replace(/\.$/, "")}. Kanıt görünce izleyici ${verb}.`;
}

export function enrichAlgorithmicFields(input: {
  category?: string;
  personaSlug?: string;
  shootFormat?: string;
  presenceMode?: string;
  hookId?: string;
  whyItWorks?: string;
  title?: string;
  conceptSummary?: string;
  viewerTakeaway?: string;
  steps?: Array<{ action?: string; spokenLine?: string; shot?: string; purpose?: string; performanceNote?: string }>;
}): {
  hookId?: string;
  shootFormat: CreatorMode;
  presenceMode?: CreatorPersona;
  whyItWorks?: string;
  hook?: HookTypeDefinition;
} {
  const blob = [
    input.title,
    input.conceptSummary,
    input.viewerTakeaway,
    input.whyItWorks,
    ...(input.steps ?? []).flatMap((s) => [s.action, s.spokenLine, s.shot, s.purpose, s.performanceNote]),
  ]
    .filter(Boolean)
    .join(" ");

  const shootFormat = inferShootFormat(blob, input.shootFormat);
  const presenceMode =
    parseCreatorPersona(input.presenceMode) ??
    presenceFromPersonaSlug(input.personaSlug) ??
    (FACELESS_FORMATS.includes(shootFormat) ? "faceless_curator" : undefined);

  const lane = parsePurchaseLane(input.category);
  const declared = input.hookId ? getHookById(input.hookId) : undefined;
  let laneHook: HookTypeDefinition | undefined;
  if (!declared && lane) {
    const pool = LANE_MATRIX[lane].topHookIds
      .map((id) => getHookById(id))
      .filter((item): item is HookTypeDefinition => Boolean(item))
      .filter((item) => item.compatibleModes.includes(shootFormat));
    const seed = `${input.title ?? ""}:${input.conceptSummary ?? ""}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
    laneHook = pool.length ? pool[hash % pool.length] : getHookById(LANE_MATRIX[lane].topHookIds[0]);
  }
  const detected =
    !declared && !laneHook
      ? analyzeCardHook({
          title: input.title,
          conceptSummary: input.conceptSummary,
          whyItWorks: input.whyItWorks,
          viewerTakeaway: input.viewerTakeaway,
          category: input.category,
          personaSlug: input.personaSlug,
          shootFormat,
          presenceMode,
          steps: input.steps,
        }).detectedHook
      : undefined;
  const hook =
    declared ??
    laneHook ??
    detected ??
    recommendHooks({
      lane,
      mode: shootFormat,
      persona: presenceMode,
      limit: 1,
    })[0];

  const whyItWorks =
    (input.whyItWorks && input.whyItWorks.trim().length >= 20 ? input.whyItWorks.trim() : undefined) ??
    (hook ? synthesizeWhy(hook) : undefined);

  return {
    hookId: hook?.id,
    shootFormat,
    presenceMode,
    whyItWorks,
    hook,
  };
}

export function formatShootLabel(mode?: string): string | undefined {
  const parsed = parseCreatorMode(mode);
  return parsed ? CREATOR_MODE_LABELS[parsed] : CREATOR_MODE_LABELS[mode as CreatorMode];
}

export function formatPresenceLabel(mode?: string): string | undefined {
  const parsed = parseCreatorPersona(mode);
  return parsed ? CREATOR_PERSONA_LABELS[parsed] : CREATOR_PERSONA_LABELS[mode as CreatorPersona];
}
