# ViralBox Premium Asset Delivery Brief

**Audience:** Codex (or any visual generator) produces images from this brief → assets are handed back → implementation maps them into the Next.js web app under `public/` and components.

**Product:** ViralBox is a **web-only** premium product. Creators buy private “boxes” of execution-ready Instagram strategy cards (hooks, scene flow, shots, captions, brand-safe notes). There is **no native mobile app** and **no site promo / intro video** in scope.

**Out of scope (do not generate):**
- Site promo / intro / marketing videos (`.mp4`, reels ads, how-to-use videos, autoplay hero videos)
- Transparent video loops of box opens (unless later requested as **still** motion frames only — optional P2)
- Native Android/iOS icons, splash screens, store listings
- Real user faces, influencer stock, competitor logos, watermarks, dataset screenshots
- Real readable ViralBox card copy on images (UI supplies live text)

---

## 1) Product story in one paragraph

ViralBox sells **private digital luxury objects**: Classic Red Box ($500, 2 cards), Signature Purple Box ($1000, 5 cards), and Atelier Black Box (concierge custom). The UI treats boxes and cards as physical-feeling products: sealed delivery → vault → reveal → structured card. Imagery must sell **control, privacy, craft**, not “AI idea generator” clutter.

---

## 2) Visual system (non-negotiable)

| Rule | Spec |
|------|------|
| Mood | Editorial luxury digital product. Calm, expensive, restrained. |
| Reject | Glassmorphism spam, neon cyber, confetti, glitter overload, fake metrics, stock coworking, generic AI gradients |
| Red (Classic) | Shell ~`#3B1719` / `#9F2637` / `#D74654`, ribbon cream `#FFD2BC` — confident, warm luxury |
| Purple (Signature) | `#28153B` / `#5B2A86` / `#8E5BD6`, ribbon `#D8B4FE` — exclusive editorial |
| Black (Atelier) | `#070707` / `#101010`, cool silver/platinum ribbon `#D9E2F2` — private concierge |
| UI ink | Near black `#141414`; paper/cream `#F7F5F1` / white |
| Type on image | **No marketing copy** baked into product shots. Logo only where specified (OG/favicon). Card layouts may show abstract bars/skeleton, never real strategy text |
| People | Prefer product-only. If a hand/phone appears (How-it-works “Shoot”), keep anonymous, brandless phone, no readable UI |
| Format | sRGB; PNG for transparency/master; WebP for web; clean EXIF |
| Naming | `snake_case`, English, version if needed: `asset_name_v1.ext` |

**Box language:** Luxury **digital product object**, not Amazon cardboard shipping box. Soft studio light, soft contact shadow, 3/4 front angle slightly above eye level.

**Card language:** Private strategy / production brief — crisp paper, slight depth, restrained shadow. Not poster art, not notebook scrap.

---

## 3) Website map — every area that needs design

This section is the **primary brief for Codex**. For each area: purpose, user job, layout role, and which assets plug in.

### 3.1 Global chrome (all logged-in + many public pages)

| | |
|--|--|
| **Routes** | Header/footer via `AppShell` + landing header: Store, Pricing, Vault, Profile, Login, Atelier, Legal |
| **Purpose** | Trust, navigation, brand recognition in ~32–40 px height |
| **Design need** | Horizontal logo lockup that stays sharp small; monogram for favicon/tab |
| **Assets** | A1 logo ink/white, A2 gem mark, F favicons |
| **Do not** | Busy logo marks, wordy slogans inside the mark |

---

### 3.2 Landing / Home `/`

**Purpose:** Convert visitors into Store or Atelier. Explain that ViralBox delivers **sealed private cards to shoot**, not brainstorm dumps.

| Section | What the user sees / does | Design job | Assets |
|---------|---------------------------|------------|--------|
| **Sticky header** | Logo + Store / Pricing / How / Atelier / Login | Instant brand | A1 logo |
| **Hero** | H1 + short value prop + CTA “Explore Store” + secondary “How it works”; large product visual right | Product-led first impression; **left ~40–45% must stay calm for live text** | **D1** hero desktop + mobile |
| **Bento value row** | 4 short benefit cards (icons in code; optional subtle texture) | Hierarchy of benefits, not a photo dump | Optional G textures only |
| **Three box levels** | Red sealed / Purple opened / Black sealed product tiles | Compare the three SKUs as objects | **B1–B6** via product box renders; optional B7 lineup later |
| **How it works `#how`** | 4 steps: Configure → Receive → Reveal → Shoot | Teach the loop without video | **D2.1–D2.4** stills |
| **Atelier band** | Dark section, Atelier pitch + CTA | Premium upsell | **D5** atelier visual |
| **Footer** | Trust line + Legal | Minimal | Logo optional |

**Hero composition brief (D1):** Sealed Classic Red + opened Signature Purple with soft card stack; soft studio; no face; no text blocks; leave left/safe zone empty for CSS type.

---

### 3.3 Store `/store`

**Purpose:** Purchase path. User picks **box SKU** (Red/Purple), **creator lane (category)**, **creator mode (persona)**, then checkout. Availability is category-level stock.

| UI block | Purpose | Design job | Assets |
|----------|---------|------------|--------|
| **Product cards** | Choose Red vs Purple (and awareness of Atelier elsewhere) | Sealed box looks buyable and distinct by color | **B1 / B3** sealed (+ stacks C3 if needed) |
| **Configurator summary** | Confirms selected box + counts | Same product visual at larger size | **B*** matching sealed state |
| **Checkout success** `/checkout/success` | Reassurance after Stripe | Optional soft product still | B or D3 family |

**Not needed for Store:** long marketing video, stock “creator filming” montage.

---

### 3.4 Pricing `/pricing`

**Purpose:** Compare three tiers with prices and feature bullets (text in code). Drive Red/Purple to Store config; Black to Atelier form.

| UI block | Design job | Assets |
|----------|------------|--------|
| **Plan cards (3)** | Red / Purple / Black product hero inside each plan card | **ProductBoxVisual:** Red sealed or opened, Purple opened, Black sealed; card counts 2 / 5 / 7 |
| **Optional header still** | If a pricing banner is added later | B7 family lineup or OG pricing look |

---

### 3.5 Creator Vault `/boxes` (authenticated)

**Purpose:** Private collection of purchased boxes. User **opens** a sealed box → cards revealed → opens individual cards. Match is locked at purchase (lane + mode).

| UI block | Purpose | Design job | Assets |
|----------|---------|------------|--------|
| **Shelf of boxes** | List sealed/opened purchases | Same product language as Store; sealed vs opened state | **B1–B6** via ProductBoxVisual |
| **Empty vault** | New user has no purchases | Calm empty state, invite to Store — not sad empty UI | **D3** empty vault illustration |
| **Open / reveal moment** | Transition sealed → cards available | Opened box + card count silhouettes | Opened **B*** + optional **C3** stacks |

---

### 3.6 Idea card detail `/cards/[ideaId]`

**Purpose:** The actual product content: premise, scene flow, shot list, captions, brand notes, safety (all **live data from DB**, rendered in React).

| UI block | Purpose | Design job | Assets |
|----------|---------|------------|--------|
| **Card chrome / empty decorative** | Framing only | Abstract card object if needed for marketing spots | **C1–C2** skeleton cards |
| **Section illustrations (optional)** | Explain “Scene Flow” / “Edit assembly” concepts on marketing or onboarding only | Clean **illustrated boards**, not real screenshots of app | **C5, C6** |
| **Do not bake** | Real titles, hooks, or user content into PNGs | Text is dynamic | — |

---

### 3.7 Atelier `/atelier`

**Purpose:** High-ticket concierge intake. Dark editorial page + request form. Not self-serve checkout.

| UI block | Design job | Assets |
|----------|------------|--------|
| **Hero product object** | Black box as private design object | **B5 / B6** + **D5** |
| **Form section** | Conversion, not imagery-heavy | Minimal texture G4 optional |
| **OG share** | When link is shared | **E** `og_atelier` |

---

### 3.8 Login `/login`

**Purpose:** Email/password + Google auth. Keep quiet and premium.

| Design job | Assets |
|------------|--------|
| Small logo / monogram | A1 or A2; no large hero required |

---

### 3.9 Profile `/profile`

**Purpose:** Account, Instagram connect, notifications, settings. Mostly form UI.

| Design job | Assets |
|------------|--------|
| Optional soft paper background | G1 texture only if used |

---

### 3.10 Legal `/legal`

**Purpose:** Policies. Typography only. **No custom product art required.**

---

### 3.11 Admin (internal)

**Purpose:** Inventory, users, leads, reports. Functional chrome. **No marketing asset generation for admin.**

---

### 3.12 Social / link previews (not a page, but required)

When links are shared (X, LinkedIn, iMessage, Slack), **Open Graph / Twitter cards** show a 1200×630 image. These are part of launch quality.

| Variant | When used | Design job |
|---------|-----------|------------|
| `og_default` | Home / generic | Brand + product lineup |
| `og_store` | Store URL | Red + Purple boxes |
| `og_pricing` | Pricing URL | Three tiers composition |
| `og_atelier` | Atelier URL | Black box, dark mood |

---

## 4) Asset catalog by folder (generate these)

Deliver as one folder:

```text
viralbox-premium-assets-YYYYMMDD/
  00_README.txt
  01_brand/
  02_product_boxes/
  03_idea_cards/
  04_marketing_hero/
  05_social_og/
  06_favicons_web/
  07_ui_textures/
  09_motion_frames/          # OPTIONAL stills only (P2) — not video files
  10_source_masters/         # optional layered masters
  11_email_transactional/    # optional
  MANIFEST.csv
```

**There is no `08_video/` requirement.** Do not deliver promo or how-to MP4s.

---

### A) Brand / logo — `01_brand/`

| ID | File | Size | Use on site |
|----|------|------|-------------|
| A1 | `logo_primary_horizontal_ink.png` (+ SVG) | ≥2000 px wide, ~4:1 | Header light backgrounds |
| A1 | `logo_primary_horizontal_white.png` (+ SVG) | same | Dark Atelier header if needed |
| A2 | `mark_gem_ink.png` / `_white` / `_color` + `mark_gem.svg` | **1024×1024**, 12–15% padding | Favicon source, small UI |
| A3 | `logo_clearspace_and_donts.pdf` or PNG sheet | A4 or 1920×1080 | Handoff only |

**Wordmark:** “ViralBox” + restrained gem monogram. Clearspace ≥10% around lockup.

---

### B) Product boxes — `02_product_boxes/`  **(highest product impact)**

Shared rules: 3/4 front; soft studio; soft shadow; ground `#F7F5F1` or soft white (Atelier may use graphite); **no readable product claims on the box**; opened states show card **count silhouettes** (Red 2, Purple 5, Black 7) without real text.

For each of **red / purple / black** × **sealed / opened**:

| Variant files | Resolution |
|---------------|------------|
| `box_{color}_{state}_master_4k.png` | **4096×4096** |
| `box_{color}_{state}_web_1600.webp` | **1600×1600** |
| `box_{color}_{state}_web_800.webp` | **800×800** |
| `box_{color}_{state}_transparent_2048.png` | **2048×2048** alpha |

Also:

| ID | File | Size | Use |
|----|------|------|-----|
| B7 | `boxes_family_lineup_master.png` + `boxes_family_lineup_web_1920.webp` | 3840×2160 → 1920 wide | Home/pricing optional banner |
| B8 | `box_detail_foil_macro_{red,purple,black}.png` | 2000×2000 | Texture/bento accents |

**Maps to code today:** `ProductBoxVisual` loads  
`/assets/premium/boxes/box_{red|purple|black}_{sealed|opened}_web_1600.webp`.

---

### C) Idea cards — `03_idea_cards/`

| ID | File | Size | Use |
|----|------|------|-----|
| C1 | `card_front_generic_master.png` + `_web.webp` + `_transparent.png` | 1600×2400 (2:3) | Marketing / empty decorative |
| C2 | `card_front_angled_3q.png` | 2000×2000 | Hover/mock depth |
| C3 | `cards_stack_2_red_theme.png`, `_5_purple_`, `_7_black_` | 2000×2000 | Tier card-count language |
| C4 | `composition_{red,purple,black}_box_with_cards.png` + web 1600w | 2400×1800 | Store/pricing hero compositions |
| C5 | `ui_mock_scene_flow_board.png` | 2400×1600 | Illustrative “scene flow” board |
| C6 | `ui_mock_edit_assembly.png` | 2400×1600 | Illustrative edit checklist |

**Layout only:** gray bars, section blocks, micro label “PRIVATE CARD” max. No Lorem paragraphs of real strategy.

---

### D) Marketing stills — `04_marketing_hero/`

| ID | File | Size | Site area |
|----|------|------|-----------|
| D1 | `hero_main_desktop.png` + `hero_main_desktop_1920.webp` | 2880×1620–1800 → 1920w | Home hero |
| D1 | `hero_main_mobile_1080x1350.webp` | 1080×1350 (4:5) | Home hero mobile |
| D2.1 | `how_01_configure.png` + `_web.webp` | 1600×1200 | How: Store configure (box + lane metaphor) |
| D2.2 | `how_02_receive.png` + `_web.webp` | 1600×1200 | How: sealed box arrives in vault |
| D2.3 | `how_03_reveal.png` + `_web.webp` | 1600×1200 | How: open / cards rise |
| D2.4 | `how_04_shoot.png` + `_web.webp` | 1600×1200 | How: shoot with card nearby (anonymous) |
| D3 | `empty_vault_illustration.png` | 1600×1200 | `/boxes` empty state |
| D4 | `privacy_private_delivery.png` | 1600×1200 | Trust/privacy metaphor (seal/lock, restrained) |
| D5 | `atelier_black_concierge.png` | 2400×1600 | Home Atelier band + `/atelier` support |

**How-it-works stills replace any “intro video” education.** Same visual family, numbered sequence, no captions burned in (step titles live in code: Configure / Receive / Reveal / Shoot).

---

### E) Open Graph — `05_social_og/`

| File | Size | Notes |
|------|------|-------|
| `og_default.png` + `og_default@2x.png` | 1200×630 + 2400×1260 | Safe 80–100 px margin; logo + product |
| `og_pricing.png` | 1200×630 | Three tiers |
| `og_store.png` | 1200×630 | Red + Purple |
| `og_atelier.png` | 1200×630 | Black, dark |

Optional social stills (P2): `social_square_1080.png`, `social_portrait_1080x1350.png`, `social_story_1080x1920.png`.

---

### F) Favicons — `06_favicons_web/`

| File | Size |
|------|------|
| `favicon_source_1024.png` | 1024×1024, transparent, gem centered |
| `favicon.ico` | 16/32/48 embedded |
| `favicon-32.png`, `favicon-48.png` | 32 / 48 |
| `apple-touch-icon.png` | 180×180 |

Site also uses `/logo.png` as brand fallback; keep monogram consistent with A2.

---

### G) UI textures — `07_ui_textures/`

| File | Size | Use |
|------|------|-----|
| `texture_paper_soft.png` | 2048 tileable | Subtle paper |
| `texture_grain_soft.png` | 1024 tileable | Very light grain |
| `bg_mist_soft.png` / `bg_ink_soft.png` | 2400×1600 | Section backdrops |
| `foil_line_{red,purple,black}.png` or SVG | ~2000×40 | Dividers |

Keep opacity-friendly (will sit under content at low alpha).

---

### I) Email (optional P2) — `11_email_transactional/`

| File | Size |
|------|------|
| `email_header_600.png` | 1200×400 |
| `email_box_delivered.png` | 1200×800 |

---

### J) Source masters (optional) — `10_source_masters/`

Layered PSD/Figma for logo, boxes, cards, OG templates + hex token list + font license notes.

---

## 5) Priority for Codex generation

### P0 — ship-critical look
1. A1 + A2 brand  
2. B1–B6 all sealed/opened web set (min web_1600 + transparent)  
3. C1–C4 card objects + compositions  
4. E1 OG default (+ store/pricing/atelier if time)  
5. F favicon master  

### P1 — conversion polish  
6. D1 hero desktop + mobile  
7. D2 how-it-works ×4  
8. D3 empty vault, D5 atelier  
9. B7 family lineup  
10. C5–C6 UI mock boards  

### P2 — nice  
11. D4 privacy, B8 macros, G textures, I email, E social extras, J masters  
12. Optional motion **stills** only  

---

## 6) Implementation handoff (after Codex delivers)

Expected mapping into the app (for the implementer, not Codex):

| Delivered path | App path |
|----------------|----------|
| `01_brand/*` | `public/brand/` |
| `02_product_boxes/*` | `public/assets/premium/boxes/` |
| `03_idea_cards/*` | `public/assets/premium/cards/` |
| `04_marketing_hero/*` | `public/assets/premium/marketing/` |
| `05_social_og/*` | `public/assets/premium/og/` |
| `06_favicons_web/*` | `public/` root favicons |
| `07_ui_textures/*` | `public/assets/premium/textures/` |

Central registry: `lib/premium-assets.ts`  
Box component: `components/ProductBoxVisual.tsx`  
Landing: `app/page.tsx`  
Vault empty: `app/boxes/page.tsx`  
Pricing/Store: `app/pricing/page.tsx`, `components/StoreConfigurator.tsx`

Include `MANIFEST.csv`:

```csv
filename,group,width,height,format,usage,notes
box_red_sealed_web_1600.webp,product_boxes,1600,1600,webp,store/vault/home,sealed red
```

Folder name:

```text
viralbox-premium-assets-YYYYMMDD/
```

---

## 7) Codex generation prompts — short recipes

Use these as image prompts (one asset per generation). Always append: *no text, no logos of other brands, soft studio lighting, luxury product photography / premium 3D product render, sRGB*.

**Sealed red box:** Luxury sealed deep-red creator box, cream ribbon, soft contact shadow, three-quarter view, cream seamless studio, product e-commerce hero, no text.

**Opened purple box:** Same language, royal purple shell, lid open, five blank private cards rising slightly, no readable writing.

**Sealed black atelier:** Matte black private box, platinum ribbon, dark editorial light, exclusive concierge object.

**Hero:** Lineup of sealed red and opened purple with soft blank card stack, wide composition, empty left third for UI text overlay, no people.

**How 01 Configure:** Abstract premium tabletop with red box and simple lane/token markers, not a real app UI screenshot.

**How 02 Receive:** Sealed box resting in a calm private “vault” shelf setting, soft paper tones.

**How 03 Reveal:** Box opening, blank cards emerging, controlled motion freeze-frame.

**How 04 Shoot:** Anonymous hands + brandless phone + one blank private card nearby, premium lighting, no face.

**Empty vault:** Soft illustration of one sealed box silhouette and quiet space, hopeful premium empty state, no emoji.

**OG default:** 1200×630 safe margins, ViralBox product family, clean paper background, room for tiny logo corner if needed — prefer product-led.

---

## 8) Checklist summary

| Group | Min web-ready files |
|-------|---------------------|
| Brand | 6–10 |
| Boxes | 18–24 |
| Cards | 8–12 |
| Marketing stills | 8–12 |
| OG | 4–5 |
| Favicon | 1 master + exports |
| Textures | 2–6 |

**Practical minimum:** ~40–55 still files  
**Full premium still pack:** ~70–100 files (masters + web)

---

## 9) Designer / generator don’ts

- Do not invent a second brand system  
- Do not put fake testimonials, “10k creators”, or engagement guarantees on images  
- Do not copy existing competitor packaging  
- Do not deliver only low-res JPG with compression artifacts  
- Do not replace live card content with baked English paragraphs  
---

*Education and conversion use still imagery + live product UI only. No video deliverables.*
