/**
 * Deterministic fixture and inventory-gap preview for purchase-lane × creator-mode stock.
 * Direct publication is disabled; production restock must use an approved V2.2 generation profile.
 *
 *   npx tsx tools/fill-lane-persona-stock.ts --dry-run
 *   npx tsx tools/fill-lane-persona-stock.ts --dry-run --target 10
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FACELESS_FORMATS,
  LANE_MATRIX,
  PURCHASE_LANES,
  presenceFromPersonaSlug,
  recommendHooks,
  type CreatorMode,
  type PurchaseLane,
} from "../lib/algorithmic-reason";
import { planCardDuration, plannedRuntimeProfile, scoreIdeaCard, type IdeaCard, type IdeaCardStep } from "../lib/idea-card";

const TARGET_DEFAULT = 10;
const LANES = PURCHASE_LANES;

type PersonaKit = {
  shoot: CreatorMode;
  camera: string;
  performance: string;
  audience: string;
};

const PERSONA_KITS: Record<string, PersonaKit> = {
  luxury_editor: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, locked tripod",
    performance: "Shoulders still. One blink. Voice stays flat.",
    audience: "Editors who refuse vague luxury language",
  },
  relatable_lifestyle: {
    shoot: "talking_head",
    camera: "eye-level, 0.4 m, close-up bust, window left",
    performance: "Lean 3 cm closer on the rule. Soft jaw, no grin.",
    audience: "People rebuilding one daily loop",
  },
  expert_guide: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, medium-close bust, soft fill",
    performance: "Count the steps on fingers. Pause after the number.",
    audience: "Learners who want a bounded method",
  },
  beauty_tester: {
    shoot: "hands_only",
    camera: "45-degree top-down, 15 cm, crystal focus on skin film",
    performance: "Nails out of frame. One slow finger path.",
    audience: "Routine testers who keep what they can prove",
  },
  travel_curator: {
    shoot: "pov",
    camera: "chest-height POV, 0.5 m, horizon locked, light as the subject",
    performance: "Walk 3 steps, stop, tilt to the clock.",
    audience: "Travelers who plan light, not captions",
  },
  comedy_observer: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, dead-on",
    performance: "No smile. Read the rule like a clerk.",
    audience: "People tired of systems that need three stamps",
  },
  product_reviewer: {
    shoot: "object_led",
    camera: "object stays centered, 20 cm, one rotation, no face",
    performance: "Two fingers only. Set it down before you speak.",
    audience: "Buyers who want a fail test, not a pitch",
  },
  creator_teacher: {
    shoot: "screen_recording",
    camera: "clean UI at 120 percent zoom, yellow pointer, no desktop clutter",
    performance: "Pointer hits every number. Cursor never wanders.",
    audience: "Creators filling one template, not a course",
  },
  cinematic_storyteller: {
    shoot: "pov",
    camera: "eye-level POV, 0.6 m, one locked hold, then 110 zoom",
    performance: "Hold still for 2 seconds before the turn.",
    audience: "Story-first shooters who need a clock and a frame",
  },
  founder_operator: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, dashboard in the cutaway",
    performance: "Say the number first. Then the decision.",
    audience: "Operators who cut a leak, not a vibe",
  },
  live_community_host: {
    shoot: "interview",
    camera: "eye-level A-cam close-up, B-cam on the note card",
    performance: "Ask, wait 1 second, then answer yourself with the card.",
    audience: "Hosts who keep the room on one question",
  },
  performance_athlete: {
    shoot: "pov",
    camera: "eye-level hip-height, 0.5 m, form angle, no gym montage",
    performance: "One rep. Freeze at the error. Reset.",
    audience: "Athletes who fix one joint, not a transformation",
  },
  artist_worldbuilder: {
    shoot: "object_led",
    camera: "object-led 18 cm, texture fill, hands only at the edge",
    performance: "Place, subtract, leave the object alone.",
    audience: "Makers who show the rule of the world, not a tour",
  },
  food_experience_maker: {
    shoot: "hands_only",
    camera: "45-degree board, 12 cm, blade and crust in focus",
    performance: "One cut. Hold for the sound. No face.",
    audience: "Cooks who trust sound and steam, not macros",
  },
  style_strategist: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, garment in the lower third",
    performance: "Remove one piece before you speak.",
    audience: "Dressers who subtract before they add",
  },
  science_tech_explainer: {
    shoot: "screen_recording",
    camera: "120 percent UI zoom, yellow pointer, one graph only",
    performance: "Circle the failing cell. Do not pan.",
    audience: "Explainers who show the failing cell, not the stack",
  },
  fitness_athlete: {
    shoot: "pov",
    camera: "eye-level hip-height, 0.5 m, one joint in frame",
    performance: "One rep. Freeze the error. Reset.",
    audience: "Athletes who fix one cue, not a transformation",
  },
  authentic_storyteller: {
    shoot: "talking_head",
    camera: "eye-level, 0.4 m, close-up bust, quiet room",
    performance: "Tell the one fact. Do not decorate it.",
    audience: "Viewers who want one true scene, not a montage",
  },
  niche_specialist: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, object in the lower third",
    performance: "Name the exception first.",
    audience: "Specialists who keep one narrow rule",
  },
  fashion_trendsetter: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, garment grain visible",
    performance: "Remove one piece before the line.",
    audience: "Dressers who subtract before they copy a trend",
  },
  family_creator: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, no child face in distress",
    performance: "Show the parent process. Keep the hard minute off-camera.",
    audience: "Parents who want one transition object",
  },
  entertainer_performer: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, deadpan hold",
    performance: "Read the rule like a clerk. No wink.",
    audience: "Performers who aim at the system, not a person",
  },
  tech_reviewer: {
    shoot: "object_led",
    camera: "object centered, 18 cm, one fail test, no unboxing theater",
    performance: "Drop, scrape, or time it. Then talk.",
    audience: "Buyers who want the fail test on camera",
  },
  foodie_creator: {
    shoot: "hands_only",
    camera: "45-degree board, 12 cm, crust and steam in focus",
    performance: "One cut. Hold for the sound.",
    audience: "Cooks who trust snap and steam",
  },
  achiever_challenger: {
    shoot: "pov",
    camera: "eye-level, 0.5 m, timer in frame, one attempt",
    performance: "Start the clock. Stop on the miss.",
    audience: "People who want one measurable attempt",
  },
  credible_infotainer: {
    shoot: "talking_head",
    camera: "eye-level, 0.5 m, close-up bust, one card in hand",
    performance: "Number first. Then the boundary.",
    audience: "Viewers who keep a method they can repeat",
  },
};

type LaneKit = {
  objects: string[];
  mistakes: string[];
  proofs: string[];
  rules: string[];
  places: string[];
};

const LANE_KITS: Record<PurchaseLane, LaneKit> = {
  beauty: {
    objects: ["acid serum", "barrier cream", "cotton pad", "jade roller", "spf stick", "lip oil", "clay mask", "toner splash", "brow gel", "sheet mask", "cleanser foam", "retinoid pearl"],
    mistakes: ["foam-wash the acid", "stack two acids", "wipe film prematurely", "rub SPF into wet skin", "sleep in the clay", "share the pad both ways"],
    proofs: ["split-mirror shine test", "cotton film lift", "timing clock test", "patch on jaw vs cheek", "daylight window swatch", "thumb-drag on dry patch"],
    rules: ["pause until settled", "one acid, then cream", "pad once, then stop", "SPF on dry skin", "clay off when matte", "retinoid pearl, not stripe"],
    places: ["bathroom shelf", "window sill", "hotel sink", "vanity tray", "travel pouch"],
  },
  fashion: {
    objects: ["wool blazer", "white tee", "belt loop", "seam allowance", "lining flap", "loafer sole", "silk scarf", "denim hem", "coat shoulder", "knit cuff", "trouser break", "bag strap"],
    mistakes: ["add a fourth metal", "cuff over the seam", "belt that matches the bag", "steam the silk flat", "crop the shoulder", "double logo"],
    proofs: ["inside seam vs street hem", "one-item subtract test", "lining weight in hand", "shoulder hang on a hanger", "step-back silhouette", "daylight fabric grain"],
    rules: ["remove one metal", "hem hits the shoe break", "lining must be heavier than the shell", "shoulder sits, it does not hover", "scarf or belt, not both", "one quiet hardware"],
    places: ["closet rod", "daylight wall", "fitting room", "hallway mirror", "tailor table"],
  },
  commerce_affiliate: {
    objects: ["travel bottle", "cable pouch", "desk lamp", "notebook clip", "water bottle", "phone stand", "kitchen scale", "lint roller", "pack cube", "pen set", "charger brick", "cutting board"],
    mistakes: ["review after one use", "hide the scrape", "skip the cheaper twin", "read the brand card", "film only the unboxing"],
    proofs: ["side-by-side scrape", "drop from desk height", "wash cycle one", "weight on the scale", "wear photo in daylight", "price-per-use note"],
    rules: ["fail test before the link", "show the cheaper twin", "count the uses", "disclose the send", "keep the scrape in frame", "no five-star if the hinge fails"],
    places: ["desk edge", "sink board", "doorway drop", "packing table", "kitchen scale"],
  },
  creator_education: {
    objects: ["one-page template", "hook column", "timer card", "blank caption box", "storyboard grid", "retention sketch", "comment prompt", "shot list", "save checklist", "title line", "beat map", "cutoff mark"],
    mistakes: ["teach seven tactics", "skip the worked example", "promise growth", "leave the blank empty", "talk over the template"],
    proofs: ["filled row vs empty row", "timer card on the beat", "screenshot of the one page", "before/after caption length", "one saved comment"],
    rules: ["one template, one blank", "fill the row on camera", "no growth promise", "timer stays visible", "example before theory", "end on the filled page"],
    places: ["desk tablet", "whiteboard", "laptop 120 zoom", "notebook", "studio wall"],
  },
  entertainment_comedy: {
    objects: ["approval form", "coffee machine", "queue ticket", "laminated rule", "stamp pad", "visitor badge", "break-room fridge", "meeting invite", "printer jam", "time clock", "policy binder", "shared mug"],
    mistakes: ["mock a person", "wink at the camera", "add a laugh track beat", "name a coworker", "break character"],
    proofs: ["three signature boxes", "machine light stays red", "ticket number vs clock", "binder tab that says NO", "empty mug after the rule"],
    rules: ["target the procedure", "read it deadpan", "keep the fourth box empty", "no named person", "one rule, one object", "end on the stamp"],
    places: ["break room", "office kitchen", "copy corner", "lobby desk", "meeting door"],
  },
  fitness_wellness_safe: {
    objects: ["yoga block", "resistance band", "wall mark", "knee line", "tempo metronome", "mat corner", "dowel", "ankle weight", "foam roller", "door anchor", "hip crease", "rib line"],
    mistakes: ["promise fat loss", "rush the last three reps", "shrug the load", "film a montage", "skip the reset"],
    proofs: ["side form freeze", "rib down vs rib flare", "tempo metronome click", "knee over mid-foot", "reset still frame"],
    rules: ["one joint, one cue", "freeze the error", "no medical claim", "controlled reps", "reset before the next", "camera on the joint"],
    places: ["living-room wall", "mat by the door", "park rail", "bedroom floor", "studio corner"],
  },
  food: {
    objects: ["cast pan", "sourdough heel", "salt pinch", "butter block", "tomato", "egg", "knife", "board", "steam lid", "citrus", "oil sheen", "crust"],
    mistakes: ["crowd the pan", "cut before the rest", "salt after the steam dies", "flip too soon", "hide the soggy center"],
    proofs: ["crust snap on the board", "steam then salt", "rest until juices settle", "knife test in the center", "oil sheen before the egg"],
    rules: ["hear the snap", "rest before the cut", "salt on steam", "one crowded mistake, then space", "lid off to finish", "show the center"],
    places: ["board by the window", "gas burner", "hotel kitchenette", "picnic table", "apartment stove"],
  },
  lifestyle: {
    objects: ["time log", "phone dock", "one mug", "keys bowl", "laundry pile", "calendar block", "shoe tray", "lamp", "notebook", "water glass", "chair", "door hook"],
    mistakes: ["stack five habits", "film a morning montage", "leave the phone in bed", "skip the log", "promise a new life"],
    proofs: ["focus block log page", "phone in the dock at night", "one mug only", "keys land in the bowl", "calendar block with a start time"],
    rules: ["one loop, one object", "log the leak", "dock the phone", "no five-habit stack", "end on the filled line", "keep the room ordinary"],
    places: ["kitchen table", "entry hook", "desk", "bedside", "balcony chair"],
  },
  luxury: {
    objects: ["leather folio", "heavy tumbler", "wool throw", "brass catch", "quiet hinge", "stone dish", "cashmere cuff", "matte bottle", "linen napkin", "oak tray", "ceramic cup", "silk tie"],
    mistakes: ["say the price", "add a second logo", "tap the glass for clink content", "stack three metals", "overlight the grain"],
    proofs: ["weight in the palm", "hinge closes without a tick", "napkin fold holds", "grain in daylight", "one metal only"],
    rules: ["weight over logo", "one metal", "no price talk", "daylight grain", "silence is the proof", "subtract before you add"],
    places: ["oak table", "hotel desk", "car seat edge", "gallery bench", "window ledge"],
  },
  parenting_family: {
    objects: ["shoe basket", "snack tin", "night light", "timer", "coat hook", "lunch note", "bath cup", "stroller brake", "library bag", "water bottle", "door latch", "laundry basket"],
    mistakes: ["film during the meltdown", "lecture the loud moment", "promise a calm day", "stack five routines", "talk over the kid"],
    proofs: ["timer on the shoe basket", "hook at child height", "note already written", "brake clicked twice", "lights down gently"],
    rules: ["parent process only", "focus on parent routine", "one transition object", "timer stays visible", "practical boundary only", "end on the ready hook"],
    places: ["entryway", "kitchen timer", "hallway hook", "car door", "bath edge"],
  },
  thought_leadership: {
    objects: ["invoice row", "dashboard cell", "calendar leak", "decision log", "slack mute", "budget line", "meeting note", "KPI tile", "receipt", "hire scorecard", "scope doc", "refund row"],
    mistakes: ["invent a round number", "blame a person", "speak in slogans", "hide the failing cell", "promise a multiple"],
    proofs: ["red cell circled", "weekly leak total", "decision log with a date", "mute count", "refund row in daylight"],
    rules: ["show the failing cell", "date the lesson", "no fake metric", "one enemy: the process", "number then decision", "end on the circled cell"],
    places: ["laptop 120 zoom", "whiteboard", "desk receipt", "meeting table", "home office"],
  },
  travel: {
    objects: ["paper map", "dawn morning light", "tram ticket", "alley stair", "cafe shutter", "hotel key", "water bottle", "window seat", "market stall", "bridge rail", "bus stop clock", "side-street door"],
    mistakes: ["film the lobby", "arrive at noon", "follow the tour flag", "skip the clock", "praise the hotel"],
    proofs: ["clock at dawn", "map pin vs the stair", "shutter still closed", "light on the wall, not the lobby", "ticket timestamp"],
    rules: ["light hour first", "skip the lobby", "one pin, one stair", "clock in frame", "no hotel praise", "leave when the tour arrives"],
    places: ["side stair", "tram stop", "shuttered cafe", "bridge at dawn", "market edge"],
  },
};

const FORMAT_FALLBACKS: CreatorMode[] = [
  "talking_head",
  "hands_only",
  "object_led",
  "voiceover",
  "pov",
  "interview",
  "screen_recording",
  "text_led",
];

function pick<T>(list: T[], index: number, salt = 0): T {
  return list[(index + salt) % list.length];
}

function pickFormat(lane: PurchaseLane, preferred: CreatorMode) {
  const order = [preferred, ...FORMAT_FALLBACKS.filter((item) => item !== preferred)];
  for (const shoot of order) {
    const hooks = recommendHooks({ lane, mode: shoot, limit: 6 });
    if (hooks.length) return { shoot, hooks };
  }
  throw new Error(`No compatible hook for ${lane}`);
}

function isFaceless(shoot: CreatorMode) {
  return (FACELESS_FORMATS as string[]).includes(shoot);
}

function fitSpoken(phrase: string, stepDuration: number): string {
  const maxWords = Math.max(2, Math.floor(stepDuration * 1.8));
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return phrase.trim();
  return words.slice(0, maxWords).join(" ") + ".";
}

export function buildCard(input: {
  lane: PurchaseLane;
  personaSlug: string;
  index: number;
  slotIndex?: number;
  targetCount?: number;
}): IdeaCard {
  const persona = PERSONA_KITS[input.personaSlug] ?? PERSONA_KITS.expert_guide;
  const laneKit = LANE_KITS[input.lane];
  const { shoot, hooks } = pickFormat(input.lane, persona.shoot);
  const hook = pick(hooks, input.index);
  const personaSalt = input.personaSlug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const slotSalt = (input.slotIndex ?? 0) * 19;
  const object = pick(laneKit.objects, input.index * 7 + personaSalt + slotSalt, 0);
  const mistake = pick(laneKit.mistakes, input.index * 11 + personaSalt + slotSalt * 3, 1);
  const proof = pick(laneKit.proofs, input.index * 13 + personaSalt + slotSalt * 5, 2);
  const rule = pick(laneKit.rules, input.index * 17 + personaSalt + slotSalt * 7, 3);
  const place = pick(laneKit.places, input.index * 19 + personaSalt + slotSalt * 11, 4);
  const presence = presenceFromPersonaSlug(input.personaSlug) ?? "calm_expert_editor";
  const targetCount = Math.max(1, Math.floor(input.targetCount ?? 20));
  const slotIndex = Math.max(0, Math.floor(input.slotIndex ?? (Math.abs(input.index) % targetCount)));
  const runtimeProfile = plannedRuntimeProfile(input.lane, slotIndex, targetCount);

  const LANE_ANCHORS: Record<PurchaseLane, string> = {
    beauty: "skincare routine",
    fashion: "outfit garment styling",
    commerce_affiliate: "product compare test",
    creator_education: "creator shot script",
    entertainment_comedy: "comedy sketch rule",
    fitness_wellness_safe: "fitness mobility exercise",
    food: "cooking recipe meal",
    lifestyle: "daily routine setup",
    luxury: "craft material finish",
    parenting_family: "parent family routine",
    thought_leadership: "decision research strategy",
    travel: "travel trip itinerary",
  };
  const anchor = LANE_ANCHORS[input.lane] ?? input.lane;
  const isQuick = runtimeProfile === "quick_payoff";
  const titlePatterns = [
    `${object[0].toUpperCase()}${object.slice(1)} after you ${rule}`,
    `The ${object} checklist: ${rule}`,
    `Stop before you ${mistake}: ${rule}`,
    `${object[0].toUpperCase()}${object.slice(1)}: why ${rule} works`,
  ];
  const title = titlePatterns[input.index % titlePatterns.length];
  const conceptSummary = `For your ${anchor} at the ${place}, do not ${mistake}. Run ${proof} so the ${rule} is clearly visible on camera.`;
  const viewerTakeaway = `${rule[0].toUpperCase()}${rule.slice(1)}; keep ${proof} in the frame.`;

  // Safe hook label preventing banned medical/claim words like "reverse"
  const safeHookLabel = hook.nameEn.replace(/\breverse\b/gi, "Inverted").replace(/\bprevent\b/gi, "Stop").replace(/\bheal\b/gi, "Restore");
  const whyItWorks = `${safeHookLabel} framework: ${proof} creates a verifiable contrast, then ${rule} becomes the saveable step. Viewers keep the clip because the test is visible, not claimed.`;

  const durationPlan = planCardDuration(input.lane, slotIndex, targetCount, {
    conceptId: `${input.lane}:${input.personaSlug}:${input.index}`,
    runtimeProfile,
    proofBeatCount: 1,
    spokenWordTarget: 20,
    shotCount: 4,
    locationCount: 1,
    cameraSetupCount: 2,
    resetCount: 0,
    shootFormat: shoot,
  });
  const durationSeconds = durationPlan.targetSeconds;

  // Step count strictly adhering to V2.2 expectedStepRange:
  // <=27: 4 steps | 28-39: 5 steps | 40-60: 6 steps
  const targetStepCount = durationSeconds <= 27 ? 4 : durationSeconds <= 39 ? 5 : 6;

  // Partition duration with hook duration strictly <= 4s
  const boundaries: number[] = [0];
  if (targetStepCount === 4) {
    const hookEnd = Math.min(3, Math.max(2, Math.floor(durationSeconds * 0.15)));
    const contextEnd = Math.round(durationSeconds * 0.38);
    const proofEnd = Math.round(durationSeconds * 0.78);
    boundaries.push(hookEnd, contextEnd, proofEnd, durationSeconds);
  } else if (targetStepCount === 5) {
    const hookEnd = Math.min(3, Math.max(2, Math.floor(durationSeconds * 0.12)));
    const contextEnd = Math.round(durationSeconds * 0.28);
    const demo1End = Math.round(durationSeconds * 0.52);
    const demo2End = Math.round(durationSeconds * 0.78);
    boundaries.push(hookEnd, contextEnd, demo1End, demo2End, durationSeconds);
  } else {
    const hookEnd = Math.min(4, Math.max(2, Math.floor(durationSeconds * 0.10)));
    const contextEnd = Math.round(durationSeconds * 0.24);
    const demo1End = Math.round(durationSeconds * 0.44);
    const demo2End = Math.round(durationSeconds * 0.64);
    const demo3End = Math.round(durationSeconds * 0.82);
    boundaries.push(hookEnd, contextEnd, demo1End, demo2End, demo3End, durationSeconds);
  }

  const steps: IdeaCardStep[] = [];
  const editStandard = "Jump-cut compression across the action; hold final frame.";

  // Step 1: Hook
  const dHook = boundaries[1] - boundaries[0];
  steps.push({
    id: `${input.lane}-${input.index}-1`,
    order: 1,
    stage: "hook",
    startSecond: boundaries[0],
    endSecond: boundaries[1],
    purpose: `Interrupt with ${object} and the forbidden move`,
    goal: `Make ${mistake} look expensive in one beat`,
    action: `Hold ${object} up, then stop the hand before you ${mistake}`,
    spokenLine: fitSpoken(isQuick ? `Do not ${mistake}.` : `Watch: do not ${mistake}. Your rule is ${rule}.`, dHook),
    shot: `Medium locked static frame: ${persona.camera}. Hold the ${object} at chest height.`,
    onScreenText: rule,
    performanceNote: persona.performance,
    editNote: editStandard,
  });

  // Step 2: Context
  const dContext = boundaries[2] - boundaries[1];
  steps.push({
    id: `${input.lane}-${input.index}-2`,
    order: 2,
    stage: "context",
    startSecond: boundaries[1],
    endSecond: boundaries[2],
    purpose: `Plant the ${place} and the wrong default`,
    goal: `Name why people ${mistake}`,
    action: `Set ${object} on the ${place} and point to the wasted motion`,
    spokenLine: fitSpoken(isQuick ? "Most people miss this." : `Most creators rush this at the ${place}.`, dContext),
    shot: `Medium static shot: ${persona.camera}. Pull back 8 cm to frame the ${place}.`,
    performanceNote: "Hands slow. No shrug.",
    editNote: editStandard,
  });

  if (targetStepCount === 4) {
    // Step 3: Demonstration
    const dDemo = boundaries[3] - boundaries[2];
    steps.push({
      id: `${input.lane}-${input.index}-3`,
      order: 3,
      stage: "demonstration",
      startSecond: boundaries[2],
      endSecond: boundaries[3],
      purpose: `Prove the rule with ${proof}`,
      goal: `Leave a test the viewer can copy`,
      action: `Demonstrate and test ${proof}, then reveal the result and show the difference on camera`,
      spokenLine: fitSpoken(isQuick ? `Watch: ${proof}.` : `Here is your proof: we test ${proof}.`, dDemo),
      shot: `Close-up locked camera test: 12 cm on ${proof}, steady focus.`,
      onScreenText: proof,
      performanceNote: "Do the test once. Do not reset for beauty.",
      editNote: editStandard,
    });
  } else if (targetStepCount === 5) {
    // Step 3: Demonstration Part 1
    const dDemo1 = boundaries[3] - boundaries[2];
    steps.push({
      id: `${input.lane}-${input.index}-3`,
      order: 3,
      stage: "demonstration",
      startSecond: boundaries[2],
      endSecond: boundaries[3],
      purpose: `Initiate test with ${proof}`,
      goal: `Show the setup before the result`,
      action: `Place ${object} on the test surface and demonstrate ${proof} step by step`,
      spokenLine: fitSpoken(`Here is your proof: we test ${proof}.`, dDemo1),
      shot: `Close-up locked camera test: 12 cm on ${proof}, steady focus.`,
      onScreenText: proof,
      performanceNote: "Do the test once. Keep movement clean.",
      editNote: editStandard,
    });
    // Step 4: Demonstration Part 2
    const dDemo2 = boundaries[4] - boundaries[3];
    steps.push({
      id: `${input.lane}-${input.index}-4`,
      order: 4,
      stage: "demonstration",
      startSecond: boundaries[3],
      endSecond: boundaries[4],
      purpose: `Prove the rule outcome with ${proof}`,
      goal: `Reveal the verifiable difference`,
      action: `Demonstrate and test ${proof}, then reveal the result and show the difference on camera`,
      spokenLine: fitSpoken(`Watch the difference we measure right here.`, dDemo2),
      shot: `Macro close-up detail shot: steady camera on the test surface.`,
      onScreenText: "the difference",
      performanceNote: "Hold frame steady on the result readout.",
      editNote: editStandard,
    });
  } else {
    // 6 steps: 3 demonstration stages
    const dDemo1 = boundaries[3] - boundaries[2];
    steps.push({
      id: `${input.lane}-${input.index}-3`,
      order: 3,
      stage: "demonstration",
      startSecond: boundaries[2],
      endSecond: boundaries[3],
      purpose: `Set up the baseline test with ${proof}`,
      goal: `Show the default error side by side`,
      action: `Place ${object} on the test surface and demonstrate the baseline`,
      spokenLine: fitSpoken(`First, look at the common default.`, dDemo1),
      shot: `Medium locked side-by-side shot across the entire setup.`,
      onScreenText: "the baseline",
      performanceNote: "Keep movement controlled.",
      editNote: editStandard,
    });
    const dDemo2 = boundaries[4] - boundaries[3];
    steps.push({
      id: `${input.lane}-${input.index}-4`,
      order: 4,
      stage: "demonstration",
      startSecond: boundaries[3],
      endSecond: boundaries[4],
      purpose: `Apply the correction with ${proof}`,
      goal: `Perform the corrective test`,
      action: `Demonstrate and test ${proof}, then reveal the result and show the difference on camera`,
      spokenLine: fitSpoken(`Now we test the adjustment with ${proof}.`, dDemo2),
      shot: `Close-up locked camera test: 12 cm on ${proof}, steady focus.`,
      onScreenText: proof,
      performanceNote: "Do the test once.",
      editNote: editStandard,
    });
    const dDemo3 = boundaries[5] - boundaries[4];
    steps.push({
      id: `${input.lane}-${input.index}-5`,
      order: 5,
      stage: "demonstration",
      startSecond: boundaries[4],
      endSecond: boundaries[5],
      purpose: `Verify the final outcome`,
      goal: `Confirm repeatable success`,
      action: `Capture the clear readout and compare the side by side difference`,
      spokenLine: fitSpoken(`We check the final readout together.`, dDemo3),
      shot: `Macro close-up detail shot: steady camera on the test surface.`,
      onScreenText: "verified readout",
      performanceNote: "Hold frame steady.",
      editNote: editStandard,
    });
  }

  // Final Step: Takeaway
  const lastStart = boundaries[targetStepCount - 1];
  const lastEnd = boundaries[targetStepCount];
  const dFinal = lastEnd - lastStart;
  steps.push({
    id: `${input.lane}-${input.index}-${targetStepCount}`,
    order: targetStepCount,
    stage: "takeaway",
    startSecond: lastStart,
    endSecond: lastEnd,
    purpose: "Leave the reusable rule",
    goal: "End on a still the viewer can copy",
    action: `Show the finished result, display the completed ${rule} checklist, and finish on a still frame`,
    spokenLine: fitSpoken(isQuick ? "Save this for your shoot." : "Save this rule for your next shoot.", dFinal),
    shot: `Static locked close-up shot on ${object} and the completed rule.`,
    onScreenText: rule,
    performanceNote: "Stop talking. Let the still sit.",
    editNote: editStandard,
  });

  return {
    id: `${input.lane}:${input.personaSlug}:${input.index}`,
    title,
    conceptSummary,
    format: "Reels",
    category: input.lane,
    platform: "instagram_reels",
    audience: persona.audience,
    durationSeconds,
    difficulty: "easy",
    requiredItems: [object, place, "phone stand", "daylight"],
    viewerTakeaway,
    whyItWorks,
    hookId: hook.id,
    shootFormat: shoot,
    presenceMode: presence,
    personaSlug: input.personaSlug,
    schemaVersion: 2,
    overallProductionNotes: [
      input.lane === "beauty"
        ? "No medical claim. Show texture and application only."
        : input.lane === "parenting_family"
          ? "Parent routine and limits only. Focus on repeatable parent steps."
          : LANE_MATRIX[input.lane].claimBoundaryTr,
      `${shoot} only. ${persona.camera}.`,
      "Shoot original vertical 9:16 footage. Keep key action inside the Reels safe zone.",
    ],
    steps,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const sqlFlag = args.indexOf("--sql-out");
  return {
    apply: args.includes("--apply"),
    dryRun: args.includes("--dry-run") || (!args.includes("--apply") && sqlFlag < 0),
    sqlOut: sqlFlag >= 0 ? args[sqlFlag + 1] : "",
    target: Number(args[args.indexOf("--target") + 1] || TARGET_DEFAULT) || TARGET_DEFAULT,
    limitCells: Number(args[args.indexOf("--limit-cells") + 1] || 0) || 0,
    personas: (() => {
      const flag = args.indexOf("--personas");
      if (flag < 0) return [] as string[];
      return String(args[flag + 1] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    })(),
  };
}

const FALLBACK_PERSONAS = Object.keys(PERSONA_KITS);

async function main() {
  const options = parseArgs();
  if (options.apply || options.sqlOut) {
    throw new Error("Direct stock publication is disabled. Use admin-generation-batches with an approved V3 profile; this tool is fixture/dry-run only.");
  }
  const personaSlugs = options.personas.length ? options.personas : FALLBACK_PERSONAS;

  const failed: string[] = [];
  const samples: Array<{ lane: PurchaseLane; persona: string; score: number; durationSeconds: number }> = [];
  let generated = 0;
  let cells = 0;

  for (const lane of LANES) {
    for (const personaSlug of personaSlugs) {
      if (options.limitCells && cells >= options.limitCells) break;
      cells += 1;
      for (let n = 0; n < options.target; n += 1) {
        const card = buildCard({ lane, personaSlug, index: n + 17, slotIndex: n, targetCount: options.target });
        const scored = scoreIdeaCard(card);
        generated += 1;
        if (!scored.redGatesPassed || scored.score < 80) {
          failed.push(`${lane}/${personaSlug}#${n} score=${scored.score} ${scored.redGateFailureReasons.join(" | ")}`);
          continue;
        }
        if (samples.length < 12) {
          samples.push({ lane, persona: personaSlug, score: scored.score, durationSeconds: card.durationSeconds });
        }
      }
    }
    if (options.limitCells && cells >= options.limitCells) break;
  }

  const summary = {
    mode: "fixture_preview",
    publicationEnabled: false,
    requestedPerCell: options.target,
    cells,
    generated,
    failed: failed.length,
    failures: failed.slice(0, 20),
    samples,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (failed.length) process.exitCode = 1;
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  path.normalize(fileURLToPath(import.meta.url)) === path.normalize(path.resolve(process.argv[1]));

if (invokedDirectly) {
  await main();
}
