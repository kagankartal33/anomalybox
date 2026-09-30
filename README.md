# ViralBox / ViralFikirKutusu

ViralBox, creator brieflerinden platforma uygun, güvenli, test edilebilir ve açıklanabilir viral fikir adayları üreten bir Supabase tabanlı Creative Intelligence Engine taslağıdır.

Bu klasörde iki tür kaynak var:

- `ViralFikirKutusu_Viral_Idea_Algorithm_Engine(6).md`: tek kanonik ürün ve algoritma arşivi.
- `docs/` ve `supabase/`: geliştirme için bölünmüş, uygulanabilir dosya yapısı.

## Hızlı Başlangıç

```powershell
supabase start
supabase db reset
```

Studio: `http://127.0.0.1:54323`

## Dosya Haritası

| Yol | Amaç |
|---|---|
| `docs/architecture/supabase.md` | Supabase mimarisi, tablo sahipliği, RLS yaklaşımı |
| `docs/algorithms/comedy-remix.md` | Ultimate Comedy entegrasyonu ve `VIA-101–120` mantığı |
| `docs/api/contracts.md` | Uygulama/Edge Function API sözleşmeleri |
| `docs/prompts/generate-ideas-system.md` | LLM üretim sistemi için çekirdek prompt |
| `docs/operations/local-setup.md` | Yerel Supabase kurulum ve doğrulama adımları |
| `supabase/migrations/` | Supabase CLI migration dosyaları |
| `supabase/seed.sql` | Başlangıç algoritmaları ve config seedleri |
| `supabase/functions/` | Edge Function iskeletleri ve sözleşmeleri |

## Güvenlik İlkesi

`public` şeması API'ye açık olduğu için kullanıcı verisi içeren tüm tablolarda RLS açıktır. Kullanıcıya ait satırlar `auth.uid()` ile sınırlandırılır; servis rol anahtarı frontend'de kullanılmaz.