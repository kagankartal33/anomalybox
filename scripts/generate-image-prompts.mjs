/**
 * generate-image-prompts.mjs
 * 
 * Reads seo-package-registry.json and generates a prompt .md file
 * for each page under public/assets/seo-package/prompts/{slug}.md
 * 
 * Each prompt covers:
 *  - Thumbnail (800×450): editorial card, warm cream background
 *  - Article header (1600×900): cinematic, full-bleed hero
 *  - Site theme: ink/plum palette, warm cream (#F7F4ED), cinematic editorial
 */

import fs from "fs";
import path from "path";

const registry = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "lib", "seo-package-registry.json"), "utf-8")
);
const pages = registry.pages;

const outputDir = path.join(process.cwd(), "public", "assets", "image-prompts");
fs.mkdirSync(outputDir, { recursive: true });

// === Brand Style System ===
const BRAND = {
  colors: {
    bg: "#F7F4ED (warm cream)",
    ink: "#0B0B0B (deep ink/near-black)",
    plum: "#6B4E71 (muted plum-purple)",
    plumDeep: "#4A2F51 (deep plum)",
    plumSoft: "#C4B5CA (soft lavender)",
    white: "#FFFFFF",
    accent: "soft golden hour warm tones",
  },
  style: "editorial, cinematic, high-end creator studio, physical dossier aesthetic, warm-minimal",
  mood: "focused, private, intentional, premium — not flashy or neon",
  typography: "no text overlays unless specified — images should be purely visual",
  lighting: "warm side-lighting, soft shadows, controlled studio or natural window light",
  props: "dossier cards, notebooks, smartphones, camera gear, studio lights, neutral linen surfaces",
  avoid: "stock photo clichés, bright white clinical look, cartoonish colors, heavy gradients",
};

// Section-specific style guidance
const SECTION_CONTEXT = {
  "content-ideas": {
    setting: "creator's home studio or well-lit workspace",
    props: "phone with Instagram interface hints (no brand logos), dossier card, notebook with shot notes",
    light: "warm window light or softbox from the side",
  },
  "reels": {
    setting: "behind-the-scenes filming setup, gimbal or tripod visible",
    props: "iPhone or mirrorless camera on tripod, ring light or softbox, clapperboard hint",
    light: "cinematic warm-orange rim light, slight depth of field blur on background",
  },
  "resources": {
    setting: "editorial desk surface, flat-lay or 3/4 angle",
    props: "open Anomaly Box dossier cards spread on a linen surface, pen, clean notebook",
    light: "even soft natural light, neutral shadows",
  },
  "templates": {
    setting: "desk surface, document/brief template visible but not readable",
    props: "printed brief template on cream paper, pen, dossier folder",
    light: "cool-warm balanced overhead light",
  },
  "creator-lanes": {
    setting: "niche-specific environment matching the lane (beauty vanity, food table, travel outdoor, etc.)",
    props: "lane-relevant items, dossier card visible as a prop",
    light: "niche-appropriate lighting (beauty: ring light; travel: golden hour; food: warm overhead)",
  },
  "creator-personas": {
    setting: "realistic creator workspace matching the persona archetype",
    props: "content creation setup appropriate to the persona budget and style",
    light: "natural and attainable, not over-produced",
  },
  "services": {
    setting: "premium studio consultation aesthetic",
    props: "physical dossier box, cards laid out, creative direction mood board",
    light: "moody dramatic side-light, dark background with warm highlight",
  },
  "tools": {
    setting: "organized workflow desk, minimal and intentional",
    props: "checklist, timer, minimal tools, dossier card",
    light: "clean even studio light",
  },
};

// Topic-specific keyword→visual overrides
function getTopicVisual(slug, title, section) {
  const s = slug.toLowerCase();
  const sc = SECTION_CONTEXT[section] || SECTION_CONTEXT["resources"];
  
  let subjectFocus = "";
  let lightingNote = "";
  let colorNote = "";

  if (s.includes("beauty") || s.includes("skincare") || s.includes("makeup")) {
    subjectFocus = "beauty flatlay: serums, creams, powder in soft neutral packaging on cream linen";
    lightingNote = "ring light glow from front, warm fill from left, dewy product highlight";
    colorNote = "cream, blush, neutral taupe palette";
  } else if (s.includes("food") || s.includes("recipe") || s.includes("dining")) {
    subjectFocus = "food close-up: artisan dish or ingredients arranged on dark slate or cream ceramic";
    lightingNote = "warm overhead overhead spot, dramatic shadows from right";
    colorNote = "earthy terracotta, cream, deep charcoal";
  } else if (s.includes("travel") || s.includes("b-roll") || s.includes("cinematic")) {
    subjectFocus = "cinematic landscape or travel scene: open road, architectural detail, or golden hour exterior";
    lightingNote = "golden hour backlight, lens flare hint, filmic depth";
    colorNote = "amber, teal shadows, warm cinematic grade";
  } else if (s.includes("fitness") || s.includes("wellness")) {
    subjectFocus = "minimal gym equipment or outdoor workout context: kettlebell, mat, morning light";
    lightingNote = "clean morning natural light from large window";
    colorNote = "white, soft grey, warm cream";
  } else if (s.includes("fashion") || s.includes("luxury") || s.includes("lookbook")) {
    subjectFocus = "editorial fashion detail: fabric texture, garment close-up, or styled flatlay";
    lightingNote = "side-lit editorial with deep shadows and highlight on texture";
    colorNote = "black, cream, muted burgundy or forest tone";
  } else if (s.includes("ugc") || s.includes("brand-deal") || s.includes("brief")) {
    subjectFocus = "brand brief document and product box on desk: clean, professional, creator-owned";
    lightingNote = "even soft light, document clearly a prop not readable";
    colorNote = "white, plum, cream, ink";
  } else if (s.includes("faceless") || s.includes("hands") || s.includes("pov")) {
    subjectFocus = "hands-only POV shot: hands writing notes, arranging cards, or adjusting camera — no face";
    lightingNote = "warm side light, shallow depth of field";
    colorNote = "cream surface, ink details, plum accent";
  } else if (s.includes("burnout") || s.includes("consistency") || s.includes("batching")) {
    subjectFocus = "organized content batching workspace: multiple camera cards, schedule, dossier";
    lightingNote = "warm calm natural light, orderly minimal desk";
    colorNote = "warm cream, ink, soft plum highlights";
  } else if (s.includes("reels") || s.includes("hook") || s.includes("script")) {
    subjectFocus = "behind-the-scenes filming setup: phone on tripod, clapperboard, script card";
    lightingNote = "cinematic warm side light, bokeh background";
    colorNote = "dark background, warm rim light, plum accent";
  } else if (s.includes("aeo") || s.includes("ai") || s.includes("schema") || s.includes("seo")) {
    subjectFocus = "editorial desk with dossier card and structured notes — strategic planning aesthetic";
    lightingNote = "clean even desk light, intentional grid layout visible in props";
    colorNote = "cream, ink, plum system colors";
  } else if (s.includes("dossier") || s.includes("physical") || s.includes("box")) {
    subjectFocus = "Anomaly Box physical dossier box on a textured linen surface, partially open revealing cards";
    lightingNote = "dramatic moody side light, dark background, premium product photography";
    colorNote = "deep ink background, cream dossier, plum accent";
  } else {
    subjectFocus = `creator workspace scene representing '${title}' — editorial dossier card visible as a prop`;
    lightingNote = sc.light;
    colorNote = "warm cream (#F7F4ED) background, ink (#0B0B0B) details, plum (#6B4E71) accent touches";
  }

  return { subjectFocus, lightingNote, colorNote, ...sc };
}

function generatePromptMd(page) {
  const { slug, title, section, keyword } = page;
  const tv = getTopicVisual(slug, title, section);
  const sc = SECTION_CONTEXT[section] || SECTION_CONTEXT["resources"];

  return `# Image Prompts — ${title}

**Slug:** \`${slug}\`  
**Section:** \`${section}\`  
**Primary Keyword:** ${keyword}  
**Target image files:**  
- Thumbnail: \`/assets/seo-package/${slug}.webp\` (800×450 px)  
- Article header: \`/assets/seo-package/${slug}-hero.webp\` (1600×900 px)

---

## Brand Style Reference

| Token | Value |
|-------|-------|
| Background | #F7F4ED (warm cream) |
| Ink | #0B0B0B (deep near-black) |
| Plum | #6B4E71 (muted purple) |
| Style | editorial, cinematic, premium creator studio |
| Mood | private, intentional, focused — not flashy |
| Avoid | neon colors, stock photo clichés, AI-generic look, heavy glow |

---

## Thumbnail Prompt (800 × 450 px)

**Output resolution:** 800 × 450 pixels, 72 DPI, WebP  
**Aspect ratio:** 16:9  
**Usage:** Card thumbnail on hub pages (/content-ideas, /resources, /reels, etc.)

\`\`\`
A warm-toned editorial thumbnail photograph for an Instagram creator content brand.

Subject focus: ${tv.subjectFocus}

Setting: ${sc.setting}

Props: ${sc.props}

Lighting: ${tv.lightingNote}

Color palette: ${tv.colorNote}

Composition: rule-of-thirds, slight negative space on the right side for text overlay room. Close to mid-shot, 16:9 crop. No text, no UI overlays, no logos.

Style: editorial photography, soft film grain, premium minimal. Inspired by ${BRAND.style}.

Mood: ${BRAND.mood}

Do NOT include: people's faces, recognizable brands, stock photo models, heavy shadows that obscure detail, cartoonish or illustrated elements.

Technical: 800x450px, WebP, ultra-sharp, editorial magazine quality.
\`\`\`

---

## Article Header Prompt (1600 × 900 px)

**Output resolution:** 1600 × 900 pixels, 144 DPI, WebP  
**Aspect ratio:** 16:9  
**Usage:** Full-width article hero image inside /${section}/${slug}

\`\`\`
A cinematic full-width editorial hero photograph for a premium Instagram creative direction brand.

Subject focus: ${tv.subjectFocus} — wider establishing composition, environmental depth.

Setting: ${sc.setting} — wider view showing more environmental context.

Props: ${sc.props} — arranged compositionally across a wider frame.

Lighting: ${tv.lightingNote} — slightly more dramatic, with clear directional depth for full-width display.

Color palette: ${tv.colorNote} — with deeper shadows on left, warm highlight on right to create visual flow.

Composition: cinematic 16:9 wide shot with strong depth of field. Subject occupies left 60% of frame. Right side has soft bokeh or blurred studio background. No text overlays.

Style: premium editorial photography, slight vignette, warm film tone. Cinematic depth of field. Inspired by ${BRAND.style}.

Mood: private, focused, execution-ready. High-end creator brand.

Do NOT include: people's faces (or faceless silhouettes only), recognizable brand logos, generic stock photography, overly bright or clinical white, neon colors.

Technical: 1600x900px, WebP, 144 DPI, ultra-sharp detail in subject, smooth out-of-focus background.
\`\`\`

---

## Generation Notes

- Generate thumbnail first and verify color palette before hero
- If AI generator needs style references: think *Kinfolk magazine* × *premium creator toolkit* × *editorial product photography*
- Subject should feel **real and achievable** — not aspirational stock photo fantasy
- Always include the Anomaly Box aesthetic: warm cream surface, plum or ink accent prop, intentional composition
`;
}

let count = 0;
for (const page of pages) {
  const md = generatePromptMd(page);
  const outPath = path.join(outputDir, `${page.slug}.md`);
  fs.writeFileSync(outPath, md, "utf-8");
  count++;
}

console.log(`✅ Generated ${count} image prompt files in public/assets/image-prompts/`);
