# Supabase Architecture

## Amac

Supabase/Postgres ViralBox'un ana uygulama database'idir. Generator internal/admin aractir; influencer uygulamasi dosyadan fikir okumaz. Uygulama sadece Postgres'teki publish edilmis stoktan kendisine teslim edilen fikir kartlarini okur.

## Ana Akis

```text
admin selects category + persona
-> generator creates batch ideas
-> category_layer_policy_for_scope selects required/premium mechanism layers
-> JSON/direct import validation
-> idea_candidates + idea_cards
-> score pipeline writes idea_scores
-> Quality Gate v2.1 writes idea_quality_checks + idea_claim_evidence
-> publish-inventory writes idea_inventory
-> influencer buys a box
-> deliver_idea_box assigns inventory ideas
-> influencer reads only assigned idea_cards
```

## Core Tables

| Tablo | Rol |
|---|---|
| `profiles` | Auth kullanicisinin uygulama profili |
| `creator_profiles` | Creator handle, niche, kapasite ve sinirlar |
| `categories` | Influencer secimi, satin alma ve generator stok uretimi icin birlesik Instagram kategori katalogu |
| `creator_personas` | `luxury_editor`, `relatable_lifestyle`, `expert_guide` gibi algoritmik persona tipleri |
| `creator_category_preferences` | Influencer'in uygulamada sectigi kategori/persona/layer tercihleri |
| `category_layer_policies` | Kategori/family/fallback bazli required, optional ve premium mekanizma layer matrix'i |
| `box_products` | `$500` ve `$1000` kutu urunleri |
| `purchases` / `checkout_sessions` | Odeme ve checkout kayitlari |
| `algorithm_definitions` | `VIA-*` operator kutuphanesi |
| `admin_configs` | Scoring, inventory ve generator ayarlari |
| `idea_generation_batches` | Admin generation/import batch metadata |
| `idea_import_errors` | Hatali JSONL/direct payload satirlari |
| `idea_candidates` | Valid fikir adaylari; admin stok fikirlerinde `user_id = null` |
| `idea_scores` | Internal skorlar |
| `idea_quality_checks` | Semantic duplicate, safety, premium completeness, creator/platform/brand fit, performance kalibrasyonu ve editorial kalite karari |
| `idea_semantic_embeddings` | Embedding-ready duplicate altyapisi; vektorler internal servis tarafindan doldurulur |
| `idea_claim_evidence` | Sponsor/claim/disclosure riskleri icin internal evidence ve review kayitlari |
| `idea_performance_feedback` | Yayina alinan fikirlerin sonraki performans sinyalleri; scoring kalibrasyonu icin internal feedback |
| `idea_cards` | Influencer'a gosterilecek final kart payload'i |
| `idea_inventory` | Publish edilmis stok havuzu; internal `score_band`, reuse ve rank alanlari |
| `idea_box_deliveries` | Satin alinan kutunun kullaniciya teslim kaydi |
| `idea_box_items` | Teslimdeki fikirler; internal band assignment kolon grant'i yok |
| `viral_training_sources` | 2016-2026 viral corpus kaynaklari; internal egitim verisi |
| `viral_training_examples` | Viral orneklerin kopyalanmayan, soyut pattern gozlemleri |
| `viral_pattern_rules` | Generator'in kullanacagi internal VTP pattern kurallari |
| `viral_training_example_features` | Her ornekten turetilen VTP pattern, kalite ve risk sinyalleri |
| `viral_training_compilations` | Aktif training profile versiyonu ve corpus kalite raporu |
| `viral_training_pattern_affinity` | Kategori + platform + VTP pattern bazli signal_weight tablosu |
| `generator_eval_cases` | Generator degisikliklerini kontrol eden test/eval briefleri |
| `dataset_training_observations` | Dataset klasorunden gelen dedupe edilmis internal training observation katmani |
| `dataset_named_entity_provenance` | Unlu/influencer/channel/brand isimlerini hashlenmis internal provenance olarak tutar |
| `dataset_category_candidates` | Dataset kaynakli eksik kategori adaylari ve onayli kategori ekleme kayitlari |

| `media_training_review_queue` | Unknown rights, public figure, minor/privacy, sponsor/claim ve copyright risk review kuyruğu |

## Inventory Rules

Stok scope'u `category + persona` olarak calisir.

| Band | Minimum stok | Reorder threshold |
|---|---:|---:|
| `low` | 200 | 60 |
| `mid` | 100 | 30 |
| `high` | 100 | 30 |

Box allocation:

| Urun | Allocation |
|---|---|
| `viral_box_500` | `low:1`, `high:1` |
| `premium_viral_box_1000` | `low:2`, `mid:1`, `high:2` |

Band ve skorlar creator-facing UI'da gosterilmez.

## Quality Gate v2.1

`admin-generation-batches/:id/score` artik sadece skor yazmaz; her fikir icin `idea_quality_checks` satiri ve gerekiyorsa `idea_claim_evidence` kaydi da olusturur.

V2.1 ek katmanlari:

- embedding-ready duplicate altyapisi (`idea_semantic_embeddings`) ve lexical signature fallback,
- sponsor, saglik/body, finans ve minor/privacy claim evidence kontrolu,
- `idea_performance_feedback` uzerinden performans kalibrasyonu,
- restricted/riskli fikirlerde `second_opinion_required` isareti,
- category layer policy coverage kontrolu (`category_layer_pack.applied_layers`, required layer eksigi ve practical effect coverage),
- premium completeness + creator/platform/brand fit + editorial score karar katmani.

Kalite kararlari:

| Karar | Anlam |
|---|---|
| `approve` | Publish adimina girebilir |
| `refine` | Generator/admin tarafinda revize edilmeli |
| `reject` | Stoklanmaz |
| `human_review_required` | Restricted kategori veya yuksek safety riski; insan onayi gerekir |

`publish-inventory` sadece `approve` olan ve hem `quality_floor` hem de `editorial_quality_floor` tabanini gecen fikirleri `idea_inventory` havuzuna alir. Internal quality metadata inventory'ye yazilir ama influencer UI'da gosterilmez.

## Instagram Category Catalog

`categories` tablosu yalnizca cekirdek Beauty/Fashion/Travel kategorilerinden olusmaz. `seed.sql` sonrasinda `supabase/seeds/instagram_categories.sql` calisir ve:

- `instagram_tum_kategoriler_birlesik.md` icindeki creator/influencer nislerini,
- The PennyMatters Instagram category tablosundan cekilen business kategorilerini,
- ViralBox cekirdek kategori slug'larini

tek katalogda birlestirir. Kaynak, UI grubu, onerilen layerlar ve safety notlari `metadata` icinde tutulur. Ayrinti: `docs/architecture/instagram-category-catalog.md`.

## RLS and Grants

Public schema API'ye acik oldugu icin tum tablolarda RLS aciktir. User-owned tablolarda temel kural:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

Admin/internal tablolar (`idea_generation_batches`, `idea_import_errors`, `idea_inventory`) icin authenticated policy yoktur; Edge Functions service role ile calisir.
Training tablolarinda da authenticated/anon policy yoktur. Viral corpus ve pattern kurallari creator-facing urun verisi degil, internal generator/evaluation bilgisidir.
Compiled training tablolari ve `training_profile_for_scope()` fonksiyonu da sadece service role tarafindan kullanilir.
`idea_quality_checks`, `idea_claim_evidence`, `idea_semantic_embeddings` ve `idea_performance_feedback` internal kalite tablolari olarak authenticated/anon grant'i almaz.
`category_layer_policies` ve `category_layer_policy_for_scope()` da internal generator policy yuzeyidir; authenticated/anon grant'i yoktur.

Column-level grant kullanilan hassas alanlar:

- `box_products.allocation` creator'a acilmaz.
- `idea_box_items.assigned_band` creator'a acilmaz.
- `idea_box_deliveries.allocation` creator'a acilmaz.
- `purchases.raw_event` ve provider internal alanlari creator'a acilmaz.

`profiles.role` client tarafindan degistirilemez; migration trigger'i role self-promotion riskini engeller.

## Delivery Idempotency

Payment webhook'lari retry yapabilecegi icin `deliver_idea_box()` ayni `purchase_id` ile tekrar cagrildiginda idempotent davranir. Delivery zaten `delivered` ise yeni stok tuketmeden mevcut delivery id doner. Yeterli stok yoksa delivery `needs_inventory` olarak isaretlenir.

## File Import

Dosyalar kalici urun verisi degildir. JSONL sadece import ara formatidir:

```text
generated_batches/
  batch_2026_06_28_beauty_luxury_editor/
    manifest.json
    ideas_0001.jsonl
    ideas_0002.jsonl
    scores.jsonl
    rejected.jsonl
```

Import sonrasi kalici kaynak Postgres tablolaridir.

## Training Compile

`supabase/seeds/viral_training_compile.sql` seed siralamasinin son adimidir. Ham corpus yuklendikten sonra:

```text
viral_training_examples
-> viral_training_example_features
-> viral_training_compilations
-> viral_training_pattern_affinity
-> admin_configs.training.compiled_profile
```

Admin generator bir kategori/persona icin fikir uretmeden once scope profili ceker:

```sql
select * from public.training_profile_for_scope('beauty', 'instagram_reels', 12);
select * from public.category_layer_policy_for_scope('beauty', 'instagram_reels', 'premium_viral_box_1000');
```

Bu veri sadece internal prompt/scoring yardimcisidir; influencer UI'da pattern id, signal weight, quality vector, source title veya real example bilgisi gosterilmez.
Layer policy tarafinda da `policy_slug`, `quality_rules` ve internal metadata gosterilmez; creator karti yalnizca `category_layer_pack` icindeki uygulanmis layerlari ve pratik fayda cumlelerini kullanir.

Dataset full training reset gerektirmeyen additive bir akistir. `tools/train-from-dataset.ps1` tum `dataset/` klasorunu tarar, duplicate dosyalari ve satirlari eler, isimleri hashlenmis provenance'a cevirir, weighted training example/trend/eval sinyali uretir ve `2026-v2-dataset` compiled profile'ini aktif eder. Gercek unlu veya influencer isimleri creator-facing kartlara cikmaz.