# Viral Corpus Training Methodology

`son_10_yil_viral_fikirler.md` proje icin ham fikir bankasi degildir. Bu dosya 2016-2026 arasindaki viral davranislari anlamak icin kullanilan bir egitim corpus'udur.

## Goal

Generator eski viral icerikleri kopyalamaz. Her ornek su sorularla soyutlanir:

- Insanlar neden katildi?
- Format neden tekrar edilebildi?
- Hangi duygu tetiklendi?
- Hangi platform ozelligi bunu buyuttu?
- Riskli veya artik eskimis tarafi neydi?
- Bu mekanizma high-profile influencer icin nasil guvenli ve premium hale gelir?

## Pipeline

```text
local markdown research
-> viral_training_sources
-> viral_training_examples
-> viral_pattern_rules
-> viral_training_example_features
-> viral_training_compilations
-> viral_training_pattern_affinity
-> generator_eval_cases
-> generator prompt and scoring configs
```

The corpus also includes a generated 1000-row seed from real documented internet examples:

```text
Wikidata SPARQL + Wikipedia category APIs
-> tools/build-real-viral-examples-seed.ps1
-> supabase/seeds/real_viral_examples.sql
-> viral_training_examples
-> supabase/seeds/viral_training_compile.sql
-> compiled training profile
```

The last internet research pass adds a small high-signal platform behavior seed:

```text
TikTok Next 2026 + Meta Reels ranking/originality + YouTube Culture and Trends
-> supabase/seeds/current_platform_research_2026.sql
-> viral_training_examples
-> compiled training profile
```

This file is not a list of viral ideas to copy. It trains the generator on current platform mechanisms such as curiosity detours, emotional ROI commerce, Reels recommendation eligibility, originality/substantial transformation, tier-list debate formats, digital franchise loops, shopping trust and human-led AI disclosure.

The local `dataset/` folder can also be trained additively:

```text
dataset/*.md + dataset/*.ipynb + dataset/**/*.csv
-> tools/train-from-dataset.ps1
-> dataset_training_observations
-> viral_training_examples + trend_signals + generator_eval_cases
-> compiled profile 2026-v2-dataset
```

Celebrity, influencer, channel and brand names in these files are used only as internal hashed provenance. They teach category fit, creator tier, viral mechanism and missing category discovery, but generator output must not imitate or name them.

Media/Reels training adds a multimodal craft layer without turning videos into copyable source material:

```text
upload/Reels URL/manual transcript + caption + admin notes
-> media_training_assets duplicate hash checks
-> media_training_observations pattern extraction
-> rights/safety/copy-risk review
-> dataset_training_observations source_kind media_video/media_reels_url/media_transcript
-> viral_training_examples + trend_signals + generator_eval_cases
-> compiled profile 2026-v4-media-training
```

This layer teaches Reels tempo, first-second visual hooks, shot taxonomy, scene rhythm, creator presence, caption/comment engines, save triggers and brand-safety boundaries. It does not teach exact captions, poses, scenes, source links, creator names, public figure names, copyrighted audio or raw video surfaces.

## Compiled Training Profile

Ham ornekler generator'a dogrudan kopya malzeme olarak verilmez. `viral_training_compile.sql` her reset/retrain sirasinda tum ornekleri yeniden derler:

- her ornege `derived_pattern_ids` verir,
- kalite, kaynak guveni, copy risk, platform fit ve premium fit sinyallerini `quality_vector` icine yazar,
- riskleri `risk_flags` olarak ayirir,
- kategori + platform + VTP pattern bazinda `signal_weight` hesaplar,
- aktif profili `admin_configs` icinde `training.compiled_profile / 2026-v1` olarak yayinlar.

Generator/worker bir kategori icin fikir uretmeden once internal olarak sunu okur:

```sql
select * from public.training_profile_for_scope('beauty', 'instagram_reels', 12);
```

Bu cikti creator'a gosterilmez. Sadece generator'in hangi viral mekanizmalari daha guclu aday olarak kullanacagini belirler.
Kategori icin exact training sinyali yoksa fonksiyon ayni platformdaki global pattern affinity profilinden fallback dondurur; bu, 1000+ Instagram kategori katalogunda bos generator profili kalmamasini saglar.

## Training Policy

| Kural | Aciklama |
|---|---|
| Pattern only | Yuzey, karakter, soz, kisi, marka veya birebir format kopyalanmaz |
| Anti-copy | Eski viral ornek sadece mekanizma olarak kullanilir |

| Negative examples | Tehlikeli challenge'lar generator icin yasak sinyaldir |
| Platform-native | Pattern Reels, Story, Carousel veya Shorts davranisina uyarlanir |
| Premium adaptation | High-profile influencer icin brand lift, sponsor guvenligi ve itibar etkisi eklenir |

The 1000-row real-example seed is intentionally conservative: title/source metadata is stored so humans can audit provenance, but generator instructions treat every row as `pattern_only` with high copy risk.

## Core Learned Mechanisms

| Pattern | Ne Ogretir |
|---|---|
| `VTP-001` Participation Challenge Loop | Katilimi kolay, dusuk riskli challenge tasarlama |
| `VTP-002` Nostalgia Delta Loop | Gecmis referansi bugunku kimlik ve yorumla yenileme |
| `VTP-003` Meme Template Translation | Meme'in duygu geometrisini kategoriye cevirmek |
| `VTP-004` Transformation Without Harm | Before/after baskisi olmadan reveal uretmek |
| `VTP-005` Interactive Live Trigger | Yorum, poll veya live input ile ortak uretim |
| `VTP-006` AI Assisted Self-Remix | AI'yi disclosure ve insan yorumu ile guvenli kullanmak |
| `VTP-007` Imperfect Human Proof | AI/polished backlash caginda insan sureci gostermek |
| `VTP-008` Social Commerce Entertainment | Once eglence/kanit, sonra dusuk baskili conversion |
| `VTP-009` Brand Community Co-Design | Sponsorlu fikri creator ve community ile birlikte sekillendirmek |
| `VTP-010` Values In Action | Degeri sloganla degil davranis, tradeoff ve sahneyle gostermek |
| `VTP-011` Controlled Creative Risk | Marka/creator anchor'i kaybetmeden oyunlu risk almak |
| `VTP-012` Fandom Participation Engine | Takipciye guvenli fan rolu vermek |
| `VTP-013` Searchable Social Answer | Sosyal arama niyetini native Reels/Carousel cevabina cevirmek |
| `VTP-014` Episodic Familiarity Loop | Tek fikri tekrar donen seri vaadine donusturmek |
| `VTP-015` Private Community Loop | Broadcast/story/channel inputunu public-safe payofa cevirmek |
| `VTP-016` Reaction Context Layer | Reaction formatini outrage degil yorum ve kanit katmani yapmak |
| `VTP-017` Meaningful UGC Submission | Bos tag-spam yerine izinli ve anlamli UGC toplamak |
| `VTP-018` Curate Not Copy | Trendleri kopyalamak yerine creator taste filtresinden gecirmek |
| `VTP-019` Unfiltered Process Proof | Polished/AI sameness yerine gercek surec ve duzeltme gostermek |
| `VTP-020` Curiosity Detour Discovery | Arama niyetinden daha iyi bitisik soruya gecmek |
| `VTP-021` Emotional ROI Commerce | Satin almanin duygusal donusunu ve sinirini anlatmak |
| `VTP-022` Readable Maximalism | Yogun edit ve referansi anlasilir vaade baglamak |
| `VTP-023` Professional Fan Authority | Fan bilgisini kanitli, cömert ve guvenli uzmanliga cevirmek |
| `VTP-024` Creator Media System | Tekil viral fikri content pillar ve repeatable workflow'a cevirmek |
| `VTP-025` Shopping Trust Path | Discovery, review, comparison ve honest limit ile guven kurmak |
| `VTP-026` Low-Regret Attention | Izleyicinin izledikten sonra iyi hissettigi anlamli/kullanisli icerik |
| `VTP-027` Promise Packaging Contract | Hook, cover, caption ve payoff'un ayni vaadi tutmasi |
| `VTP-028` Receipt-Based Opinion | Guclu gorusu kanit, sinir ve saygili davetle sunmak |
| `VTP-029` Short To Long Loyalty Bridge | Kisa video kesfinden uzun vadeli bagliliga kopru kurmak |
| `VTP-030` DM To Decision Funnel | Public icerikten private-safe karar destegine gecmek |
| `VTP-031` Creator Lore Map | Tekrar eden sembol/rituel/icerik evrenini yeni izleyiciye acmak |
| `VTP-032` Objection Writer Room | Yorum itirazlarini guven kuran icerige cevirmek |
| `VTP-033` Micro Community Ritual | Kucuk tekrar eden topluluk aliskanligi yaratmak |
| `VTP-034` Dual Audience Packaging | Yeni izleyiciye context, eski fana derin odul vermek |
| `VTP-035` Evidence-Led Myth Flip | Yaygin yanlis inanci kanitli ve pratik sekilde duzeltmek |
| `VTP-036` Human-Led AI Workflow | AI'yi taslak, insani editor ve zevk filtresi yapmak |
| `VTP-037` Localized Global Remix | Global format mantigini lokal friksiyona cevirmek |
| `VTP-038` Save-First Utility Stack | Problem, karar kurali ve checklist ile kaydedilebilirlik kurmak |
| `VTP-039` Sensory Proof Loop | Doku, ses, olcek ve hareketle guven veren proof kurmak |
| `VTP-040` Transparent Deal Story | Sponsor/partnerlik uyumunu ve sinirlarini seffaf anlatmak |

## Safety

Tehlikeli viral formatlar egitimde yasak ornek olarak tutulur. Generator:

- fiziksel zarar ihtimali olan challenge uretmez,
- saglik/finans/hukuk iddialarinda claim boundary ister,
- AI kullaniliyorsa disclosure ister,
- kisi/creator/telif/marka taklidi yapmaz,
- hassas sosyal hareketleri kampanya malzemesi gibi kullanmaz.

## Evaluation

`generator_eval_cases` her yeni generator degisikliginde kontrol edilmelidir. Basarili cikti:

- beklenen VTP mekanizmalarini fikrin ic mantiginda kullanir,
- yasakli pattern'leri uretmez,
- skor, band veya internal training bilgisini influencer kartina sizdirmaz,
- premium kart alanlarini eksiksiz doldurur.

## Retrain Command

Mevcut orneklerle egitimi tekrar calistirmak icin:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\
etrain-viral-corpus.ps1
```

Bu komut local database'i resetler, seedleri yukler, compiled training profile'i olusturur, lint calistirir ve temel training sayilarini raporlar.

Dataset klasorundeki tum verilerle additive egitim icin:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-dataset.ps1 -DatasetPath .\\dataset -Apply -CompileVersion 2026-v2-dataset
```

