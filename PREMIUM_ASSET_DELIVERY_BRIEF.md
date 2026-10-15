# ViralBox Premium Asset Delivery Brief

Bu liste, ViralBox **web sitesi / web uygulaması** (Next.js) arayüzünü premium hale getirmek için gereken görsel ve video varlıkların teslim spesifikasyonudur.

ViralBox **yalnızca web** ürünüdür (responsive web). Native mobil uygulama varlıkları bu brief’in parçası değildir.

Aşağıdaki klasör yapısıyla, tek bir zip/klasör olarak verilebilir.

## Genel kurallar (hepsi için)

| Kural | Spec |
|--------|------|
| Marka dili | Lüks dijital ürün, editorial, sakin, yüksek zevk. Fake glass/neon AI site estetiği yok. |
| Renk ailesi | Red box: `#3B1719` / `#9F2637` / `#D74654` / ribbon `#FFD2BC`. Purple: `#28153B` / `#5B2A86` / `#8E5BD6` / ribbon `#D8B4FE`. Black Atelier: `#070707` / `#101010` / ribbon `#D9E2F2`. UI ink: neredeyse siyah. Paper: krem-beyaz. |
| Arka plan | Ürün shot’larında temiz stüdyo / soft gradient / soft shadow. Gürültülü stock ofis yok. |
| İnsan | Mümkünse ürün odaklı; yüz/stock influencer mümkün olduğunca az. Kullanılacaksa model release + jenerik, markasız. |
| Yazı | Görsellerin üzerine mümkünse **yazı basma**. UI metinleri kodda. Logo hariç. |
| Üçüncü parti | Logo, watermark, stock UI screenshot, rakip marka, dataset görseli yok. |
| Renk uzayı | sRGB |
| Bit derinlik | PNG 8-bit (gerekirse 24-bit truecolor + alpha). JPG quality 85–92. WebP quality 80–90. |
| Metadata | EXIF’ten GPS/kişisel veri temiz. Copyright ok. |
| Naming | `snake_case`, İngilizce, versiyon: `asset_name_v1.ext` |
| Master + web | Her kritik still için **master (PNG/PSD/TIFF)** + **web (WebP/PNG)** tercih edilir. |

## Teslim klasör yapısı (zorunlu)

```text
viralbox-premium-assets/
  00_README.txt
  01_brand/
  02_product_boxes/
  03_idea_cards/
  04_marketing_hero/
  05_social_og/
  06_favicons_web/           # browser tab favicon only
  07_ui_textures/
  08_video/
  09_motion_frames/          # opsiyonel: box open sequence stills
  10_source_masters/         # PSD/AI/Figma export / layered masters
```

`00_README.txt` içinde: designer adı, tarih, font lisansı (varsa), hangi dosyaların final olduğu.

---

# A) BRAND / LOGO

## A1. Primary logo lockup (yatay)
- **Kullanım:** Header, footer, e-posta, fatura
- **Klasör:** `01_brand/`
- **Dosyalar:**
  - `logo_primary_horizontal_ink.png` — koyu logo, şeffaf zemin
  - `logo_primary_horizontal_white.png` — beyaz logo, şeffaf zemin
  - `logo_primary_horizontal_ink.svg` (tercihen)
  - `logo_primary_horizontal_white.svg` (tercihen)
- **Çözünürlük:** PNG export **2400 × 600 px** (veya en az **2000 px** genişlik, oran ~4:1)
- **Safe padding:** logo etrafında min %10 boşluk
- **Format:** SVG master + PNG @1x/@2x mantığıyla yüksek rez PNG
- **İçerik:** Wordmark “ViralBox” + minimal gem/mark monogram (mevcut gem hissi)

## A2. Monogram / app mark (sadece gem veya VB monogram)
- **Kullanım:** Favicon, avatar fallback, kutu mühür, küçük UI
- **Dosyalar:**
  - `mark_gem_ink.png`
  - `mark_gem_white.png`
  - `mark_gem_color.png` (ink + subtle teal/red accent, abartısız)
  - `mark_gem.svg`
- **Çözünürlük:** **1024 × 1024 px** (kare, merkez hizalı)
- **Padding:** içeride %12–15 safe area (yuvarlak crop’a uygun)
- **Format:** PNG + SVG

## A3. Logo clearspace sheet
- **Dosya:** `logo_clearspace_and_donts.pdf` veya `logo_usage_sheet.png`
- **Boyut:** A4 veya 1920×1080 presentation still
- **İçerik:** min boşluk, koyu/açık zemin, yasak kullanımlar

---

# B) PRODUCT BOXES (en kritik ürün görselleri)

UI’de şu an CSS box var; premiuma geçiş için **foto/3D render** seti istenir.  
Her kutu için **sealed** ve **opened** zorunlu.

## Ortak box shot kuralları
- **Açı:** 3/4 front, hafif yukarıdan (ürün e-ticaret hero)
- **Işık:** soft studio, tek ana ışık + soft fill
- **Gölge:** soft contact shadow, abartısız
- **Zemin:** `#F7F5F1` / pure soft white / deep black (Atelier)
- **Oran:** kare master + landscape crop
- **Yazı yok** kutu üzerinde (veya sadece minik “ViralBox” foil seal)
- **Kart sayısı hissi:** opened’da Red=2, Purple=5, Black=7 kart silueti

## B1. Classic Red Box — sealed
- **Dosyalar:**
  - `box_red_sealed_master_4k.png` — **4096 × 4096**
  - `box_red_sealed_web_1600.webp` — **1600 × 1600**
  - `box_red_sealed_web_800.webp` — **800 × 800**
  - `box_red_sealed_transparent_2048.png` — **2048 × 2048**, şeffaf zemin
- **Palette:** warm red shell/body, cream ribbon
- **Durum:** kapalı, mühürlü, premium

## B2. Classic Red Box — opened
- **Dosyalar:** aynı isimlendirme `box_red_opened_*`
- **Çözünürlükler:** 4096 / 1600 / 800 / 2048 transparent
- **Durum:** kapak hafif açık veya geriye kalkmış, **2 kart** çıkmış, okunabilir ama metin yok (çizgi/layout only)

## B3. Signature Purple Box — sealed
- Aynı set: `box_purple_sealed_*`
- **Palette:** deep/royal purple, lavender ribbon

## B4. Signature Purple Box — opened
- `box_purple_opened_*`
- **5 kart** hissi, daha “editorial exclusive”

## B5. Atelier Black Box — sealed
- `box_black_sealed_*`
- **Palette:** mat siyah, cool silver/platinum ribbon, diamond foil hissi
- Zemin: soft graphite veya off-white (iki varyant iyi olur)

## B6. Atelier Black Box — opened / teaser
- `box_black_opened_*` veya `box_black_teaser_*`
- Kartlar daha gizli; “concierge / private” hissi

## B7. Box family lineup (3 kutu yan yana)
- **Dosya:** `boxes_family_lineup_master.png`
- **Çözünürlük:** **3840 × 2160** (16:9) + `boxes_family_lineup_web_1920.webp`
- **Kullanım:** homepage / pricing hero

## B8. Box detail macro (foil seal / ribbon / paper edge)
- `box_detail_foil_macro_red.png` — **2000 × 2000**
- `box_detail_foil_macro_purple.png` — **2000 × 2000**
- `box_detail_foil_macro_black.png` — **2000 × 2000**
- **Kullanım:** texture / bento / trust section

---

# C) IDEA CARDS (ürünün “içerik nesnesi”)

Kartlar “private strategy card / production brief” gibi görünmeli; poster veya notebook scrap değil.

## C1. Single card — front (temiz brief layout mock)
- **Dosyalar:**
  - `card_front_generic_master.png` — **1600 × 2400** (2:3 portrait)
  - `card_front_generic_web.webp` — **800 × 1200**
  - `card_front_generic_transparent.png` — **1600 × 2400** alpha
- **İçerik:** başlık alanı + 4–6 satır placeholder çizgi (Lorem yoksa gri bars), Scene Flow bloğu hissi
- **Metin:** gerçek ViralBox kopyası basma (UI’de dinamik). Görselde sadece **layout iskeleti** veya “PRIVATE CARD” micro label.

## C2. Single card — angled / with shadow
- `card_front_angled_3q.png` — **2000 × 2000**
- Hafif perspective, soft shadow
- Store/card hover mock için

## C3. Card stack (2 / 5 / 7)
- `cards_stack_2_red_theme.png` — **2000 × 2000**
- `cards_stack_5_purple_theme.png` — **2000 × 2000**
- `cards_stack_7_black_theme.png` — **2000 × 2000**
- Her birinde tema rengine uyumlu edge accent

## C4. Card + open box composition
- `composition_red_box_with_cards.png` — **2400 × 1800** (4:3)
- `composition_purple_box_with_cards.png` — **2400 × 1800**
- `composition_black_box_with_cards.png` — **2400 × 1800**
- **Web:** 1600 genişlik WebP

## C5. Scene Flow board mock (UI illustration)
- `ui_mock_scene_flow_board.png` — **2400 × 1600** (3:2)
- Clean UI board: time ranges, action blocks, soft yellow/teal/lavender highlight chips
- Gerçek app screenshot kopyası değil; **orijinal illustration**

## C6. Edit Assembly guide mock
- `ui_mock_edit_assembly.png` — **2400 × 1600**
- Kurgu adımları (clip order, cuts) hissi; sade, premium

---

# D) MARKETING / HERO / BENTO

## D1. Homepage hero still (main)
- **Dosya:** `hero_main_desktop.png`
- **Çözünürlük:** **2880 × 1800** (16:10 veya 16:9 kabul: **2880 × 1620**)
- **Web:** `hero_main_desktop_1920.webp`, `hero_main_mobile_1080x1350.webp` (4:5)
- **Konu:** sealed red + opened purple + soft card stack; marka product-led
- **Text safe area:** sol %45 boş (kod metin koyacak)

## D2. How it works — 4 frame stills
Her biri aynı stil ailesi:

| ID | Dosya | Konu | Boyut |
|----|--------|------|--------|
| D2.1 | `how_01_configure.png` | Store configure (box + lane) | **1600 × 1200** |
| D2.2 | `how_02_receive.png` | Sealed box in vault | **1600 × 1200** |
| D2.3 | `how_03_reveal.png` | Box opening / cards rising | **1600 × 1200** |
| D2.4 | `how_04_shoot.png` | Creator phone shoot with card nearby | **1600 × 1200** |

+ her biri için `*_web.webp` 1200 genişlik

## D3. Creator Vault empty / premium empty state art
- `empty_vault_illustration.png` — **1600 × 1200**, şeffaf veya soft paper bg
- Stil: sealed box silhouette + soft glow, sad emoji yok

## D4. Trust / privacy visual
- `privacy_private_delivery.png` — **1600 × 1200**
- “private sealed delivery” metaforu; kilit/mühür, abartısız

## D5. Atelier concierge visual
- `atelier_black_concierge.png` — **2400 × 1600**
- Siyah kutu + cool metal ribbon + dark editorial lighting

---

# E) SOCIAL / OPEN GRAPH / SHARE

Şu an `layout.tsx` OG image kullanmıyor; premium launch için zorunlu set.

## E1. Open Graph default
- `og_default.png` — **1200 × 630** (Facebook/LinkedIn/X)
- Ayrıca `og_default@2x.png` — **2400 × 1260** master
- Format: PNG (veya high quality JPG)
- Safe area: kenarlardan 80–100 px içeride logo + ürün

## E2. OG variants
- `og_pricing.png` — 1200×630
- `og_atelier.png` — 1200×630
- `og_store.png` — 1200×630

## E3. Twitter/X large card
- Aynı 1200×630 set yeterli (summary_large_image)

## E4. Instagram/LinkedIn launch stills (opsiyonel ama iyi)
- `social_square_1080.png` — **1080 × 1080**
- `social_portrait_1080x1350.png` — **1080 × 1350**
- `social_story_1080x1920.png` — **1080 × 1920**

---

# F) WEB FAVICON / BROWSER TAB ICON

## F1. Favicon master
- **Klasör:** `06_favicons_web/`
- `favicon_source_1024.png` — **1024 × 1024** (şeffaf zemin tercih)
- **İçerik:** monogram/gem; kenarlarda %12–15 boşluk

## F2. Web export (master’dan üretilebilir; istersen hazır ver)
- `favicon.ico` — 16 / 32 / 48 embedded
- `favicon-32.png` — **32 × 32**
- `favicon-48.png` — **48 × 48**
- `apple-touch-icon.png` — **180 × 180** (Safari “Add to Home Screen” web standardı)

---

# G) UI TEXTURES / BACKGROUNDS (hafif, premium)

## G1. Paper texture (subtle)
- `texture_paper_soft.png` — **2048 × 2048**, tileable
- Opacity düşük kullanılacak; gürültü az

## G2. Soft noise / grain overlay
- `texture_grain_soft.png` — **1024 × 1024**, tileable, çok hafif

## G3. Section gradient backgrounds (optional)
- `bg_mist_soft.png` — **2400 × 1600**
- `bg_ink_soft.png` — **2400 × 1600** (Atelier sections)

## G4. Divider / foil line assets
- `foil_line_red.png` — **2000 × 40** (veya SVG)
- `foil_line_purple.png`
- `foil_line_black.png`

---

# H) VIDEO (premium motion)

Mevcut: `site-promo-ad.mp4`, `how-to-use-cards.mp4`. Premium yenileme isteniyor.

## Ortak video rules
- **Codec:** H.264 (`.mp4`), yedek olarak H.265/HEVC opsiyonel
- **Audio:** site UI’de muted autoplay için **sessiz master + soft music master** ayrı
- **Color:** Rec.709 / sRGB-ish web safe
- **Bitrate hedef:** 1080p ~8–14 Mbps; 720p ~4–8 Mbps
- **Poster frame:** her video için ayrı JPG/WebP

## H1. Site promo ad (homepage / vault)
- **Dosya:** `site_promo_ad_master_1080p.mp4`
- **Çözünürlük:** **1920 × 1080**, 24 veya 30 fps
- **Süre:** **12–18 sn**
- **İçerik storyboard:**
  1. Sealed red box (2s)
  2. Purple open + cards rise (4s)
  3. Card board / scene flow close (4s)
  4. Creator vault / private delivery end card (3s)
- **Ayrıca:**
  - `site_promo_ad_720p.mp4` — 1280×720
  - `site_promo_ad_poster.jpg` — **1920 × 1080**
  - `site_promo_ad_square_1080.mp4` — **1080 × 1080** (opsiyonel social)

## H2. How to use cards (product education)
- `how_to_use_cards_master_1080p.mp4` — **1920 × 1080**, 24/30 fps
- **Süre:** **20–35 sn**
- **Bölümler:** open box → read scene flow → shoot beat → edit checklist
- Poster: `how_to_use_cards_poster.jpg` 1920×1080

## H3. Box reveal loop (UI micro motion, optional but high value)
- `box_reveal_loop_red.mp4` — **1080 × 1080**, 4–6 sn seamless loop
- `box_reveal_loop_purple.mp4`
- `box_reveal_loop_black.mp4`
- Veya **WebM VP9** transparent denenebilir; yoksa PNG sequence

## H4. Box reveal PNG sequence (motion implementasyonu için ideal)
- Klasör: `09_motion_frames/red_open/`
- Frame’ler: `frame_000.png` … (24 fps × 0.8–1.2 sn ≈ 20–30 frame)
- Boyut: **1024 × 1024** veya **1280 × 1280**, şeffaf PNG
- Aynı purple/black için

---

# I) EMAIL / TRANSACTIONAL (opsiyonel ama launch için iyi)

## I1. Email header
- `email_header_600.png` — **1200 × 400** (@2x for 600px email width)
- Logo + soft product crop

## I2. Email box delivered illustration
- `email_box_delivered.png` — **1200 × 800**

---

# J) SOURCE MASTERS (tasarımcıdan istenecek)

- Figma/PSD/AI layered:
  - logo
  - boxes
  - cards
  - OG templates
- Font listesi + lisans notu (web’de kullanacaksak)
- Color tokens export (hex)

---

# Öncelik sırası (bunları önce yaptır)

### P0 — olmadan premium his tamamlanmaz
1. Brand logo + monogram (A1, A2)
2. Red/Purple/Black sealed + opened boxes (B1–B6)
3. Card front + stack + compositions (C1–C4)
4. OG default (E1)
5. Web favicon master (F1)
6. Site promo video + poster (H1)

### P1 — launch polish
7. Family lineup (B7)
8. Hero desktop/mobile (D1)
9. How-it-works 4 stills (D2)
10. Scene flow / edit mocks (C5–C6)
11. How-to-use video (H2)
12. Empty vault art (D3)

### P2 — nice to have
13. Motion frame sequences (H4)
14. Textures (G)
15. Social story set (E4)
16. Email assets (I)

---

# Hızlı checklist (adet özeti)

| Grup | Minimum dosya adedi (web-ready) | Master önerisi |
|------|----------------------------------|----------------|
| Brand | 6–10 | SVG + 2K PNG |
| Boxes | 18–24 | 4K PNG + WebP |
| Cards | 8–12 | 2K PNG + WebP |
| Marketing | 6–10 | 2K–3K |
| OG/Social | 4–8 | 1200×630 + @2x |
| Web favicon | 1 master (+ opsiyonel ico/32/180) | 1024 PNG |
| Video | 2 master MP4 + 2 poster | 1080p |
| Textures | 2–4 | tileable PNG |

**Pratik minimum paket:** ~40–55 final dosya  
**Full premium paket:** ~80–120 dosya (master+web+video frames)

---

# Renk / stil hatırlatma (designer için)

- Red = classic confident luxury  
- Purple = signature exclusive editorial  
- Black = atelier private concierge  
- Shadows soft layered, no hard drop shadow spam  
- No confetti, glitter overload, cyber neon, glassmorphism overload  
- Product is **digital luxury object**, not cardboard shipping box  

---

# Teslim notu (bana verirken)

Klasörü şu isimle ver:

```text
viralbox-premium-assets-YYYYMMDD/
```

İçinde:
1. Yukarıdaki klasör ağacı
2. `00_README.txt` (hangi dosyalar final, hangisi draft)
3. Mümkünse `MANIFEST.csv`:

```csv
filename,group,width,height,format,usage,notes
box_red_sealed_web_1600.webp,product_boxes,1600,1600,webp,store/vault/home,sealed red
```

Bu formatta gelirse doğrudan `public/` altına map edip UI’ye bağlayabilirim.
