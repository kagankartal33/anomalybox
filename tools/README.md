# Tools

## Import Generated Batch

Use this when the generator creates a folder like:

```

### Train From Book-Train Cinema Books

Use this for the `Book-Train/` folder with cinema, editing, sound, film grammar, and screenplay books. This flow extracts text locally but writes only abstract craft observations, raw hashes, features, and metrics to prepared JSONL.

Dry-run:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\prepare-and-train-book-train.ps1
```

Prepare and train:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\prepare-and-train-book-train.ps1 -Apply
```

Prepared output:

```text
dataset/book_train/prepared/book_train_cinema_v1.jsonl
```

The active compile becomes `2026-v7-book-train-cinema`. Creator-facing output must not include book titles, author names, ISBNs, file names, direct quotes, or raw passages.

Train each Book-Train source separately:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-book-train-each-book.ps1 -Apply
```

This writes isolated prepared files under `dataset/book_train/prepared/individual/book01` through `book06`, creates source slugs like `book_train_cinema_book01_v1`, and creates compile versions like `2026-v7-book-train-cinema-book01`. The wrapper reactivates the combined `2026-v7-book-train-cinema` profile at the end unless `-KeepLastBookActive` is passed.

### Train From Book-Train Extended SEO, Marketing, Sentiment And Review Data

Use this for the non-book datasets currently stored under `Book-Train/`: SEO glossary, lead-gen SEO Q&A, SERP rows, Twitter sentiment, and Amazon review polarity data. This flow does not import raw surfaces into creator-facing outputs. It writes abstract SEO, premium web-copy, caption/comment, sentiment, trust, objection-handling, and brand-safety signals.

Train the combined extended profile:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\prepare-and-train-book-train-extended.ps1 -Apply
```

Train each extended source separately:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-book-train-extended-each-source.ps1 -Apply
```

Prepared outputs:

```text
dataset/book_train/prepared/extended/book_train_extended_v1.jsonl
dataset/book_train/prepared/extended/individual/
```

The combined active compile is `2026-v8-book-train-extended`. This profile is intended to keep cinema craft, dataset, Book, HF social, SEO/marketing, sentiment, product-review, and platform research signals available through the active training affinity tables.

Validate the active extended profile:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-dataset-training.ps1 `
  -CompileVersion 2026-v8-book-train-extended `
  -SourceSlug book_train_extended_v1 `
  -TrendSource book_train_extended_v1 `
  -EvalPrefix book_train_extended_eval `
  -ProfileCategories creator_education,lifestyle,product_reviews,entertainment_comedy `
  -MinObservations 1000 `
  -MinDatasetExamples 1000
```

### Generator Training Context

The generator should fetch batch-specific training context before creating/importing ideas. After creating a generation batch, call:

```text
POST /functions/v1/admin-generation-batches/:batchId/training-context
```

Example body:

```json
{
  "limit": 16,
  "trend_limit": 12,
  "eval_limit": 8
}
```

The response contains the active `training_profile_for_scope`, category layer policy, trend signals, and generator eval cases. Treat it as internal prompt/context material only. Do not expose pattern weights, source names, internal policies, training rows, scores, bands, or raw dataset wording to creators.

## Train From Hugging Face Social Datasets

Use this to fetch vetted Hugging Face social datasets into a local JSONL file and train ViralBox with duplicate-free, pattern-only observations:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-huggingface.ps1
```

Dry-run prints the selected sources. Apply fetches rows and activates `2026-v5-hf-social`:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-huggingface.ps1 `
  -MaxRowsPerSource 1000 `
  -IncludeP1 `
  -Apply
```

The importer stores Hugging Face repo/config/split/row ids only in internal metadata. Creator-facing idea cards must not include exact Reddit jokes, confessions, questions, YouTube comments, Instagram captions, usernames, URLs, or dataset names.

Download full vetted Hugging Face parquet files locally:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\download-huggingface-datasets.ps1 -Preset p0
```

`p0` downloads the current high-value text/social sources: Reddit jokes, Reddit questions, Reddit confessions, Reddit TIFU, and YouTube popular video comments. It intentionally skips video/image-heavy TikTok or thumbnail datasets while video training is disabled.

Prepare the downloaded raw files into anti-copy, score-weighted training JSONL and train from that prepared file:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\prepare-and-train-downloaded-hf.ps1 `
  -MaxRowsPerSource 50000 `
  -MaxScanRowsPerSource 250000 `
  -Apply
```

Use `-PrepareOnly` if you only want to create `dataset/huggingface/prepared_downloaded/hf_social_training_v2_prepared.jsonl`. The prepared JSONL hides exact jokes, questions, confessions, TIFU text, titles, comments, URLs, and usernames; it stores only abstract mechanism features plus internal hashes and metrics.text
generated_batches/
  batch_2026_06_28_beauty_luxury_editor/
    manifest.json
    ideas_0001.jsonl
    ideas_0002.jsonl
```

Local example:

```powershell
$env:ADMIN_API_TOKEN = "local-admin-token"
.\\tools\\import-generated-batch.ps1 `
  -BatchFolder .\\generated_batches\\batch_2026_06_28_beauty_luxury_editor `
  -Publish
```

The script creates the batch, imports JSONL rows, scores valid ideas, and optionally publishes approved ideas into `idea_inventory`.

## Build Instagram Category Seed

Use this when `instagram_tum_kategoriler_birlesik.md` or the external Instagram category source changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\build-instagram-category-seed.ps1
supabase db reset
supabase db lint --local
```

The script writes `supabase/seeds/instagram_categories.sql`. The app reads categories only from Postgres, never from this markdown file at runtime.

## Build Real Viral Examples Seed

Use this to rebuild the 1000-row real viral/research training corpus from Wikidata and Wikipedia sources:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\build-real-viral-examples-seed.ps1 -TargetCount 1000
supabase db reset
supabase db lint --local
```

The script writes `supabase/seeds/real_viral_examples.sql`. Rows are real documented viral/meme/challenge/video/trend examples, but the generator must use them as `pattern_only` evidence and never copy their surfaces.

## Test Quality Gate v2.1

Use this to run the premium quality gate stress test:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-quality-gate-v2.ps1
```

The script creates a 1000-row JSONL import, scores it in chunks, writes `idea_quality_checks` plus `idea_claim_evidence`, publishes approved inventory, and runs a `$500` delivery test. It verifies v2.1 fields such as lexical signatures, claim evidence status, category layer policy coverage, and second-opinion counters.

It also cleans stale local Edge Runtime containers before and after the run. If Docker is slow on your machine, reduce chunk pressure without reducing the 1000-row import stress:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-quality-gate-v2.ps1 `
  -IdeaCount 1000 `
  -ScoreChunkSize 15 `
  -PublishChunkSize 75
```

## Test Everything Local

Use this as the local health check after schema, generator, quality gate, training, or container changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-all.ps1
```

The script starts Supabase if needed, applies local migrations, runs `supabase db lint --local`, tests generator import/scoring/publish, runs the Quality Gate v2.1 stress flow, validates the active `2026-v8-book-train-extended` training profile, and removes stale local Edge Runtime containers.
The training validation parameters are configurable; pass another compile/source/trend/eval set if you intentionally want to validate an older profile.

For a faster smoke test:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-all.ps1 -SkipQualityGate
```

## Production Readiness Audit

Use this before production import, Railway deploy, or paid-beta smoke tests:

```powershell
npm run audit:leaks
npm run audit:readiness
```

`audit:leaks` scans creator-facing finalist card fields and public app surfaces for raw generator ids, Quality Gate text, score/band wording, and training-source leaks. `audit:readiness` runs TypeScript, lint, build, Supabase lint, leak scan, and finalist export dry run; add the slower regression scripts when preparing a release.

Expired creator review videos can be checked and removed with:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\cleanup-review-videos.ps1
powershell -ExecutionPolicy Bypass -File .\\tools\\cleanup-review-videos.ps1 -Apply
```

## Retrain Viral Corpus

Use this after adding or rebuilding training examples:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\
etrain-viral-corpus.ps1
```

The script resets the local database, loads all seed files, compiles `viral_training_example_features`, creates the active `2026-v1` training profile, writes pattern affinity rows, runs local lint, and prints validation counts.

## Train From Dataset Folder

Use this to train from every `.md`, `.ipynb`, and `.csv` file under `dataset/` without resetting the database:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-dataset.ps1 `
  -DatasetPath .\\dataset `
  -Apply `
  -CompileVersion 2026-v2-dataset
```

The trainer imports all deduped rows/chunks into `dataset_training_observations`, keeps celebrity/influencer names as internal hashed provenance only, promotes weighted pattern-only examples, writes trend/eval signals, and activates `2026-v2-dataset`.

### Train From Book Folder

Use this to add `C:\\Users\\Kagan\\OneDrive\\Desktop\\Book` as a duplicate-free craft/comedy/story quality layer. This does not treat Book as raw viral trend data; it imports structure, hook, caption, comedy, narrative, visual QA, book launch, and bureaucratic humor signals as internal pattern-only training.

Dry-run first:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-dataset.ps1 `
  -DatasetPath "C:\\Users\\Kagan\\OneDrive\\Desktop\\Book" `
  -Mode book `
  -SourceSlug book_full_training_v1 `
  -CompileVersion 2026-v3-book-dataset
```

Apply:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-dataset.ps1 `
  -DatasetPath "C:\\Users\\Kagan\\OneDrive\\Desktop\\Book" `
  -Mode book `
  -SourceSlug book_full_training_v1 `
  -CompileVersion 2026-v3-book-dataset `
  -Apply
```

The Book importer supports `.md`, `.txt`, `.json`, `.jsonl`, `.sql`, SQLite `.db`, `.docx`, and `.epub` sources. It skips binary/image/build folders, dedupes by normalized content hash, keeps source surfaces internal, and rewrites the `book_full_training_v1` promoted outputs deterministically so repeated applies do not inflate training rows.

Validate the dataset training state:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-dataset-training.ps1
```

The validation checks active compile version, minimum dataset rows, internal table grants, algorithmic dataset titles, and `training_profile_for_scope`.

Validate the Book training state:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\test-dataset-training.ps1 `
  -CompileVersion 2026-v3-book-dataset `
  -SourceSlug book_full_training_v1 `
  -TrendSource book_training_v1 `
  -EvalPrefix book_eval `
  -ProfileCategories "entertainment_comedy","book_launch_content" `
  -MinObservations 50000 `
  -MinDatasetExamples 10000
```

