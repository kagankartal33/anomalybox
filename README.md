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
| `docs/architecture/instagram-category-catalog.md` | Instagram kategori katalogu, kaynaklar ve rebuild akisi |
| `docs/algorithms/comedy-remix.md` | Comedy/remix operator mantigi |
| `docs/algorithms/influencer-content-system.md` | Influencer kategori, persona, layer ve kutu modeli |
| `docs/training/viral-corpus-methodology.md` | 2016-2026 viral corpus egitim akisi ve anti-copy kurallari |
| `docs/training/viral-pattern-taxonomy.md` | Viral pattern aileleri ve generator'a aktarilan dersler |
| `docs/api/contracts.md` | Admin import, scoring, inventory ve delivery API sozlesmeleri |
| `docs/prompts/generate-ideas-system.md` | LLM/generator sistem prompt cekirdegi |
| `docs/operations/local-setup.md` | Yerel Supabase kurulum ve dogrulama |
| `docs/operations/batch-import-workflow.md` | Generator klasorlerinin database'e yuklenme akisi |
| `supabase/migrations/` | Supabase schema migration dosyalari |
| `supabase/seed.sql` | Baslangic algoritmalari, cekirdek kategoriler, personalar, box urunleri |
| `supabase/seeds/instagram_categories.sql` | 1123 satirlik birlesik Instagram kategori katalog seed'i |
| `supabase/seeds/current_platform_research_2026.sql` | Son internet taramasindan gelen 2026 platform research training sinyalleri |
| `supabase/seeds/viral_training_compile.sql` | Ham viral corpus'u compiled training profile ve pattern affinity tablosuna donusturur |
| `supabase/functions/admin-generation-batches/` | Batch create/import/score/publish Edge Function |
| `supabase/functions/inventory-health/` | Low-stock admin dashboard Edge Function |
| `supabase/functions/deliver-idea-box/` | Odeme sonrasi stoktan fikir atama Edge Function |
| `tools/import-generated-batch.ps1` | JSONL batch klasorunu API uzerinden import eden local CLI |
| `tools/build-instagram-category-seed.ps1` | Yerel kategori dosyasi + URL tablosundan Supabase kategori seed'i uretir |
| `tools/build-real-viral-examples-seed.ps1` | Wikidata/Wikipedia'dan 1000 gercek viral ornek training seed'i uretir |
| `tools/retrain-viral-corpus.ps1` | Mevcut orneklerle DB reset + compiled training profile + lint dogrulama akisi |
| `tools/test-quality-gate-v2.ps1` | 1000 JSONL stress import, Quality Gate v2, inventory publish ve delivery testi |

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

## Training / Retrain

Mevcut 1000+ ornekle egitimi tekrar derlemek icin:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\
etrain-viral-corpus.ps1
```

Bu islem `viral_training_example_features`, `viral_training_compilations`, `viral_training_pattern_affinity` ve `admin_configs.training.compiled_profile` kayitlarini yeniden olusturur.

## Guvenlik Ilkesi

`public` semasi API'ye acik oldugu icin tum kullanici tablolarinda RLS aktiftir. Admin/generator islemleri service role + internal/admin token ile Edge Function tarafinda calisir. Frontend hicbir zaman `service_role` anahtari kullanmaz.