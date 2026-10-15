# VIRALBOX IDEA CARD SYSTEM — ULTRA-DETAILED LOW-REASONING IMPLEMENTATION BRIEF

**Document purpose:**  
This document is written for a coding agent operating with **low reasoning depth**. It is intentionally explicit, repetitive where necessary, and organized as a strict execution plan.

The agent must follow the steps in order.

Do not skip phases.

Do not redesign unrelated parts of the ViralBox product.

Do not create a second parallel card system.

Do not replace the current premium ViralBox visual language.

The task is successful only when the complete pipeline is improved:

```text
idea generation
→ response parsing
→ validation
→ repair or fallback
→ storage
→ API delivery
→ compatibility conversion
→ UI rendering
→ responsive behavior
→ accessibility
→ automated testing
```

---

# 0. PRIMARY TASK

Completely improve the ViralBox idea-card system so that every card is:

- easy to understand;
- natural in English;
- practical to film;
- free from vague AI language;
- free from unnecessary repetition;
- structurally valid;
- chronologically valid;
- readable on desktop and mobile;
- safe for old saved cards;
- validated before being shown to users.

The current system contains unclear language such as:

- “For this Beauty moment...”
- “Start from the premium frame...”
- “Here is the proof detail...”
- “Let the proof carry the energy.”
- “The hidden decision.”
- “Tell me which option you would remove first.”

These phrases sound artificial and do not tell the creator exactly what to do.

The fix must not be limited to changing visible labels.

The complete card system must be inspected and corrected.

---

# 1. NON-NEGOTIABLE PRODUCT PRINCIPLE

Every card must answer the following questions quickly:

1. What is the content idea?
2. Why would a viewer watch it?
3. What happens first?
4. What does the creator physically do?
5. What does the creator say?
6. What does the camera show?
7. What appears as on-screen text?
8. How long does each step last?
9. What should the viewer understand?
10. What should the viewer do at the end?

Use this rule everywhere:

> One field has one job.

Never repeat the same instruction across multiple fields.

Bad example:

```text
Action:
Show the finished result and explain the mistake.

Say this:
“I will show the finished result and explain the mistake.”

Performance note:
“Show the result confidently while explaining the mistake.”
```

Correct example:

```text
Action:
Hold the finished result on screen, then raise the phone notes.

Say this:
“This looks effortless, but one small mistake nearly ruined it.”

Performance note:
Pause briefly after “effortless.”
```

Each field now provides different information.

---

# 2. STRICT SCOPE

## 2.1 In scope

The agent must inspect and improve:

- card data types;
- database or persistence schema;
- API payloads;
- server-side card generation;
- AI prompts;
- JSON parsing;
- response validation;
- repair or retry logic;
- old-card compatibility;
- card header;
- flow overview;
- detailed shoot steps;
- timestamps;
- empty-field handling;
- component accessibility;
- responsive layout;
- automated tests;
- seed data and fixtures;
- admin card preview if the same card renderer is used;
- translations or labels related to card fields.

## 2.2 Out of scope

Do not redesign:

- Home;
- Store;
- Pricing;
- Vault shelf;
- Atelier;
- Login;
- Profile;
- Legal;
- Admin navigation;
- branding;
- box renders;
- checkout;
- authentication;
- unrelated database tables.

Do not:

- create a new design system;
- introduce a second card renderer;
- rewrite the entire application;
- migrate all historical content using AI without explicit user approval;
- remove old database fields before compatibility is proven;
- hardcode the sample card as the only supported format.

---

# 3. REQUIRED EXECUTION ORDER

Follow this exact order:

```text
PHASE 1  — Inspect repository
PHASE 2  — Document current architecture
PHASE 3  — Define final card model
PHASE 4  — Add compatibility adapter
PHASE 5  — Add normalization utilities
PHASE 6  — Add structural validation
PHASE 7  — Add language-quality validation
PHASE 8  — Replace generation prompt
PHASE 9  — Add repair and retry flow
PHASE 10 — Refactor API and storage path
PHASE 11 — Refactor card UI
PHASE 12 — Add responsive behavior
PHASE 13 — Add accessibility
PHASE 14 — Add tests
PHASE 15 — Run migration checks
PHASE 16 — Run quality checks
PHASE 17 — Produce final implementation report
```

Do not begin UI work before understanding the data pipeline.

Do not change the generation prompt without validating the output.

Do not delete old fields during the first implementation.

---

# 4. PHASE 1 — REPOSITORY INSPECTION

## 4.1 Search the entire repository

Search for all of these exact terms:

```text
Scene Flow
Production Brief
Video Flow
Shoot Plan
Shot in order
What to do
Voice / Line
Say this
On-screen Text
Camera / Shot
Pose
Performance note
Hook
Setup
Context
Proof
Demonstration
Payoff
Takeaway
CTA
The Trust Marker
premium frame
premium moment
Beauty moment
proof detail
carry the energy
hidden decision
viewer takeaway
durationSeconds
startSecond
endSecond
idea card
ideaCard
IdeaCard
sceneFlow
productionBrief
```

Also search for likely generation-related terms:

```text
OpenAI
chat.completions
responses.create
generateIdea
generateCard
createIdea
prompt
systemPrompt
JSON.parse
zod
safeParse
schema
seed
fixture
mock
```

## 4.2 Identify all relevant file categories

Create an internal list of:

- React components that render cards;
- server actions;
- API routes;
- AI generation modules;
- database models;
- ORM schema files;
- TypeScript interfaces;
- Zod schemas;
- translation files;
- mock data;
- fixtures;
- tests;
- CSS modules;
- Tailwind class blocks;
- formatters;
- timeline utilities;
- card admin tools.

## 4.3 Do not assume file names

The repository may not use the names in this document.

Find the real files first.

## 4.4 Required inspection output

Before editing, produce an internal architecture map similar to:

```text
Generation entry:
src/server/generateIdea.ts

Prompt:
src/server/prompts/ideaCardPrompt.ts

Validation:
src/lib/ideaCardSchema.ts

Storage:
prisma/schema.prisma
Idea table / ideaJson field

API:
src/app/api/ideas/[id]/route.ts

Renderer:
src/components/cards/IdeaCardDetail.tsx

Timeline:
src/components/cards/SceneFlow.tsx

Fixtures:
src/data/mockIdeas.ts
```

This is only an example.

Use the real repository paths.

---

# 5. PHASE 2 — DOCUMENT CURRENT ARCHITECTURE

Before making changes, determine:

1. Where idea cards are generated.
2. Whether generation returns text, JSON, or both.
3. Whether the JSON is validated.
4. Whether malformed AI output is stored.
5. Whether the card is stored as JSON or normalized database rows.
6. Whether old cards use a different shape.
7. Whether labels are hardcoded.
8. Whether UI duplicates fields.
9. Whether timestamps are strings or numbers.
10. Whether mobile and desktop use the same component.
11. Whether a card can have fewer than five stages.
12. Whether the total duration is stored separately.
13. Whether category names are inserted directly into prompts.
14. Whether retry logic already exists.
15. Whether there is an admin preview.

Create a short code comment or implementation note if the current architecture contains risks.

Do not silently guess.

---

# 6. FINAL USER-FACING TERMINOLOGY

Use these labels in the UI unless the existing product has a translation system requiring translation keys.

| Old label | New label |
|---|---|
| Scene Flow | Video Flow |
| Production Brief | Shoot Plan |
| Setup | Context |
| Proof | Demonstration |
| Payoff | Takeaway |
| What to do | Action |
| Voice / Line | Say this |
| Camera / Shot | Shot |
| Pose | Performance note |
| On-screen Text | On-screen text |
| Shot in order | Timeline |
| Beat | Step |

The five default stages are:

1. Hook
2. Context
3. Demonstration
4. Takeaway
5. CTA

Do not force all ideas into exactly five stages.

Allowed stage counts:

- minimum: 3;
- typical: 4–6;
- maximum by default: 8.

Use custom stages only when they provide real value.

Examples of valid custom stages:

- Ingredient reveal;
- Before;
- Test;
- Comparison;
- Result;
- Objection;
- Transition;
- Recap.

Do not use meaningless custom names such as:

- Moment;
- Energy;
- Value;
- Premium;
- Impact;
- Magic.

---

# 7. FINAL CARD INFORMATION ARCHITECTURE

The card must appear in this order:

```text
1. Card title
2. Concept summary
3. Metadata
4. Viewer takeaway
5. Video Flow overview
6. Detailed Shoot Plan
7. Optional overall production notes
```

## 7.1 Card title

Requirements:

- 2–7 words preferred;
- memorable but understandable;
- no vague luxury language;
- no clickbait punctuation;
- no quotation marks unless needed;
- title must match the actual idea.

Good:

- The Trust Marker
- One Detail Changed Everything
- Before the Final Cut
- The Texture Test
- The Form Mistake
- What the Camera Missed

Bad:

- Unlocking Authentic Impact
- Premium Beauty Moment
- The Ultimate Game-Changing Reveal
- Strategic Storytelling Excellence

## 7.2 Concept summary

Purpose:

Explain the complete idea in one sentence.

Requirements:

- 12–35 words;
- direct;
- specific;
- category-relevant;
- explain what is revealed, compared, demonstrated, or taught.

Good:

```text
Reveal one small correction behind a polished beauty result to show viewers how the final look was actually achieved.
```

Bad:

```text
Create an authentic moment that elevates the viewer experience through a premium reveal.
```

## 7.3 Metadata

Show only useful metadata.

Required metadata:

- format;
- estimated duration;
- difficulty;
- required items.

Optional metadata:

- category;
- platform;
- filming style;
- audience;
- location;
- audio style.

Do not show:

- internal database IDs;
- generation model;
- prompt version;
- confidence score;
- hidden moderation metadata;
- raw JSON keys.

## 7.4 Viewer takeaway

Purpose:

State what the viewer should understand by the end.

Requirements:

- 6–24 words;
- one clear lesson;
- not a slogan;
- not a CTA;
- not a duplicate of the concept.

Example:

```text
A polished result often comes from identifying and fixing one precise detail.
```

## 7.5 Video Flow overview

Each item contains exactly:

- time range;
- stage label;
- one-sentence purpose.

Do not include:

- full dialogue;
- detailed camera instructions;
- performance direction;
- editing detail;
- long paragraphs.

Example:

```text
0:00–0:05 — Hook
Show the finished result and create curiosity about the mistake behind it.
```

## 7.6 Detailed Shoot Plan

Each step may contain:

- Time
- Goal
- Action
- Say this
- Shot
- On-screen text
- Edit note
- Performance note

Required per step:

- Time
- Stage
- Goal
- Action

Optional:

- Say this
- Shot
- On-screen text
- Edit note
- Performance note

Do not display optional fields when empty.

---

# 8. FIELD-BY-FIELD WRITING RULES

## 8.1 Goal

Purpose:

Explain what the step must achieve for the viewer.

Good:

```text
Create curiosity by contrasting the polished result with the mistake behind it.
```

Bad:

```text
Show the result.
```

Bad:

```text
Use a close-up shot.
```

The second bad example belongs in `Shot`, not `Goal`.

Rules:

- 6–24 words preferred;
- begin with a clear objective;
- no camera mechanics;
- no quoted speech;
- no duplicate of `Action`.

## 8.2 Action

Purpose:

Explain the creator’s physical action.

Good:

```text
Hold the finished look on screen for one second, then raise the phone into frame.
```

Bad:

```text
Create curiosity.
```

Bad:

```text
“This looks effortless.”
```

Rules:

- use physical verbs;
- include object or subject;
- include order where necessary;
- 6–35 words preferred;
- do not use abstract terms such as “elevate,” “deliver impact,” or “carry energy.”

Useful physical verbs:

- hold;
- show;
- raise;
- point;
- turn;
- compare;
- place;
- cut;
- open;
- pour;
- rotate;
- demonstrate;
- repeat;
- pause;
- reveal;
- remove;
- add;
- switch;
- walk;
- tap;
- zoom;
- frame.

## 8.3 Say this

Purpose:

Provide natural spoken dialogue.

Good:

```text
“This looks effortless, but one small mistake nearly ruined it.”
```

Bad:

```text
“The creator explains that the finished result contains a hidden correction.”
```

Bad:

```text
“For this Beauty moment, I start from the premium frame.”
```

Rules:

- must sound natural aloud;
- normally 5–18 words;
- maximum soft limit: 30 words;
- use first person when appropriate;
- do not include stage directions inside dialogue;
- do not mention internal labels;
- do not mention “the viewer”;
- do not sound like an essay;
- do not repeat `Action`.

## 8.4 Shot

Purpose:

Explain framing and camera behavior.

Good:

```text
Use a tight front-facing shot. Keep the corrected detail visible when the phone enters frame.
```

Bad:

```text
Make it dynamic.
```

Rules:

- state framing;
- state camera movement only when needed;
- state subject placement when needed;
- use normal creator language;
- avoid advanced cinematography jargon unless creator mode is professional;
- 5–25 words preferred.

Allowed simple framing terms:

- wide shot;
- medium shot;
- close-up;
- overhead shot;
- side angle;
- front-facing shot;
- over-the-shoulder shot;
- detail shot;
- static camera;
- handheld;
- slow push-in;
- matching angle;
- split-screen.

## 8.5 On-screen text

Purpose:

Support the scene with a short phrase.

Good:

```text
The correction that saved it
```

Bad:

```text
This is the small correction behind the polished result and why it matters
```

Rules:

- 2–8 words preferred;
- maximum 10 words;
- no punctuation unless needed;
- not a full subtitle;
- not identical to spoken line;
- omit when unnecessary.

## 8.6 Edit note

Purpose:

Explain the cut, pacing, comparison, or transition.

Good:

```text
Cut directly from the note to a close-up of the corrected detail.
```

Bad:

```text
Use a seamless transition.
```

Bad:

```text
Keep it engaging.
```

Rules:

- specific;
- executable;
- 5–22 words preferred;
- avoid decorative transition language;
- do not repeat `Shot`.

## 8.7 Performance note

Purpose:

Explain delivery, expression, gesture, emphasis, or pause.

Good:

```text
Speak calmly and pause briefly before revealing the phone.
```

Bad:

```text
Show the result.
```

Rules:

- optional;
- use only when performance matters;
- do not restate physical scene action;
- 4–18 words preferred.

---

# 9. LANGUAGE STANDARD

Use:

- clear international English;
- CEFR B1–B2 reading level;
- active voice;
- short sentences;
- concrete nouns;
- specific verbs;
- natural dialogue;
- category-specific vocabulary;
- direct production instructions.

Avoid:

- agency jargon;
- motivational language;
- vague luxury words;
- generic engagement language;
- abstract AI phrasing;
- repeated category names;
- repetitive sentence openings.

## 9.1 Banned or strongly discouraged phrases

The validator and generation prompt must discourage these phrases:

```text
premium moment
premium frame
beauty moment
fitness moment
food moment
proof detail
carry the energy
elevate the content
authentic impact
polished storytelling
hidden decision
compelling reveal
engaging experience
captivating content
seamless transition
strategic authenticity
dynamic visual
resonate with viewers
high-value content
powerful payoff
stop the scroll
game-changing
unlock
leverage
next-level
effortless engagement
bring value
add value
deliver value
create impact
drive engagement
maximize impact
authentic connection
visual journey
storytelling moment
premium experience
meaningful moment
content moment
strong energy
credible energy
polished energy
```

Do not automatically reject every sentence containing a single word such as “premium.”

Reject or warn when the phrase is vague in context.

---

# 10. CATEGORY-SPECIFIC LANGUAGE

The raw category name must not be inserted unnaturally into dialogue.

Bad beauty copy:

```text
For this Beauty moment, I start from the premium frame.
```

Better:

```text
I kept the finished look, but softened the detail that was drawing too much attention.
```

Bad fitness copy:

```text
For this Fitness moment, show the premium result.
```

Better:

```text
Show the completed movement first, then demonstrate the mistake that changes the form.
```

Bad food copy:

```text
Reveal the proof detail of the Food moment.
```

Better:

```text
Cut the finished dish open and show the texture viewers could not see from the outside.
```

Bad technology copy:

```text
Create a powerful payoff by revealing the hidden feature.
```

Better:

```text
Show the setting before and after the change so viewers can see what it actually improves.
```

Bad travel copy:

```text
Deliver an authentic travel reveal.
```

Better:

```text
Start with the crowded viewpoint, then show the quieter entrance two streets behind it.
```

---

# 11. CTA RULES

Every CTA must relate directly to the demonstrated idea.

## 11.1 Good CTA categories

### Judgment

```text
Which version works better?
```

### Choice

```text
Which detail would you change first?
```

### Experience

```text
Have you made this mistake before?
```

### Application

```text
Where would you use this correction?
```

### Comparison

```text
Did you notice the difference before the reveal?
```

### Prediction

```text
Which result did you expect?
```

## 11.2 Avoid generic CTAs

Avoid:

```text
What do you think?
Let me know below.
Follow for more.
Save this for later.
Tag a friend.
Do you agree?
Comment below.
Share this.
```

These may be used only if explicitly required by a campaign strategy.

## 11.3 CTA relevance check

A CTA is invalid when it refers to options that were not shown.

Bad:

```text
Which option would you remove first?
```

This is invalid if the video never shows multiple options.

---

# 12. FINAL TYPESCRIPT MODEL

Adapt to the existing project conventions.

Do not create duplicate competing models.

Preferred model:

```ts
export type IdeaCardDifficulty = "easy" | "medium" | "advanced";

export type IdeaCardStage =
  | "hook"
  | "context"
  | "demonstration"
  | "takeaway"
  | "cta"
  | "custom";

export type IdeaCardStep = {
  id: string;
  order: number;
  stage: IdeaCardStage;
  customStageLabel?: string;

  startSecond: number;
  endSecond: number;

  purpose: string;
  goal: string;
  action: string;

  spokenLine?: string;
  shot?: string;
  onScreenText?: string;
  editNote?: string;
  performanceNote?: string;
};

export type IdeaCard = {
  id: string;
  title: string;
  conceptSummary: string;

  format: string;
  category: string;
  platform?: string;
  audience?: string;

  durationSeconds: number;
  difficulty: IdeaCardDifficulty;

  requiredItems: string[];
  viewerTakeaway: string;

  steps: IdeaCardStep[];

  overallProductionNotes?: string[];
  schemaVersion: 2;
};
```

## 12.1 Purpose versus goal

To reduce confusion, the implementation may choose one of these approaches:

### Recommended approach

Use:

- `purpose` in the overview;
- `goal` in detailed steps.

The two fields must not be identical.

Example:

```text
purpose:
Show the finished result and create curiosity about the mistake behind it.

goal:
Make viewers want to see the correction before they scroll away.
```

### Simpler alternative

Use only `purpose` and display it in both places.

Use this simpler approach only when the current system cannot safely support both fields.

If one field is reused, do not display it twice on the same screen.

---

# 13. ZOD VALIDATION SCHEMA EXAMPLE

Use the project’s validation library.

If Zod is already installed, use a schema equivalent to:

```ts
import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional();

export const ideaCardStageSchema = z.enum([
  "hook",
  "context",
  "demonstration",
  "takeaway",
  "cta",
  "custom",
]);

export const ideaCardStepSchema = z
  .object({
    id: z.string().trim().min(1),
    order: z.number().int().min(1),
    stage: ideaCardStageSchema,
    customStageLabel: optionalTrimmedString,

    startSecond: z.number().int().min(0),
    endSecond: z.number().int().positive(),

    purpose: z.string().trim().min(6).max(240),
    goal: z.string().trim().min(6).max(240),
    action: z.string().trim().min(6).max(320),

    spokenLine: optionalTrimmedString,
    shot: optionalTrimmedString,
    onScreenText: optionalTrimmedString,
    editNote: optionalTrimmedString,
    performanceNote: optionalTrimmedString,
  })
  .superRefine((step, ctx) => {
    if (step.endSecond <= step.startSecond) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endSecond"],
        message: "endSecond must be greater than startSecond",
      });
    }

    if (step.stage === "custom" && !step.customStageLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customStageLabel"],
        message: "customStageLabel is required when stage is custom",
      });
    }

    if (step.stage !== "custom" && step.customStageLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customStageLabel"],
        message: "customStageLabel is only allowed for custom stages",
      });
    }
  });

export const ideaCardSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(2).max(80),
    conceptSummary: z.string().trim().min(12).max(320),

    format: z.string().trim().min(2).max(80),
    category: z.string().trim().min(2).max(80),
    platform: optionalTrimmedString,
    audience: optionalTrimmedString,

    durationSeconds: z.number().int().min(5).max(600),
    difficulty: z.enum(["easy", "medium", "advanced"]),

    requiredItems: z.array(z.string().trim().min(1).max(120)).max(20),
    viewerTakeaway: z.string().trim().min(6).max(240),

    steps: z.array(ideaCardStepSchema).min(3).max(8),

    overallProductionNotes: z
      .array(z.string().trim().min(1).max(240))
      .max(10)
      .optional(),

    schemaVersion: z.literal(2),
  })
  .superRefine((card, ctx) => {
    const sorted = [...card.steps].sort((a, b) => a.order - b.order);

    if (sorted[0]?.startSecond !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["steps", 0, "startSecond"],
        message: "The first step must start at 0 seconds",
      });
    }

    for (let index = 0; index < sorted.length; index += 1) {
      const step = sorted[index];
      const expectedOrder = index + 1;

      if (step.order !== expectedOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index, "order"],
          message: `Expected order ${expectedOrder}`,
        });
      }

      const next = sorted[index + 1];

      if (next && step.endSecond !== next.startSecond) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index, "endSecond"],
          message: "Steps must be continuous with no gaps or overlaps",
        });
      }
    }

    const finalStep = sorted.at(-1);

    if (finalStep && finalStep.endSecond !== card.durationSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationSeconds"],
        message: "durationSeconds must equal the final step end time",
      });
    }
  });
```

Do not copy this blindly if the project already has a schema.

Integrate with existing types.

---

# 14. OLD CARD COMPATIBILITY

Old fields may include:

```text
hook
setup
proof
payoff
cta
whatToDo
voiceLine
cameraShot
pose
sceneFlow
productionBrief
```

## 14.1 Mapping table

```text
hook       → hook
setup      → context
proof      → demonstration
payoff     → takeaway
cta        → cta

whatToDo   → action
voiceLine  → spokenLine
cameraShot → shot
pose       → performanceNote
```

## 14.2 Compatibility requirements

- old cards must continue to render;
- old database records must not be deleted;
- unknown fields must not crash the page;
- absent optional fields must not produce empty labels;
- invalid timestamps must be normalized when possible;
- unsafe values must fall back gracefully;
- old content must not be silently rewritten by AI.

## 14.3 Adapter example

Create a function equivalent to:

```ts
export function adaptLegacyIdeaCard(input: unknown): IdeaCard {
  // 1. Detect schema version.
  // 2. If version 2, validate and normalize.
  // 3. If legacy, map old fields.
  // 4. Generate stable step IDs when absent.
  // 5. Convert string times to seconds.
  // 6. Remove empty values.
  // 7. Remove exact duplicates.
  // 8. Apply safe fallback values only when necessary.
  // 9. Return schemaVersion: 2.
}
```

## 14.4 Schema detection

Recommended:

```ts
function isV2Card(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    (value as { schemaVersion?: unknown }).schemaVersion === 2
  );
}
```

## 14.5 Stable IDs

When legacy steps do not have IDs:

```ts
id: `${cardId}-step-${index + 1}`
```

Do not use random IDs during rendering.

Random IDs can cause unstable React keys.

---

# 15. TIME NORMALIZATION

The system may contain time values such as:

```text
0:00
00:05
0:05–0:12
5
5s
00:00:05
```

Create one shared parser.

## 15.1 Required parser behavior

Input examples:

| Input | Seconds |
|---|---:|
| `0` | 0 |
| `5` | 5 |
| `"5"` | 5 |
| `"5s"` | 5 |
| `"0:05"` | 5 |
| `"00:05"` | 5 |
| `"1:05"` | 65 |
| `"00:01:05"` | 65 |

Invalid values must return a controlled failure, not `NaN`.

## 15.2 Formatter

Use one formatter:

```ts
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatTimeRange(
  startSecond: number,
  endSecond: number,
): string {
  return `${formatTime(startSecond)}–${formatTime(endSecond)}`;
}
```

Use the en dash `–`, not a random mixture of hyphens.

---

# 16. TIMELINE VALIDATION

The final timeline must follow all rules:

1. First step begins at 0.
2. Every step ends after it begins.
3. Steps are ordered.
4. Step orders are sequential.
5. No overlaps.
6. No gaps.
7. Final end time equals total duration.
8. Duration is a positive integer.
9. Displayed duration matches stored duration.
10. Time labels use one formatter.

## 16.1 Repairable timeline issues

The system may repair:

- missing step IDs;
- string numbers;
- inconsistent order values;
- exact duplicate steps;
- empty optional fields;
- one-second rounding differences;
- final duration copied incorrectly.

## 16.2 Non-repairable timeline issues

Trigger regeneration or safe fallback when:

- many steps overlap;
- no valid start/end data exists;
- final duration is impossible;
- steps are unordered and semantically unclear;
- step count is zero;
- card contains contradictory timelines.

Do not invent a complex timeline from unusable data without logging it.

---

# 17. TEXT NORMALIZATION

Create shared helpers.

## 17.1 Basic normalization

Normalize:

- leading/trailing spaces;
- repeated spaces;
- accidental line-break duplication;
- repeated punctuation;
- malformed smart quotes where possible;
- empty strings;
- strings containing only punctuation;
- strings containing only placeholders.

## 17.2 Example

```ts
export function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();

  if (!normalized) {
    return undefined;
  }

  return normalized;
}
```

## 17.3 Placeholder detection

Reject or remove:

```text
Lorem ipsum
TBD
TODO
N/A
Insert text
Add text here
Example line
Placeholder
[Category]
[Product]
[Creator]
```

Do not remove legitimate text containing the letters “NA.”

Use exact or safe pattern matching.

---

# 18. DUPLICATION DETECTION

Detect both exact and near-duplicate text.

## 18.1 Exact duplication

Normalize and compare:

- lowercase;
- remove punctuation;
- collapse whitespace.

Example:

```ts
function canonicalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
```

## 18.2 Near duplication

Use a simple deterministic method.

Low-reasoning implementation option:

1. tokenize;
2. remove common stop words;
3. compare token overlap;
4. warn when overlap exceeds a threshold.

Example:

```ts
function tokenSet(value: string): Set<string> {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "this",
    "that",
    "it",
    "is",
    "are",
    "be",
  ]);

  return new Set(
    canonicalizeForComparison(value)
      .split(" ")
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);

  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;

  return intersection / union;
}
```

Suggested warning threshold:

```text
0.72
```

Suggested hard-error threshold for long fields:

```text
0.88
```

Do not treat very short fields as near duplicates only because they share two words.

---

# 19. LANGUAGE-QUALITY VALIDATOR

Create a validator that returns:

```ts
type QualityIssueSeverity = "warning" | "error";

type QualityIssue = {
  code: string;
  severity: QualityIssueSeverity;
  path: string;
  message: string;
  suggestion?: string;
};
```

## 19.1 Required issue codes

Use stable codes such as:

```text
MISSING_REQUIRED_FIELD
INVALID_STAGE
INVALID_TIME_RANGE
TIMELINE_GAP
TIMELINE_OVERLAP
DURATION_MISMATCH
DUPLICATE_FIELD_TEXT
NEAR_DUPLICATE_FIELD_TEXT
PLACEHOLDER_TEXT
BANNED_VAGUE_PHRASE
SPOKEN_LINE_TOO_LONG
ON_SCREEN_TEXT_TOO_LONG
UNNATURAL_CATEGORY_INSERTION
GENERIC_CTA
IRRELEVANT_CTA
META_LANGUAGE_IN_DIALOGUE
EMPTY_OPTIONAL_FIELD
MALFORMED_QUOTES
UNSUPPORTED_SCHEMA_VERSION
```

## 19.2 Meta-language detection

Reject dialogue containing phrases such as:

```text
the creator should
the creator says
the user sees
the audience will see
this content will
this video should
insert product name
insert category
add text here
the model should
```

These phrases belong in instructions, not spoken dialogue.

## 19.3 Soft length limits

Use warnings:

| Field | Preferred |
|---|---:|
| title | 2–7 words |
| concept summary | 12–35 words |
| viewer takeaway | 6–24 words |
| purpose | 6–24 words |
| goal | 6–24 words |
| action | 6–35 words |
| spoken line | 5–18 words |
| shot | 5–25 words |
| on-screen text | 2–8 words |
| edit note | 5–22 words |
| performance note | 4–18 words |

Hard limits should be more generous.

Do not reject useful content for being one or two words outside a preferred range.

---

# 20. GENERATION INPUT CONTRACT

The generator must receive structured inputs.

Required:

```ts
type GenerateIdeaCardInput = {
  category: string;
  creatorMode: string;
  audience: string;
  platform: string;
  desiredDurationSeconds: number;
  contentObjective: string;
  tone: string;
  availableEquipment: string[];
  brandSafetyConstraints: string[];
  numberOfIdeas: number;
};
```

Optional:

```ts
type GenerateIdeaCardOptionalInput = {
  location?: string;
  creatorExperienceLevel?: string;
  speakingPreference?: "speaking" | "voiceover" | "no-dialogue" | "mixed";
  editingLevel?: "basic" | "intermediate" | "advanced";
  productOrTopic?: string;
  language?: string;
  bannedClaims?: string[];
};
```

Do not build a prompt from undefined values.

Normalize all inputs first.

---

# 21. MASTER SYSTEM PROMPT

Use an equivalent prompt.

Do not include Markdown fences if the API requires plain text.

```text
You are a senior short-form video producer and practical shoot planner.

You create execution-ready creator cards.

Your output must help a creator film the video without rewriting or interpreting vague instructions.

Use clear, natural, internationally understandable English.

Use direct verbs, concrete nouns, short sentences, and natural spoken dialogue.

Do not write like an advertising agency, motivational speaker, or generic AI assistant.

Do not use abstract marketing language.

Do not repeat the same instruction across multiple fields.

Each field has one job:

- purpose explains what the section does for the viewer;
- goal explains what the step must achieve;
- action explains what the creator physically does;
- spokenLine contains only natural words the creator can say aloud;
- shot explains framing and camera behavior;
- onScreenText contains a short supporting phrase;
- editNote explains a specific cut, pacing choice, comparison, or transition;
- performanceNote explains delivery, expression, gesture, emphasis, or pause.

Do not include stage directions inside spokenLine.

Do not include dialogue inside action.

Do not repeat the spoken line as on-screen text.

Do not repeat the action as a performance note.

Do not insert the raw category name unnaturally into sentences.

Do not use generated meta-language such as:

- the creator should;
- the user sees;
- this content will;
- insert product name;
- add category here.

Avoid vague phrases including:

- premium moment;
- premium frame;
- beauty moment;
- fitness moment;
- food moment;
- proof detail;
- carry the energy;
- elevate the content;
- authentic impact;
- polished storytelling;
- hidden decision;
- compelling reveal;
- engaging experience;
- captivating content;
- seamless transition;
- strategic authenticity;
- dynamic visual;
- resonate with viewers;
- high-value content;
- powerful payoff;
- stop the scroll;
- game-changing;
- unlock;
- leverage;
- next-level;
- effortless engagement.

The timeline must be continuous.

The first step must start at 0.

Each step must start when the previous step ends.

The final step must end at the requested total duration.

Use between 3 and 8 steps.

Use the standard stages when appropriate:

- hook;
- context;
- demonstration;
- takeaway;
- cta.

Use custom stages only when they communicate a clearer real production step.

Every card must contain:

- a specific title;
- a one-sentence concept summary;
- a format;
- a category;
- total duration;
- difficulty;
- required items;
- one clear viewer takeaway;
- a chronological list of executable steps.

Every step must contain:

- order;
- stage;
- startSecond;
- endSecond;
- purpose;
- goal;
- action.

Optional fields are allowed only when they provide useful information:

- spokenLine;
- shot;
- onScreenText;
- editNote;
- performanceNote.

Do not fill optional fields with vague text merely to complete the schema.

Spoken dialogue must sound natural when read aloud.

On-screen text must be shorter than spoken dialogue.

The CTA must refer directly to something shown, compared, decided, corrected, or demonstrated in the video.

Avoid generic calls to action.

Return valid JSON only.

Do not include Markdown.

Do not include commentary before or after the JSON.
```

---

# 22. USER PROMPT TEMPLATE

Build the user prompt from validated input.

Example:

```text
Create 1 execution-ready short-form video card.

Category:
Beauty

Creator mode:
Expert educator

Audience:
People interested in practical beauty techniques

Platform:
Instagram Reels

Target duration:
38 seconds

Content objective:
Build trust by revealing one small correction behind a polished result.

Tone:
Calm, direct, credible, practical

Available equipment:
- phone
- phone notes screen
- tripod
- natural window light

Speaking preference:
Speaking to camera

Editing level:
Basic

Brand-safety constraints:
- no medical claims
- no guaranteed results
- no competitor names
- no insulting language

Additional requirements:
- Use natural category-specific language.
- Do not begin sentences with “For this Beauty moment.”
- Do not use vague terms such as “premium frame” or “proof detail.”
- Make every action physically filmable.
- Make every spoken line natural aloud.
- Make the timeline add up to exactly 38 seconds.
```

Use actual user inputs.

Do not hardcode Beauty.

---

# 23. REQUIRED JSON OUTPUT SHAPE

The generation prompt must provide a schema or response format equivalent to:

```json
{
  "id": "generated-server-side-or-after-parse",
  "title": "string",
  "conceptSummary": "string",
  "format": "string",
  "category": "string",
  "platform": "string",
  "audience": "string",
  "durationSeconds": 38,
  "difficulty": "easy",
  "requiredItems": ["string"],
  "viewerTakeaway": "string",
  "steps": [
    {
      "id": "generated-server-side-or-after-parse",
      "order": 1,
      "stage": "hook",
      "startSecond": 0,
      "endSecond": 5,
      "purpose": "string",
      "goal": "string",
      "action": "string",
      "spokenLine": "optional string",
      "shot": "optional string",
      "onScreenText": "optional string",
      "editNote": "optional string",
      "performanceNote": "optional string"
    }
  ],
  "overallProductionNotes": ["optional string"],
  "schemaVersion": 2
}
```

Prefer generating IDs on the server after parsing.

Do not rely on the AI model to create stable IDs.

---

# 24. PARSING AI OUTPUT

## 24.1 Required behavior

1. Receive raw model output.
2. Strip code fences only when present.
3. Parse JSON.
4. Reject trailing commentary.
5. Validate with schema.
6. Normalize text.
7. Run timeline validation.
8. Run language-quality validation.
9. Repair if necessary.
10. Validate repaired result.
11. Store only valid final content.
12. Log errors without exposing sensitive prompt content.

## 24.2 Safe code-fence stripping

Example:

```ts
function stripJsonCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
```

Do not remove arbitrary backticks from inside valid strings.

## 24.3 JSON parsing

Use controlled error handling.

Do not call `JSON.parse` without `try/catch`.

---

# 25. REPAIR FLOW

When validation fails, do not immediately show malformed content.

Use this order:

```text
Attempt 1:
Primary generation

Validation

If only deterministic issues:
Local normalization and repair

Validation again

If semantic or language issues remain:
Targeted AI repair

Validation again

If still invalid:
One full regeneration with issue list

Validation again

If still invalid:
Safe failure response or approved fallback
```

## 25.1 Deterministic local repairs

Allowed local repairs:

- trim whitespace;
- remove empty optional fields;
- convert numeric strings;
- generate IDs;
- sort steps by order;
- renumber sequential order;
- normalize punctuation;
- normalize time values;
- remove exact duplicate optional fields;
- align one-second rounding mismatch;
- set schema version;
- deduplicate required items.

Do not locally rewrite the meaning of spoken dialogue.

## 25.2 Targeted repair prompt

Example:

```text
Repair the following idea-card JSON.

Do not create a different idea.

Preserve the title, concept, category, and overall creative direction.

Fix only the listed validation problems.

Validation problems:
- spokenLine in step 1 repeats action;
- onScreenText in step 2 is 15 words;
- steps 2 and 3 overlap by 2 seconds;
- CTA refers to options that are not shown;
- phrase “premium frame” is vague.

Requirements:
- return valid JSON only;
- keep total duration exactly 38 seconds;
- maintain continuous timestamps;
- use natural English;
- do not add commentary;
- do not add Markdown.

JSON to repair:
{...}
```

## 25.3 Retry limit

Recommended:

- one primary generation;
- one targeted repair;
- one full regeneration.

Do not create an endless retry loop.

---

# 26. STORAGE RULES

## 26.1 Store only validated content

Do not store raw malformed output as the active card.

Optional:

- store raw output in a restricted debug log;
- never expose it to the user;
- remove sensitive inputs;
- apply retention controls.

## 26.2 Schema version

Store:

```text
schemaVersion: 2
```

For old cards with no version, treat as legacy.

## 26.3 Migration strategy

Recommended:

- read old cards through adapter;
- write all newly generated cards as v2;
- optionally backfill old cards later;
- do not require a destructive migration for first release.

---

# 27. API CONTRACT

The API should return one normalized card shape.

Do not return one shape for old cards and another for new cards.

Recommended API flow:

```text
database record
→ detect schema
→ adapt legacy if needed
→ normalize
→ validate
→ return v2 DTO
```

If validation fails for a historical card:

- log the issue;
- return a safe compatibility view when possible;
- do not crash the entire page;
- do not silently return malformed fields.

---

# 28. UI COMPONENT ARCHITECTURE

Use existing components when reasonable.

Preferred component breakdown:

```text
IdeaCardPage
├── IdeaCardHeader
│   ├── IdeaCardTitle
│   ├── IdeaCardConcept
│   ├── IdeaCardMetadata
│   └── ViewerTakeaway
├── VideoFlowOverview
│   └── VideoFlowItem[]
├── ShootPlan
│   ├── ShootPlanToolbar
│   └── ShootStepCard[]
│       ├── ShootStepHeader
│       └── ShootStepField[]
└── OverallProductionNotes
```

Do not create unnecessary components for single text lines.

Do not keep one huge component if it becomes unreadable.

---

# 29. CARD HEADER UI

Display:

```text
Title
Concept summary
Metadata row
Viewer takeaway
```

## 29.1 Metadata examples

```text
Talking demonstration
38 sec
Easy
3 required items
Instagram Reels
```

Use icons only if they improve scanning.

Every icon must have an accessible label or be decorative.

## 29.2 Required items

Desktop:

- compact chips or comma-separated list;
- no oversized cards.

Mobile:

- wrap naturally;
- no horizontal overflow.

## 29.3 Viewer takeaway

Use a visually distinct but restrained block.

Do not make it look like an advertisement.

Suggested label:

```text
Viewer takeaway
```

---

# 30. VIDEO FLOW OVERVIEW UI

## 30.1 Overview item contents

Each item shows:

```text
time range
stage name
one-line purpose
```

## 30.2 Layout

Recommended desktop:

```text
[time] [stage badge] [purpose]
```

Recommended mobile:

```text
[time] [stage badge]
[purpose]
```

## 30.3 Remove the empty sidebar

The current wide empty decorative left rail must not remain unused.

Choose one:

### Option A — Recommended

Remove it entirely and use a slim vertical timeline line.

### Option B

Use it for:

- step numbers;
- a progress indicator;
- small shot-type icons.

Do not use it as blank decoration.

## 30.4 Color

Stage colors may remain as subtle accents.

Use:

- narrow left border;
- small badge;
- subtle background tint;
- timeline dot.

Do not use large saturated blocks.

Do not communicate stage identity through color alone.

---

# 31. SHOOT STEP CARD UI

## 31.1 Step header

Display:

```text
0:00–0:05
Hook
Create curiosity around the hidden correction.
```

## 31.2 Step body fields

Suggested order:

1. Action
2. Say this
3. Shot
4. On-screen text
5. Edit
6. Performance

This order follows actual production use.

## 31.3 Field rendering

Create a reusable renderer:

```ts
type ShootStepFieldProps = {
  label: string;
  value?: string;
  variant?: "default" | "dialogue" | "short";
};
```

Return `null` when `value` is empty.

Do not render:

```text
SHOT
—
```

Do not render:

```text
PERFORMANCE NOTE
Not applicable
```

## 31.4 Dialogue styling

`Say this` may use:

- quotation marks;
- slightly larger text;
- a subtle left rule;
- normal readable line height.

Do not use tiny italic text.

## 31.5 Expansion behavior

Recommended:

- first step expanded initially;
- other steps collapsed;
- “Expand all” button;
- “Collapse all” button;
- user can toggle each step;
- state remains stable during current page session.

Do not hide the overview when details are collapsed.

---

# 32. DESKTOP LAYOUT

Recommended maximum content width:

```text
1100–1280 px
```

Recommended text reading width:

```text
55–75 characters per line
```

Detailed steps may use two columns only when:

- each column remains at least about 280–320 px;
- spoken dialogue does not become too narrow;
- order remains obvious.

Suggested two-column grouping:

Left:

- Action
- Say this

Right:

- Shot
- On-screen text
- Edit
- Performance

Use one column when content is long.

Do not force a two-column layout for every step.

---

# 33. TABLET LAYOUT

At tablet width:

- reduce decorative spacing;
- keep timestamps attached to stages;
- use one or two columns depending on available width;
- prevent card content from becoming cramped;
- do not preserve a desktop sidebar merely for appearance.

---

# 34. MOBILE LAYOUT

At mobile width:

- use one column;
- use full available width;
- avoid horizontal timelines;
- avoid tiny text;
- place time and stage together;
- wrap metadata;
- use at least 16 px body text where possible;
- use comfortable line height;
- maintain 44×44 px interactive tap targets;
- avoid nested horizontal scrolling;
- avoid clipped accordions;
- avoid fixed heights;
- let dialogue wrap naturally.

Test at:

```text
320 px
360 px
375 px
390 px
414 px
```

Also test browser zoom.

---

# 35. TYPOGRAPHY

Use the existing ViralBox typography system.

Do not introduce a new font.

Requirements:

- title clearly dominant;
- concept summary readable;
- body text not excessively small;
- labels not too light;
- avoid excessive uppercase;
- avoid excessive letter spacing;
- instructional text line height approximately 1.45–1.65;
- sufficient contrast;
- do not use color as the only hierarchy tool.

Suggested hierarchy:

```text
Card title: 28–40 px responsive
Concept: 16–20 px
Section title: 20–28 px
Step title: 18–22 px
Body: 15–17 px
Labels: 11–13 px, sparingly uppercase
Metadata: 13–15 px
```

Adapt to the existing design system.

---

# 36. ACCESSIBILITY

Implement all applicable requirements.

## 36.1 Semantic structure

Use:

- one page `h1`;
- section `h2`;
- step titles `h3`;
- ordered list for chronological steps where practical.

## 36.2 Accordion

Accordion triggers must:

- be buttons;
- support keyboard activation;
- have `aria-expanded`;
- have `aria-controls`;
- have visible focus;
- not rely on a tiny icon-only target.

## 36.3 Color

- stage color cannot be the only identifier;
- use stage text;
- maintain WCAG AA contrast for normal text where applicable.

## 36.4 Zoom

Content must remain usable at:

```text
200% browser zoom
```

## 36.5 Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable or minimize accordion animation.

---

# 37. EMPTY AND MISSING FIELD BEHAVIOR

Use these rules:

| Field state | UI behavior |
|---|---|
| `undefined` | do not render |
| `null` | do not render |
| empty string | normalize to undefined |
| whitespace only | normalize to undefined |
| placeholder | reject or hide |
| optional empty array | do not render section |
| missing required field | validation failure |

Never show empty labels.

---

# 38. ERROR STATES

## 38.1 User-facing errors

Do not show raw JSON errors.

Use a calm message such as:

```text
This shoot plan could not be displayed correctly.
Please refresh or open another card.
```

Only use this when safe adaptation is impossible.

## 38.2 Logging

Log:

- card ID;
- schema version;
- validation issue codes;
- generation attempt number;
- repair attempt result.

Do not log:

- passwords;
- authentication tokens;
- unrelated user data;
- full private prompts when unnecessary.

---

# 39. ANALYTICS AND OBSERVABILITY

Only add analytics if the project already uses an analytics system.

Useful events:

```text
idea_card_opened
video_flow_viewed
shoot_step_expanded
all_steps_expanded
card_validation_failed
card_repair_attempted
card_repair_succeeded
legacy_card_adapted
```

Do not add a new analytics dependency solely for this task.

---

# 40. REWRITTEN REFERENCE EXAMPLE — THE TRUST MARKER

Use this as a quality reference.

Do not hardcode it as the only template.

## 40.1 Header

```text
Title:
The Trust Marker

Concept:
Reveal one small correction behind a polished beauty result to show viewers how the final look was actually achieved.

Format:
Talking demonstration

Category:
Beauty

Platform:
Instagram Reels

Duration:
38 seconds

Difficulty:
Easy

Required items:
- finished beauty look
- phone
- notes screen
- close-up area with the corrected detail

Viewer takeaway:
A polished result often comes from identifying and fixing one precise detail.
```

## 40.2 Video Flow

```text
0:00–0:05 — Hook
Show the finished result and create curiosity about the mistake behind it.

0:05–0:12 — Context
Introduce the note that helped identify the problem.

0:12–0:24 — Demonstration
Show the original mistake, the correction, and the visible difference.

0:24–0:33 — Takeaway
Explain the practical lesson viewers can apply to their own work.

0:33–0:38 — CTA
Invite viewers to make a specific judgment about the correction.
```

## 40.3 Step 1

```text
Time:
0:00–0:05

Stage:
Hook

Purpose:
Show the finished result and create curiosity about the mistake behind it.

Goal:
Make viewers want to see the correction before they scroll away.

Action:
Hold the finished look on screen for one second, then raise the phone into frame.

Say this:
“This looks effortless, but one small mistake nearly ruined it.”

Shot:
Use a tight front-facing shot. Keep the finished detail visible when the phone enters frame.

On-screen text:
The correction that saved it

Edit:
Cut to the phone note immediately after “one small mistake.”

Performance:
Speak calmly and pause briefly before revealing the phone.
```

## 40.4 Step 2

```text
Time:
0:05–0:12

Stage:
Context

Purpose:
Introduce the note that helped identify the problem.

Goal:
Show viewers how the issue was identified.

Action:
Turn the phone toward the camera and point to the short note describing the mistake.

Say this:
“My notes showed exactly what felt wrong: this detail was pulling attention away from the final look.”

Shot:
Use an over-the-shoulder close-up of the phone, then shift focus back to the finished result.

On-screen text:
What felt wrong

Edit:
Keep the phone text short and large enough to understand without pausing.
```

## 40.5 Step 3

```text
Time:
0:12–0:24

Stage:
Demonstration

Purpose:
Show the original mistake, the correction, and the visible difference.

Goal:
Make the correction and its effect visually clear.

Action:
Show the problem area, explain the correction, then reveal the updated version.

Say this:
“I changed this one detail, and the whole look became cleaner and more balanced.”

Shot:
Use matching before-and-after close-ups from the same angle and distance.

On-screen text:
Before → Correction → After

Edit:
Use a direct cut or simple split-screen. Do not use a decorative transition.

Performance:
Point to the exact area being discussed rather than gesturing generally.
```

## 40.6 Step 4

```text
Time:
0:24–0:33

Stage:
Takeaway

Purpose:
Explain the practical lesson viewers can apply to their own work.

Goal:
Give viewers one clear principle they can remember.

Action:
Return to the finished result and summarize the decision in one sentence.

Say this:
“The lesson is simple: fix the detail that distracts from the result, not every detail at once.”

Shot:
Return to the original front-facing composition and hold the final result steady.

On-screen text:
Fix the distraction first

Edit:
Leave the final result on screen long enough for viewers to compare it with the earlier shot.
```

## 40.7 Step 5

```text
Time:
0:33–0:38

Stage:
CTA

Purpose:
Invite viewers to make a specific judgment about the correction.

Goal:
Encourage a relevant and easy response.

Action:
Show the before-and-after versions side by side.

Say this:
“Which detail would you have corrected first?”

Shot:
Use the same crop for both versions so the comparison is fair.

On-screen text:
What would you fix first?

Edit:
End on the comparison instead of returning to a generic talking-head shot.
```

---

# 41. MULTI-CATEGORY FIXTURES

Create realistic test fixtures.

## 41.1 Fitness fixture

Title:

```text
The Form Check
```

Concept:

```text
Show one common form mistake, explain why it changes the movement, and demonstrate the corrected version from the same angle.
```

Key rule:

- no medical diagnosis;
- no guaranteed injury prevention;
- clear movement comparison;
- CTA refers to the visible form difference.

## 41.2 Food fixture

Title:

```text
The Texture Reveal
```

Concept:

```text
Show the finished dish, cut it open, and explain the one preparation choice responsible for the texture inside.
```

Key rule:

- camera shows texture clearly;
- dialogue does not use vague “food moment” language;
- CTA asks about texture or preparation.

## 41.3 Fashion fixture

Title:

```text
Why the Proportion Works
```

Concept:

```text
Compare two versions of the same outfit and show how one small proportion change affects the overall silhouette.
```

Key rule:

- avoid insulting body language;
- explain garment relationship;
- use matching camera position.

## 41.4 Technology fixture

Title:

```text
The Setting That Matters
```

Concept:

```text
Show a feature before and after one setting change so viewers can see the real practical difference.
```

Key rule:

- no unsupported performance claim;
- show visible result;
- avoid vague “unlock” language.

## 41.5 Travel fixture

Title:

```text
The Quiet Entrance
```

Concept:

```text
Start at the crowded main approach, then reveal a quieter nearby route and explain exactly how to find it.
```

Key rule:

- location instructions must be specific;
- no safety-risking advice;
- do not fabricate local facts.

## 41.6 Beauty fixture

Use “The Trust Marker” or another distinct concept.

Do not make every category follow the same script rhythm.

---

# 42. UNIT TESTS

Add tests for utilities.

## 42.1 Time formatter

Test:

```text
0 → 0:00
5 → 0:05
65 → 1:05
```

## 42.2 Time range

Test:

```text
0, 5 → 0:00–0:05
65, 74 → 1:05–1:14
```

## 42.3 Legacy adaptation

Test:

- old setup maps to context;
- old proof maps to demonstration;
- empty pose is removed;
- missing IDs are generated deterministically;
- old time strings convert correctly.

## 42.4 Duplicate detection

Test:

- exact duplicate;
- punctuation-only difference;
- near duplicate;
- unrelated fields;
- short text false positive.

## 42.5 Banned phrase detection

Test:

- “premium frame” warns;
- literal valid use does not always hard fail;
- case-insensitive detection;
- phrase inside a longer sentence.

## 42.6 CTA detection

Test:

- generic CTA warning;
- relevant choice CTA accepted;
- reference to nonexistent options warned.

---

# 43. COMPONENT TESTS

Test:

1. Header renders title and concept.
2. Metadata hides absent optional values.
3. Video Flow renders one item per step.
4. Timeline items use shared formatter.
5. First detail step is expanded by default.
6. Expand all works.
7. Collapse all works.
8. Empty optional fields are not rendered.
9. Accordion supports keyboard.
10. Correct `aria-expanded`.
11. Stage labels render as text.
12. Legacy card renders through adapter.
13. Invalid card shows safe error state.
14. Mobile layout does not overflow.
15. Long spoken line wraps.
16. No empty left rail remains.

---

# 44. INTEGRATION TESTS

Test complete flow:

```text
generation mock
→ parse
→ validation
→ storage mock
→ API response
→ renderer
```

Test these scenarios:

- fully valid first response;
- response inside JSON code fence;
- malformed JSON;
- duplicate text;
- invalid timeline;
- successful local repair;
- successful AI repair;
- failed repair;
- legacy stored card;
- optional fields omitted;
- custom stage.

---

# 45. VISUAL QA CHECKLIST

Desktop:

- title readable;
- concept easy to find;
- metadata compact;
- overview readable in seconds;
- step details not cramped;
- no empty sidebar;
- labels have sufficient contrast;
- dialogue is prominent but not oversized;
- stage colors restrained.

Mobile:

- no horizontal scroll;
- accordion tap targets large enough;
- time and stage remain together;
- metadata wraps;
- long dialogue wraps;
- no clipped shadows;
- no fixed-height truncation;
- overview remains visible.

Dark mode, if supported:

- all text readable;
- pastel accents retain contrast;
- borders visible;
- muted labels not too faint.

---

# 46. PERFORMANCE

Do not add heavy libraries for:

- timeline;
- accordion;
- text similarity;
- time formatting.

Prefer existing project utilities.

Avoid:

- rendering all large hidden sections with expensive effects;
- unnecessary client components;
- duplicate data fetching;
- layout shift from unknown content heights;
- random IDs during render.

Use server components where the project architecture supports them.

Use client components only for interactions such as accordion state.

---

# 47. SECURITY

Treat generated content as untrusted input.

Requirements:

- render text as text;
- do not inject raw HTML;
- do not use `dangerouslySetInnerHTML`;
- sanitize any existing rich-text path;
- validate arrays and objects;
- limit field length;
- avoid exposing prompt internals;
- avoid returning raw provider errors to users.

---

# 48. DATABASE MIGRATION SAFETY

Before changing database schema:

1. inspect current ORM;
2. inspect existing production migration conventions;
3. determine whether card JSON is stored in one field;
4. avoid destructive changes;
5. add nullable fields first if needed;
6. backfill only with a reversible script;
7. preserve old values;
8. test migration on sample data;
9. document rollback.

If no database change is required, do not add one.

---

# 49. ROLLOUT STRATEGY

Recommended rollout:

## Stage 1

- add v2 types;
- add adapter;
- render old and new safely.

## Stage 2

- switch new generation to v2;
- keep legacy reader.

## Stage 3

- monitor validation failures;
- improve prompt and repair logic.

## Stage 4

- optional legacy backfill after review.

Do not remove compatibility immediately.

---

# 50. IMPLEMENTATION CHECKLIST BY PHASE

## Phase 1 — Inspection

- [ ] Search all required terms.
- [ ] Identify renderer.
- [ ] Identify generation path.
- [ ] Identify storage shape.
- [ ] Identify tests.
- [ ] Identify old schema.

## Phase 2 — Architecture map

- [ ] Record real file paths.
- [ ] Record data flow.
- [ ] Record risks.
- [ ] Confirm whether schema version exists.

## Phase 3 — Model

- [ ] Add or update v2 type.
- [ ] Add stage union.
- [ ] Add optional fields.
- [ ] Add schema version.

## Phase 4 — Compatibility

- [ ] Detect legacy.
- [ ] Map old labels.
- [ ] Normalize old fields.
- [ ] Generate stable IDs.
- [ ] Preserve original meaning.

## Phase 5 — Normalization

- [ ] Normalize text.
- [ ] Normalize arrays.
- [ ] Normalize time.
- [ ] Remove empty optional values.
- [ ] Deduplicate items.

## Phase 6 — Structural validation

- [ ] Validate required fields.
- [ ] Validate stages.
- [ ] Validate step count.
- [ ] Validate order.
- [ ] Validate time.
- [ ] Validate duration.

## Phase 7 — Language validation

- [ ] Detect banned vague phrases.
- [ ] Detect placeholders.
- [ ] Detect duplicate text.
- [ ] Detect long dialogue.
- [ ] Detect long on-screen text.
- [ ] Detect generic CTA.
- [ ] Detect meta-language.

## Phase 8 — Generation prompt

- [ ] Replace vague prompt.
- [ ] Provide strict field definitions.
- [ ] Provide JSON-only instruction.
- [ ] Add banned-language rules.
- [ ] Add timeline rules.
- [ ] Add CTA relevance rule.

## Phase 9 — Repair

- [ ] Add deterministic repair.
- [ ] Add targeted repair prompt.
- [ ] Add retry limit.
- [ ] Revalidate after every repair.
- [ ] Add safe failure.

## Phase 10 — API/storage

- [ ] Store only valid v2 cards.
- [ ] Adapt old cards on read.
- [ ] Return one normalized DTO.
- [ ] Log failures safely.

## Phase 11 — UI

- [ ] Refactor header.
- [ ] Add viewer takeaway.
- [ ] Replace Scene Flow with Video Flow.
- [ ] Replace Production Brief with Shoot Plan.
- [ ] Remove unused rail.
- [ ] Hide empty fields.
- [ ] Add expand/collapse controls.

## Phase 12 — Responsive

- [ ] Test 320 px.
- [ ] Test 360 px.
- [ ] Test 390 px.
- [ ] Test tablet.
- [ ] Test desktop.
- [ ] Test zoom.

## Phase 13 — Accessibility

- [ ] Semantic headings.
- [ ] Keyboard accordion.
- [ ] Focus states.
- [ ] ARIA attributes.
- [ ] Contrast.
- [ ] Reduced motion.

## Phase 14 — Tests

- [ ] Utility tests.
- [ ] Schema tests.
- [ ] Adapter tests.
- [ ] Validator tests.
- [ ] Component tests.
- [ ] Integration tests.
- [ ] Multi-category fixtures.

## Phase 15 — Migration checks

- [ ] Old cards render.
- [ ] New cards render.
- [ ] No destructive migration.
- [ ] Rollback documented.

## Phase 16 — Quality checks

- [ ] Lint passes.
- [ ] Type check passes.
- [ ] Tests pass.
- [ ] Build passes.
- [ ] No console errors.
- [ ] No mobile overflow.
- [ ] No vague sample copy remains.

## Phase 17 — Report

- [ ] List changed files.
- [ ] Explain schema.
- [ ] Explain prompt.
- [ ] Explain validator.
- [ ] Explain migration.
- [ ] Report tests.
- [ ] Report limitations.

---

# 51. DEFINITION OF DONE

The task is complete only when all statements are true:

1. A new card can be understood in under ten seconds.
2. The concept is written in natural English.
3. Every required step contains executable action.
4. Spoken lines sound natural aloud.
5. Camera instructions are specific.
6. On-screen text is short.
7. Editing notes are practical.
8. Performance notes are used only when useful.
9. No important instruction is repeated across fields.
10. Vague AI phrases are detected.
11. Timeline begins at zero.
12. Timeline has no gaps.
13. Timeline has no overlaps.
14. Final timestamp equals total duration.
15. Old cards render safely.
16. New cards use the improved schema.
17. The generator returns structured data.
18. Invalid output is repaired or rejected.
19. Malformed raw output is not shown.
20. UI labels are creator-friendly.
21. The empty decorative rail is removed or functional.
22. Desktop is readable.
23. Mobile is readable.
24. Keyboard navigation works.
25. Contrast is sufficient.
26. Optional empty fields are hidden.
27. Tests pass.
28. Type check passes.
29. Build passes.
30. Unrelated pages remain unchanged.

---

# 52. FINAL IMPLEMENTATION REPORT FORMAT

At completion, return a report using this exact structure:

```md
# ViralBox Idea Card Refactor — Implementation Report

## 1. Problems found

- ...

## 2. Architecture discovered

- Generation:
- Validation:
- Storage:
- API:
- UI:
- Legacy format:

## 3. Files changed

| File | Change |
|---|---|
| ... | ... |

## 4. Final schema

Explain the final card and step structures.

## 5. Generation prompt changes

Explain:
- language rules;
- JSON rules;
- timeline rules;
- field responsibilities;
- banned phrases;
- CTA rules.

## 6. Validation added

List:
- structural checks;
- timeline checks;
- duplication checks;
- language checks;
- repair behavior.

## 7. Legacy compatibility

Explain:
- version detection;
- field mapping;
- normalization;
- non-destructive behavior.

## 8. UI changes

Explain:
- header;
- Video Flow;
- Shoot Plan;
- empty-field hiding;
- expansion behavior;
- mobile layout;
- accessibility.

## 9. Tests

Report:
- test command;
- passed;
- failed;
- skipped;
- build result;
- type-check result;
- lint result.

## 10. Remaining limitations

State real limitations.

Do not hide failures.
```

---

# 53. FINAL INSTRUCTION TO THE CODING AGENT

Do not treat this as a copywriting-only task.

Do not treat this as a CSS-only task.

Do not fix only the sample card.

Inspect and correct the full system.

The implementation must improve:

```text
generation quality
+ data quality
+ validation
+ compatibility
+ user comprehension
+ filming usefulness
+ responsive UI
+ accessibility
```

The final result should feel like a practical shoot plan written by an experienced producer, not a collection of vague AI-generated marketing phrases.

A creator must be able to open the card, understand the idea, and begin filming without rewriting the instructions.
