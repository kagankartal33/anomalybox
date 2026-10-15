import { scoreIdeaCard } from "../lib/idea-card/quality";
import type { IdeaCard } from "../lib/idea-card/types";

const highQualityCard: IdeaCard = {
  id: "test-high-quality",
  title: "Behind the Scenes Skincare Formulation",
  conceptSummary: "Show the raw lab workflow and trial-and-error process of testing a new facial oil formulation.",
  format: "Reels",
  category: "beauty",
  platform: "instagram_reels",
  audience: "Skincare enthusiasts looking for honest ingredient proof",
  durationSeconds: 20,
  difficulty: "medium",
  requiredItems: ["Lab beaker", "Pipette", "Facial oil sample"],
  viewerTakeaway: "Understanding that real formulation takes multiple iterations.",
  whyItWorks: "Ters reçete: dört partiyi çöpe atınca izleyici durur. Stabil karışım kanıtı kaydettirir.",
  hookId: "reverse_prescription",
  shootFormat: "talking_head",
  presenceMode: "editorial_insider",
  personaSlug: "luxury_editor",
  overallProductionNotes: [
    "Keep lighting neutral daylight without warm filters",
    "Focus camera macro lens on liquid texture transition"
  ],
  schemaVersion: 2,
  steps: [
    {
      id: "s1",
      order: 1,
      stage: "hook",
      startSecond: 0,
      endSecond: 4,
      purpose: "Hook attention with formulation friction",
      goal: "Establish real lab test context",
      action: "Hold up pipette with cloudy mixture to camera light",
      spokenLine: "We had to throw away four batches before this worked.",
      shot: "Eye-level close-up of glass pipette with liquid, 0.5m",
      onScreenText: "Batch #4 vs Batch #5",
      performanceNote: "Direct eye contact, calm voice"
    },
    {
      id: "s2",
      order: 2,
      stage: "context",
      startSecond: 4,
      endSecond: 10,
      purpose: "Explain active ingredient separation",
      goal: "Show why ingredient separation happens",
      action: "Pour oil into beaker and stir slowly with glass rod",
      spokenLine: "The vitamin C kept separating from the oil layer.",
      shot: "Overhead shot of beaker",
      editNote: "Speed up stirring 1.5x"
    },
    {
      id: "s3",
      order: 3,
      stage: "demonstration",
      startSecond: 10,
      endSecond: 16,
      purpose: "Demonstrate final stable blend solution",
      goal: "Show visual texture proof of stable formula",
      action: "Drop finished clear oil onto wrist and blend into skin",
      spokenLine: "Adding squalane stabilized the blend instantly.",
      shot: "Macro shot of oil texture absorbing into skin"
    },
    {
      id: "s4",
      order: 4,
      stage: "takeaway",
      startSecond: 16,
      endSecond: 20,
      purpose: "Summarize formulation lesson",
      goal: "Provide saveable formula tip for viewers",
      action: "Cap the dark amber glass dropper bottle firmly",
      spokenLine: "Check the label for squalane if your facial oil feels heavy.",
      shot: "Chest-up frame while capping the bottle on linen"
    }
  ]
};

console.log("Testing scoreIdeaCard...");
const result = scoreIdeaCard(highQualityCard);
console.log("High Quality Card Score:", result.score, "Band:", result.band, "Passed:", result.redGatesPassed);

if (!result.redGatesPassed || result.score < 80 || result.band !== "high") {
  console.error("Test Failed: Expected high quality card to pass Red Gates with score >= 80");
  console.error(result);
  process.exit(1);
}

const slopCard: IdeaCard = {
  ...highQualityCard,
  id: "test-slop",
  conceptSummary:
    "We meticulously delve into the intricate tapestry of formulation to showcase a pivotal blend.",
};
const slop = scoreIdeaCard(slopCard);
if (slop.redGatesPassed || slop.score > 50) {
  console.error("Test Failed: LLM-style residue must fail the red gate");
  console.error(slop);
  process.exit(1);
}

console.log("✅ scoreIdeaCard verification passed!", {
  high: result.score,
  slop: slop.score,
  slopReasons: slop.redGateFailureReasons.slice(0, 3),
});
