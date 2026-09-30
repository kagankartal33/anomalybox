export type Segment = {
  slug: string;
  name: string;
  audience: string;
  proof: string;
  examples: string[];
};

export const segments: Segment[] = [
  { slug: "instagram-content-ideas", name: "Instagram Content Ideas", audience: "Instagram creators", proof: "a clear hook, visual proof, and a reason to save or respond", examples: ["A three-shot transformation with the result first", "A decision framework built around one audience problem", "A quiet behind-the-scenes sequence with a practical takeaway"] },
  { slug: "reels-content-ideas", name: "Reels Content Ideas", audience: "short-form video creators", proof: "fast context, visible action, and a satisfying payoff", examples: ["Outcome-first reveal with a controlled rewind", "One misconception corrected through visual evidence", "A repeatable process compressed into three scenes"] },
  { slug: "faceless-content-ideas", name: "Faceless Content Ideas", audience: "faceless creators", proof: "hands, objects, environments, screen recordings, and purposeful voiceover", examples: ["Hands-on demonstration with macro detail", "Point-of-view workflow with restrained captions", "Object-led story using sound and sequencing"] },
  { slug: "beauty-content-ideas", name: "Beauty Content Ideas", audience: "beauty creators", proof: "texture, routine logic, lighting consistency, and honest close-up evidence", examples: ["One-product wear test across the day", "Texture comparison under the same light", "Routine edit explaining why each step exists"] },
  { slug: "fashion-content-ideas", name: "Fashion Content Ideas", audience: "fashion creators", proof: "styling logic, silhouette, movement, and taste-level context", examples: ["One piece styled for three real situations", "Fit decision explained through movement", "Editorial detail study with practical styling notes"] },
  { slug: "fitness-content-ideas", name: "Fitness Content Ideas", audience: "fitness creators", proof: "clear form, measurable context, and responsible performance language", examples: ["Technique correction shown from two angles", "Progress system without outcome guarantees", "Workout structure explained through pacing"] },
  { slug: "food-content-ideas", name: "Food Content Ideas", audience: "food creators", proof: "sensory detail, process clarity, and a useful reason to cook or visit", examples: ["Texture-first recipe sequence", "One technique that changes the final result", "Atmosphere-led venue story with practical details"] },
  { slug: "travel-content-ideas", name: "Travel Content Ideas", audience: "travel creators", proof: "place specificity, route logic, and useful lived detail", examples: ["A two-hour neighborhood route", "Arrival-to-check-in visual story", "Three details most visitors miss"] },
  { slug: "lifestyle-content-ideas", name: "Lifestyle Content Ideas", audience: "lifestyle creators", proof: "recognizable moments, personal utility, and believable rhythm", examples: ["A small routine with one meaningful improvement", "Before-and-after environment reset", "A personal rule explained through daily footage"] },
  { slug: "ugc-content-ideas", name: "UGC Content Ideas", audience: "UGC creators", proof: "product understanding, credible demonstration, and conversion-safe language", examples: ["Problem-to-demonstration product story", "Three real-use moments in one day", "Objection-led demo without unsupported claims"] },
  { slug: "founder-content-ideas", name: "Founder Content Ideas", audience: "founders and operators", proof: "decisions, tradeoffs, process evidence, and useful expertise", examples: ["A difficult decision and the framework behind it", "Build-in-public update with one lesson", "Customer problem explained from first principles"] },
  { slug: "creator-content-strategy", name: "Creator Content Strategy", audience: "creators building a repeatable system", proof: "a consistent audience promise, formats, and feedback loops", examples: ["Three recurring formats tied to one promise", "Monthly content review using saves and replies", "A production system built around realistic capacity"] },
];

export const resources = [
  { slug: "how-to-build-a-repeatable-content-system", title: "How to Build a Repeatable Creator Content System", description: "Turn scattered ideas into a practical weekly production rhythm.", sections: ["Define one audience promise", "Choose three repeatable formats", "Separate ideation from production", "Review signals without chasing noise"] },
  { slug: "instagram-reels-shoot-plan", title: "A Practical Instagram Reels Shoot Plan", description: "Plan goal, action, spoken line, shot, text, edit, and performance direction before recording.", sections: ["Start with the viewer outcome", "Write actions before dialogue", "Use a short shot vocabulary", "Keep text and edit notes production-ready"] },
  { slug: "faceless-content-production-guide", title: "Faceless Content Production Guide", description: "Create expressive short-form video with hands, objects, environments, and sound.", sections: ["Choose a visual narrator", "Build continuity through motion", "Use voiceover only when it adds meaning", "Protect privacy without losing personality"] },
  { slug: "content-hooks-without-clickbait", title: "Content Hooks Without Clickbait", description: "Earn attention with specificity and visible value instead of inflated promises.", sections: ["Open on the useful tension", "Show proof early", "Match the hook to the payoff", "Remove unsupported superlatives"] },
  { slug: "short-form-video-shot-list", title: "Short-Form Video Shot List for Creators", description: "A compact shot language for clearer, faster production.", sections: ["Establishing shot", "Action medium", "Proof close-up", "Transition and payoff"] },
  { slug: "creator-editing-workflow", title: "A Calm Creator Editing Workflow", description: "Edit for comprehension, rhythm, and brand feel without visual clutter.", sections: ["Assemble for meaning first", "Cut on action", "Use text as navigation", "Complete a final safety pass"] },
  { slug: "brand-safe-ugc-brief", title: "How to Write a Brand-Safe UGC Brief", description: "Make product direction credible, useful, and claim-aware.", sections: ["Define the product truth", "List permitted proof", "Separate experience from claims", "Plan disclosure and CTA language"] },
  { slug: "content-performance-review", title: "A Better Content Performance Review", description: "Use qualitative and quantitative signals to improve the next brief.", sections: ["Compare like with like", "Read saves, replies, and completion together", "Capture audience language", "Change one variable at a time"] },
];

export function segmentBySlug(slug: string) {
  return segments.find((segment) => segment.slug === slug);
}

export function resourceBySlug(slug: string) {
  return resources.find((resource) => resource.slug === slug);
}