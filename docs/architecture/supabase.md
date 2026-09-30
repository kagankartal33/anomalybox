# Supabase Architecture

## Amac

Supabase/Postgres ViralBox'un ana uygulama database'idir. Generator internal/admin aractir; influencer uygulamasi dosyadan fikir okumaz. Uygulama sadece Postgres'teki publish edilmis stoktan kendisine teslim edilen fikir kartlarini okur.

## Ana Akis

```text
admin selects category + persona
-> generator creates batch ideas
-> JSON/direct import validation
-> idea_candidates + idea_cards
-> score pipeline writes idea_scores
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
| `categories` | Beauty, Fashion, Travel gibi satin alma/generator kategorileri |
| `creator_personas` | `luxury_editor`, `relatable_lifestyle`, `expert_guide` gibi algoritmik persona tipleri |
| `creator_category_preferences` | Influencer'in uygulamada sectigi kategori/persona/layer tercihleri |
| `box_products` | `$500` ve `$1000` kutu urunleri |
| `purchases` / `checkout_sessions` | Odeme ve checkout kayitlari |
| `algorithm_definitions` | `VIA-*` operator kutuphanesi |
| `admin_configs` | Scoring, inventory ve generator ayarlari |
| `idea_generation_batches` | Admin generation/import batch metadata |
| `idea_import_errors` | Hatali JSONL/direct payload satirlari |
| `idea_candidates` | Valid fikir adaylari; admin stok fikirlerinde `user_id = null` |
| `idea_scores` | Internal skorlar |
| `idea_cards` | Influencer'a gosterilecek final kart payload'i |
| `idea_inventory` | Publish edilmis stok havuzu; internal `score_band`, reuse ve rank alanlari |
| `idea_box_deliveries` | Satin alinan kutunun kullaniciya teslim kaydi |
| `idea_box_items` | Teslimdeki fikirler; internal band assignment kolon grant'i yok |

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

## RLS and Grants

Public schema API'ye acik oldugu icin tum tablolarda RLS aciktir. User-owned tablolarda temel kural:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

Admin/internal tablolar (`idea_generation_batches`, `idea_import_errors`, `idea_inventory`) icin authenticated policy yoktur; Edge Functions service role ile calisir.

Column-level grant kullanilan hassas alanlar:

- `box_products.allocation` creator'a acilmaz.
- `idea_box_items.assigned_band` creator'a acilmaz.
- `idea_box_deliveries.allocation` creator'a acilmaz.
- `purchases.raw_event` ve provider internal alanlari creator'a acilmaz.

`profiles.role` client tarafindan degistirilemez; migration trigger'i role self-promotion riskini engeller.

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