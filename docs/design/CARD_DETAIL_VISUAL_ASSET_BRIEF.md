# Anomaly Box — Card Detail Visual Asset Brief

## Amaç

Creator Vault içinden açılan kart detay sayfalarını daha premium, daha anlaşılır
ve daha uygulanabilir hale getirmek.

Bu görseller karta özel içerik üretmeyecek. Bütün kartlarda aynı teknik görsel
sistemi kullanılacak; karta özel Goal, Action, Say This, Shot ve diğer gerçek
brief bilgileri erişilebilir HTML metni olarak kalacak.

Görsellerin görevi:

- Creator'a her alanın ne işe yaradığını hızlıca öğretmek.
- Video akışını, çekim planını ve edit mantığını görsel olarak açıklamak.
- Uzun metinlerin yarattığı bilişsel yükü azaltmak.
- Kart detay sayfasına tutarlı ve premium bir prodüksiyon kılavuzu hissi vermek.

## Araştırma Özeti

Yerel stokta incelenen 74.581 kartın tamamına yakını şu ortak bilgi yapısını
kullanıyor:

- Scene script
- Shot list
- Editing timeline
- Posting safety
- Hook
- Context
- Demonstration
- Payoff
- CTA

Kartlar 3–8 adımlı yeni arayüz yapısına dönüştürülse de kaynak kartların büyük
çoğunluğu beş temel video aşamasına sahip. Bu nedenle her karta özel görsel
üretmek yerine bütün kartlarda kullanılan ortak teknik rehber görseller daha
doğru ve ölçeklenebilir bir çözümdür.

## Teslim Edilecek Asset Sayısı

### Ana görseller

Toplam 7 adet:

1. Video Flow Map
2. Shoot Plan Anatomy
3. Shot Language
4. On-screen Text Safe Zone
5. Edit Assembly
6. Performance Direction
7. Posting Safety

### Alan ikonları

Toplam 7 adet SVG ikon:

1. Goal
2. Action
3. Say This
4. Shot
5. On-screen Text
6. Edit Note
7. Performance Note

### Genel toplam

- 7 ana teknik görsel
- 7 SVG alan ikonu
- Toplam 14 tasarım asseti

AI görsel üretimi yalnızca 7 ana görsel için kullanılmalıdır. Küçük alan ikonları
ve görsel üzerindeki okunabilir etiketler SVG/HTML olarak hazırlanmalıdır.

## Teknik Teslim Formatı

Ana görseller:

- Master: 1600 × 1200 px
- En-boy oranı: 4:3
- Renk profili: sRGB
- Master format: PNG
- Web formatı: WebP
- WebP hedef kalite: %82–88
- Önerilen maksimum WebP boyutu: 180 KB
- Görseller metinsiz olmalı.
- Mobilde kırpılmadan `object-contain` ile kullanılabilecek kompozisyon kurulmalı.
- Ana öğeler kenarlardan en az %8 güvenli alanda tutulmalı.

İkonlar:

- Format: SVG
- ViewBox: 24 × 24
- Stroke tabanlı
- `currentColor` destekli
- 1.75–2 px çizgi kalınlığı
- Dolgu minimum düzeyde
- Küçük boyutta net okunabilir

## Ortak Görsel Dil

- Lüks editoryal prodüksiyon kılavuzu
- Swiss information design etkisi
- Sıcak kırık beyaz zemin
- Koyu antrasit çizgiler
- Kontrollü bordo kırmızı, koyu mor ve teal vurgular
- İnce, hassas, vektör benzeri çizgiler
- Çok hafif ve doğal gölgeler
- Bol negatif alan
- Tek bakışta anlaşılır hiyerarşi
- Yüz göstermeyen creator siluetleri
- Kamera, telefon, ışık ve prodüksiyon ekipmanı

Kullanılmaması gerekenler:

- Hediye kutusu veya ambalaj
- Havada uçuşan kartlar
- Stok fotoğraf görünümü
- Tanınabilir insan yüzü
- Bozuk el veya parmak anatomisi
- Çizgi film veya ucuz 3D render
- Neon renkler
- Glassmorphism
- Aşırı gradient
- Dekoratif ama işlevsiz öğeler
- Görsel içine üretilmiş sahte yazılar
- Uygulama veya sosyal platform logosu

## Ortak Ana Prompt

Aşağıdaki prompt her asset promptunun başına eklenmelidir:

```text
Create one premium instructional illustration for the Anomaly Box creator
production system.

Visual style: luxury editorial production manual, restrained Swiss information
design, warm off-white paper background, deep charcoal ink lines, subtle
controlled accents in burgundy red, muted royal purple and dark teal, precise
thin vector-like linework, minimal soft shadows, high-end camera manual
aesthetic, spacious composition, clear visual hierarchy, technically
understandable at a glance.

Use faceless creator silhouettes, hands, camera, smartphone, lighting equipment
and clean timeline geometry. The illustration must feel operational and
educational, not decorative.

No gift box, no packaging, no floating cards, no stock-photo aesthetic, no
artificial face, no visible facial identity, no 3D cartoon render, no neon, no
glassmorphism, no excessive gradients, no clutter.

Do not render readable text, letters, numbers, logos or fake UI copy. Leave
intentional blank label areas so real accessible HTML labels can be positioned
by the website.

Aspect ratio 4:3, 1600 by 1200 pixels, sRGB, sharp but restrained, suitable for
conversion to WebP.
```

## Asset 01 — Video Flow Map

Dosya adı:

```text
guide_video_flow.webp
```

Kullanım yeri:

- Video Flow başlığının altında
- Karta özel timeline listesinden önce
- Her kartta yalnızca bir kez

Prompt:

```text
Show a five-stage short-form video flow as a calm horizontal storyboard.

Create five connected visual frames:
1. a decisive pattern-interrupt opening,
2. a simple context-setting moment,
3. a proof or demonstration moment,
4. a clear visual payoff,
5. a final viewer action.

Use a faceless creator, smartphone camera framing, an object or product
demonstration, proof close-up and a final action frame. Connect the five frames
with a precise timeline rail and subtle directional arrows.

Each stage must have a clearly different visual purpose even without text. The
first frame should feel fast and attention-led, the middle should feel
explanatory, and the final frame should feel settled and actionable.

Leave five small blank caption zones below the frames. Do not place readable
text in them.
```

HTML etiketleri:

```text
Hook → Context → Demonstration → Payoff → CTA
```

## Asset 02 — Shoot Plan Anatomy

Dosya adı:

```text
guide_shoot_plan_anatomy.webp
```

Kullanım yeri:

- Shoot Plan başlığının altında
- Accordion adımlarından önce
- Her kartta yalnızca bir kez

Prompt:

```text
Create a premium anatomy diagram of one short-form video shoot step.

Place one vertical 9:16 smartphone camera frame in the center. Inside it show a
faceless creator performing a simple action with a product or object.

Build seven restrained visual callouts around the phone frame:
- an objective marker above the composition,
- a physical action path around the creator's hands,
- a speech waveform near the creator,
- camera framing corners around the phone image,
- a safe overlay zone inside the phone,
- a cut marker and timeline beneath the phone,
- a subtle posture, eye-line and energy indicator beside the creator.

The seven callouts must visually correspond to Goal, Action, Say This, Shot,
On-screen Text, Edit Note and Performance Note, but do not render those words.
Leave seven clean blank label positions for HTML overlays.

The composition should feel like a luxury film-production field manual,
immediately understandable, balanced and uncluttered.
```

HTML etiketleri:

- Goal
- Action
- Say This
- Shot
- On-screen Text
- Edit Note
- Performance Note

## Asset 03 — Shot Language

Dosya adı:

```text
guide_shot_language.webp
```

Kullanım yeri:

- Shot alanının yardımcı görsel panelinde
- Gerektiğinde açılan “Visual Guide” alanında
- Her Shoot Plan adımında tekrar edilmemeli

Prompt:

```text
Create a premium six-frame camera shot language reference for short-form
creators.

Arrange six clean miniature 9:16 storyboard frames in a disciplined grid:
- tight opening reveal,
- overhead decision-table shot,
- medium creator frame,
- detail proof close-up,
- hands interacting with an object,
- final payoff or checklist frame.

Use the same faceless creator and the same neutral studio environment in every
frame so only camera position and framing change.

Add subtle camera boundary lines, focal-point markers and direction arrows.
Each frame must clearly demonstrate a different shot function without requiring
text.

Leave a small blank label zone beneath each frame. No readable text, numbers or
fake camera settings.
```

## Asset 04 — On-screen Text Safe Zone

Dosya adı:

```text
guide_text_safe_zone.webp
```

Kullanım yeri:

- On-screen Text alanının yardımcı panelinde
- Mobil video yerleşiminin nasıl kurulacağını açıklamak için

Prompt:

```text
Create a precise vertical-video safe-zone diagram for on-screen text.

Place a large 9:16 smartphone video frame in the center. Show a faceless creator
and a simple object demonstration inside the frame.

Use restrained translucent geometry to indicate:
- the safe headline area,
- the primary subject area,
- the lower caption-safe area,
- side areas that should remain clear of platform controls,
- an unsafe bottom edge and unsafe right-side interaction zone.

Represent text only as short abstract horizontal bars, never as readable words.
Show one good overlay placement and one visibly obstructed placement using
elegant check and boundary symbols.

The diagram should resemble a premium broadcast graphics manual, not a social
media template.
```

## Asset 05 — Edit Assembly

Dosya adı:

```text
guide_edit_assembly.webp
```

Kullanım yeri:

- Edit Note ve edit assembly rehberinde
- Shoot Plan sonrasında veya açılır “Edit Guide” panelinde

Prompt:

```text
Create a premium editing assembly diagram for a five-beat vertical video.

Show a clean horizontal editing timeline with five thumbnail clips
corresponding to opening, context, proof, payoff and final action.

Below the clips include separate minimal technical layers:
- precise cut-point markers,
- a restrained voice waveform,
- on-screen overlay timing bars,
- a subtle music and sound layer,
- pacing density that starts fast, breathes during proof and settles at the
  payoff.

Use abstract thumbnail imagery with a faceless creator, hands, close-up proof
and final action. Use burgundy only for important cuts, purple for overlays and
teal for audio cues.

No readable text, timecodes or software interface branding. It should feel like
a simplified professional edit suite, understandable in seconds.
```

## Asset 06 — Performance Direction

Dosya adı:

```text
guide_performance_direction.webp
```

Kullanım yeri:

- Performance Note alanının yardımcı panelinde
- Duruş, bakış ve hareket mantığını açıklamak için

Prompt:

```text
Create a premium performance-direction diagram for a faceless short-form
creator.

Show three connected upper-body creator poses:
- direct and decisive opening,
- natural demonstration with attention on the object,
- calm return to camera for the final line.

Use subtle eye-line arrows without showing detailed eyes, hand-motion paths,
posture axes and restrained energy curves.

Demonstrate natural hand placement, relaxed shoulders, controlled product
handling and the difference between overacting and calm authority through body
language alone.

No readable text, no facial identity and no exaggerated influencer
expressions. The result should resemble an elegant directing reference used on
a professional commercial shoot.
```

## Asset 07 — Posting Safety

Dosya adı:

```text
guide_posting_safety.webp
```

Kullanım yeri:

- Posting Safety bölümünün başında
- Kart detay sayfasının sonunda

Prompt:

```text
Create a premium visual checklist for responsible creator posting.

Use a restrained three-part composition:
- a personal experience or result,
- a supporting proof or context element,
- a clear disclosure or boundary before publishing.

Show a faceless creator reviewing a vertical video beside simple evidence
objects, a disclosure marker and a final publish checkpoint.

Use elegant boundary lines and verification symbols. Avoid generic
cybersecurity shields, warning triangles, legal-document clichés or corporate
compliance imagery.

The visual should communicate: frame claims around personal context, support
important statements, disclose partnerships clearly and avoid universal
guarantees.

Do not include readable words or legal text. Leave three blank caption zones
for accessible HTML explanations.
```

## SVG Alan İkonları

Dosyalar:

```text
field-goal.svg
field-action.svg
field-say-this.svg
field-shot.svg
field-on-screen-text.svg
field-edit-note.svg
field-performance-note.svg
```

Görsel karşılıkları:

| Alan | İkon fikri |
|---|---|
| Goal | Merkez noktalı hedef |
| Action | Yönlü el veya hareket izi |
| Say This | Kısa ses dalgası |
| Shot | Kamera kadraj köşeleri |
| On-screen Text | Telefon içi güvenli overlay alanı |
| Edit Note | Cut işareti ve timeline |
| Performance Note | Duruş ekseni ve enerji yayı |

İkonlarda yazı kullanılmamalıdır. Her ikon HTML tarafında görünür alan etiketiyle
birlikte gösterilmelidir.

## Sayfa Yerleşim Önerisi

### Card Header

- Görselsiz kalmalı.
- Başlık, concept summary, format, süre ve gerekli ekipman öne çıkmalı.
- Dekoratif hero görsel eklenmemeli.

### Video Flow

- `guide_video_flow.webp` bir kez gösterilmeli.
- Altında karta özel dinamik timeline yer almalı.
- Görsel karta özel timeline bilgisinin yerine geçmemeli.

### Shoot Plan

- `guide_shoot_plan_anatomy.webp` bir kez gösterilmeli.
- Accordion içindeki her alan kendi küçük SVG ikonunu kullanmalı.
- Büyük görsel her video adımında tekrar edilmemeli.

### Yardımcı Visual Guide

Şu görseller tek bir açılır yardım alanında sunulabilir:

- Shot Language
- On-screen Text Safe Zone
- Edit Assembly
- Performance Direction

Bu panel varsayılan olarak kapalı olabilir. Creator ihtiyaç duyduğunda açar;
sayfa ilk yüklemede gereksiz yere uzamaz.

### Posting Safety

- `guide_posting_safety.webp` Posting Safety metniyle birlikte gösterilmeli.
- Eğer aynı bilgi hemen yanındaki HTML metninde eksiksiz anlatılıyorsa görsel
  dekoratif kabul edilip `alt=""` kullanılabilir.
- Görsel tek başına yeni bilgi aktarıyorsa kısa bir alt metin ve görünür açıklama
  eklenmelidir.

## Erişilebilirlik Kuralları

- Okunması gereken metin görsele gömülmemeli.
- Görsel üzerindeki etiketler HTML olarak yerleştirilmeli.
- Gerçek karta özel bilgiler her zaman metin olarak bulunmalı.
- Bilgilendirici görseller uygun kısa alt metne sahip olmalı.
- Aynı bilgi yanındaki HTML metinde mevcutsa görsel `alt=""` kullanabilir.
- Görsel olmadan da bütün brief tamamlanabilir olmalı.
- Renk tek başına anlam taşımamalı; şekil ve konum da kullanılmalı.
- Mobilde minimum yazı büyüklüğü görsel içine gömülmediği için HTML tarafından
  kontrol edilmeli.

Referans:

- W3C Images Tutorial: https://www.w3.org/WAI/tutorials/images/
- W3C Images of Text: https://www.w3.org/WAI/tutorials/images/textual/

## Performans Kuralları

- İlk görünür Video Flow görseli gerekirse preload edilebilir.
- Diğer rehber görseller lazy-load edilmelidir.
- Görseller için sabit 4:3 container ayrılmalıdır.
- Böylece yükleme sırasında layout shift oluşmamalıdır.
- Desktop ve mobile için tek, merkez güvenli 4:3 kompozisyon kullanılabilir.
- `sizes` değeri gerçek container genişliğine göre tanımlanmalıdır.
- Aynı asset her kartta kullanıldığı için uzun süreli tarayıcı cache’i
  uygulanmalıdır.

## Kabul Kriterleri

Bir asset ancak şu koşulları karşılıyorsa kabul edilmelidir:

- İlk bakışta hangi teknik kavramı anlattığı anlaşılabiliyor.
- Görsel olmadan brief hâlâ eksiksiz kullanılabiliyor.
- Görsel, metni tekrar etmek yerine zihinsel model oluşturuyor.
- İçinde hatalı veya anlamsız AI metni bulunmuyor.
- Creator yüzü veya kimliği görünmüyor.
- El ve ekipman anatomisi doğal.
- Telefon kadrajı ve kamera yönleri teknik olarak tutarlı.
- 320 px genişlikte görsel yapısı hâlâ seçilebiliyor.
- Anomaly Box premium renk ve çizgi sistemiyle uyumlu.
- Hediye kutusu ve uçuşan kart metaforu içermiyor.
- WebP çıktısı hedef dosya boyutunu aşmıyor.

## Önerilen Public Klasörü

```text
public/
  assets/
    premium/
      card-guides/
        guide_video_flow.webp
        guide_shoot_plan_anatomy.webp
        guide_shot_language.webp
        guide_text_safe_zone.webp
        guide_edit_assembly.webp
        guide_performance_direction.webp
        guide_posting_safety.webp
        icons/
          field-goal.svg
          field-action.svg
          field-say-this.svg
          field-shot.svg
          field-on-screen-text.svg
          field-edit-note.svg
          field-performance-note.svg
```

## Sonuç

Bu sistem için 7 büyük ortak teknik görsel yeterlidir. Daha fazla büyük görsel
kart detay sayfasını ağırlaştırır ve brief metniyle rekabet etmeye başlar.

Yedi büyük görsel creator'a sistemin mantığını öğretir; yedi küçük ikon ise her
Shoot Plan adımında bilgiyi hızlı taramayı sağlar. Karta özel talimatlar görsel
içinde değil, dinamik ve erişilebilir HTML olarak kalmalıdır.
