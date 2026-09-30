# Instagram Category Catalog

Influencer uygulamada kutu satin almadan once bir veya daha fazla kategori secer. Bu secim hem onboarding tercihi hem de satin alma aninda teslim edilecek stok havuzunun anahtari olarak kullanilir.

## Sources

Katalog iki kaynaktan birlestirilir:

- `instagram_tum_kategoriler_birlesik.md`: creator/influencer odakli 160+ nis kategori.
- `https://thepennymatters.com/instagram-categories-list/`: alfabetik Instagram business category tablosu.

`tools/build-instagram-category-seed.ps1` bu kaynaklari okur, slug uzerinden tekrar edenleri birlestirir ve `supabase/seeds/instagram_categories.sql` dosyasini uretir.

## Database Shape

Tum secilebilir kategoriler `public.categories` tablosundadir.

| Alan | Kullanim |
|---|---|
| `slug` | Generator, inventory, purchase ve delivery icin canonical kategori anahtari |
| `name` | UI'da gosterilecek kategori adi |
| `family` | `creator_content` veya `instagram_business` |
| `risk_level` | `low`, `medium`, `restricted`; generator safety katmanini etkiler |
| `metadata.sources` | `local_influencer_niches`, `the_penny_matters_2026`, `viralbox_core` |
| `metadata.display_groups` | UI filtre/gruplama bilgisi |
| `metadata.suggested_layers` | Generator icin varsayilan icerik layer onerileri |

Influencer UI skor, band, internal inventory veya generator sinyali gostermez; kategori sadece secim ve kisilestirme yuzeyidir.

## Product Flow

```text
influencer selects category/persona
-> app stores creator_category_preferences
-> influencer buys 500 or 1000 USD box
-> deliver_idea_box uses category_slug + persona_slug
-> ideas are assigned from idea_inventory
```

Admin/generator tarafinda ayni `category_slug` stok uretimi icin kullanilir:

```text
admin sees low inventory for category + persona
-> generator creates batch
-> import + score + publish
-> idea_inventory refills that category/persona pool
```

## Rebuild

Kaynak katalog degisirse:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-instagram-category-seed.ps1
supabase db reset
supabase db lint --local
```

`supabase/config.toml` seed sirasinda once `seed.sql`, sonra `seeds/instagram_categories.sql` calistirir. Boylece cekirdek kategoriler korunur, genis Instagram katalog metadata'si onlarla birlesir.