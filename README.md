# ViralBox / ViralFikirKutusu

ViralBox, Instagram influencer'lari icin onceden uretilmis, skorlanmis ve stoklanmis viral fikir kutulari satan Supabase tabanli bir uygulama taslagidir.

Fikirler satin alma aninda uretilmez. Admin/generator bir kategori + persona icin binlerce fikri batch olarak uretir, sistem bunlari validasyon + scoring pipeline'dan gecirir ve publish edilenleri `idea_inventory` stok havuzuna alir. Influencer kutu satin aldiginda stoktan kendisine fikir atanir; skorlar ve internal bandler gosterilmez.

## Hizli Baslangic

```powershell
supabase start
supabase db reset
```

Studio:

```text
http://127.0.0.1:55323
```

## Ana Akis

```text
Admin: category + persona + target_count secer
Generator: direct payload veya JSONL batch uretir
Importer: valid fikirleri idea_candidates + idea_cards'a yazar
Scorer: idea_scores olusturur
Publisher: kaliteyi gecenleri idea_inventory'ye alir
Buyer: $500 veya $1000 kutu satin alir
Delivery: deliver_idea_box stoktan fikir atar
App: influencer sadece teslim edilen idea_cards'i okur
```

## Box Products

| Urun | Fiyat | Teslim |
|---|---:|---|
| `viral_box_500` | `$500` | 2 fikir: internal `low:1`, `high:1` |
| `premium_viral_box_1000` | `$1000` | 5 fikir: internal `low:2`, `mid:1`, `high:2` |

Internal band ve skor alanlari creator UI'da gosterilmez.

## Dosya Haritasi

| Yol | Amac |
|---|---|
| `ViralFikirKutusu_Viral_Idea_Algorithm_Engine(6).md` | Kanonik urun ve algoritma arsivi |
| `Ultimate_Comedy_Master_System_ZERO_LOSS_MERGED.md` | Komedi algoritma kaynagi; unlu isimleri algoritmik isimlere donusturulmus ana kaynak |
| `docs/architecture/supabase.md` | Supabase tablo, RLS, stok ve delivery mimarisi |
| `docs/algorithms/comedy-remix.md` | Comedy/remix operator mantigi |
| `docs/algorithms/influencer-content-system.md` | Influencer kategori, persona, layer ve kutu modeli |
| `docs/api/contracts.md` | Admin import, scoring, inventory ve delivery API sozlesmeleri |
| `docs/prompts/generate-ideas-system.md` | LLM/generator sistem prompt cekirdegi |
| `docs/operations/local-setup.md` | Yerel Supabase kurulum ve dogrulama |
| `supabase/migrations/` | Supabase schema migration dosyalari |
| `supabase/seed.sql` | Baslangic algoritmalari, kategoriler, personalar, box urunleri |
| `supabase/functions/admin-generation-batches/` | Batch create/import/score/publish Edge Function |
| `supabase/functions/inventory-health/` | Low-stock admin dashboard Edge Function |
| `supabase/functions/deliver-idea-box/` | Odeme sonrasi stoktan fikir atama Edge Function |

## Import Format

```text
generated_batches/
  batch_2026_06_28_beauty_luxury_editor/
    manifest.json
    ideas_0001.jsonl
    ideas_0002.jsonl
    scores.jsonl
    rejected.jsonl
```

Dosyalar kalici urun verisi degildir; sadece import ara formatidir. Uygulama runtime'da dosyadan fikir okumaz.

## Guvenlik Ilkesi

`public` semasi API'ye acik oldugu icin tum kullanici tablolarinda RLS aktiftir. Admin/generator islemleri service role + internal/admin token ile Edge Function tarafinda calisir. Frontend hicbir zaman `service_role` anahtari kullanmaz.