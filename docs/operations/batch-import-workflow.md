# Batch Import Workflow

## Preferred Path: Admin Direct

1. Admin panelde kategori sec: `beauty`, `fashion`, `travel`, ...
2. Persona sec: `luxury_editor`, `relatable_lifestyle`, `expert_guide`, ...
3. Target count gir: ornek `1000`.
4. Admin panel `POST /admin/generation-batches` cagirir.
5. Generator direct payload uretir ve `POST /admin/generation-batches/:id/import` cagirir.
6. Admin panel `score` ve `publish-inventory` adimlarini tetikler.

## File Import Path

Generator su klasoru uretir:

```text
generated_batches/
  batch_2026_06_28_beauty_luxury_editor/
    manifest.json
    ideas_0001.jsonl
    ideas_0002.jsonl
    scores.jsonl
    rejected.jsonl
```

### Admin Panel

Admin panelde `manifest.json` secilir. Panel ayni klasordeki `ideas_*.jsonl` dosyalarini okuyup `admin-generation-batches/:id/import` endpointine gonderir.

### Local CLI

```powershell
$env:ADMIN_API_TOKEN = "local-admin-token"
.\tools\import-generated-batch.ps1 `
  -BatchFolder .\generated_batches\batch_2026_06_28_beauty_luxury_editor `
  -Publish
```

Script sirasiyla sunlari yapar:

1. Batch kaydi olusturur.
2. `ideas_*.jsonl` satirlarini import eder.
3. Hatali satirlari `idea_import_errors` tablosuna dusurur.
4. Valid fikirleri skorlar.
5. `-Publish` varsa kaliteyi gecenleri `idea_inventory` stok havuzuna alir.

## Runtime Rule

Uygulama hicbir zaman `generated_batches/` klasorunden fikir okumaz. Dosyalar sadece import ara formatidir; kalici urun verisi Supabase/Postgres tablolaridir.
