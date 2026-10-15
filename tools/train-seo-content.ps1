<#
.SYNOPSIS
  SEO Content Training Pipeline — One-command training for SEO knowledge.

.DESCRIPTION
  Extracts SEO knowledge from books and datasets, imports into Supabase,
  and creates a training compilation.

  Prerequisites:
    - Docker running with Supabase containers (supabase start)
    - Python 3.10+ with pdfplumber, pypdf (pip install pdfplumber pypdf)
    - Content directory with SEO books

.PARAMETER ContentDir
  Path to the directory containing SEO books (PDF/EPUB/AZW3).
  Default: C:\Users\Kagan\OneDrive\Desktop\Content

.PARAMETER CompileVersion
  Version tag for this training compilation (lowercase kebab-case).
  Default: 2026-v1-seo-content

.PARAMETER Apply
  If specified, actually imports data into Supabase. Without this flag,
  only the extraction/preparation step runs (dry run for DB import).

.PARAMETER DryRun
  If specified, skips the extraction step too — only prints what would happen.

.PARAMETER SkipExtraction
  If specified, skips the extraction step and only imports from existing
  prepared JSONL files.

.EXAMPLE
  # Full pipeline: extract + import
  powershell -ExecutionPolicy Bypass -File .\tools\train-seo-content.ps1 -Apply

  # Extract only (no DB import)
  powershell -ExecutionPolicy Bypass -File .\tools\train-seo-content.ps1

  # Import from existing prepared files
  powershell -ExecutionPolicy Bypass -File .\tools\train-seo-content.ps1 -SkipExtraction -Apply
#>
param(
    [string]$ContentDir = "C:\Users\Kagan\OneDrive\Desktop\Content",
    [string]$CompileVersion = "2026-v1-seo-content",
    [switch]$Apply,
    [switch]$DryRun,
    [switch]$SkipExtraction
)

$ErrorActionPreference = "Stop"

$ARCHIVE = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive"
$PREPARED = Join-Path $ARCHIVE "dataset\seo_content\prepared"
$TOOLS = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT = Split-Path -Parent $TOOLS

# ─────────────────────────────────────────────────────────────
# 1. Check prerequisites
# ─────────────────────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SEO CONTENT TRAINING PIPELINE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "  Content Dir:      $ContentDir" -ForegroundColor Gray
Write-Host "  Compile Version:  $CompileVersion" -ForegroundColor Gray
Write-Host "  Apply:            $Apply" -ForegroundColor Gray
Write-Host "  Dry Run:          $DryRun" -ForegroundColor Gray
Write-Host "  Skip Extraction:  $SkipExtraction`n" -ForegroundColor Gray

# Check Docker
Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
try {
    $containers = docker ps --format "{{.Names}}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    $dbContainer = $containers | Where-Object { $_ -match "supabase_db" } | Select-Object -First 1
    if (-not $dbContainer) {
        Write-Host "  ⚠ Supabase DB container not found. Run 'npx supabase start' first." -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Found DB container: $dbContainer" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "🐍 Checking Python..." -ForegroundColor Yellow
try {
    $pyVersion = python --version 2>&1
    Write-Host "  ✓ $pyVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Python not found in PATH." -ForegroundColor Red
    exit 1
}

# Check Content directory
if (-not (Test-Path $ContentDir)) {
    Write-Host "  ⚠ Content directory not found: $ContentDir" -ForegroundColor Red
    exit 1
}
$bookCount = (Get-ChildItem $ContentDir -File | Where-Object { $_.Extension -in ".pdf", ".epub", ".azw3" }).Count
Write-Host "📚 Found $bookCount books in Content directory" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# 2. Extract (prepare JSONL files)
# ─────────────────────────────────────────────────────────────
if (-not $SkipExtraction) {
    Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  STEP 1: EXTRACTION" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

    $extractArgs = @(
        (Join-Path $TOOLS "prepare-seo-content-training.py"),
        "--content-dir", $ContentDir,
        "--output-dir", $PREPARED
    )
    if ($DryRun) {
        $extractArgs += "--dry-run"
    }

    Write-Host "Running extraction..." -ForegroundColor Yellow
    python @extractArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠ Extraction failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Extraction complete" -ForegroundColor Green
} else {
    Write-Host "`n⏩ Skipping extraction (using existing prepared files)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────
# 3. Import into Supabase
# ─────────────────────────────────────────────────────────────
if ($Apply -and -not $DryRun) {
    Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  STEP 2: SUPABASE IMPORT" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

    # Helper function to run SQL via Docker
    function Invoke-SQL {
        param([string]$SQL)
        $SQL | docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠ SQL execution failed!" -ForegroundColor Red
            throw "SQL error"
        }
    }

    # 3a. Import SEO Observations
    $obsFile = Join-Path $PREPARED "seo_observations.jsonl"
    if (Test-Path $obsFile) {
        Write-Host "📖 Importing SEO observations..." -ForegroundColor Yellow
        $obsLines = Get-Content $obsFile -Encoding UTF8
        $batchSize = 100
        $imported = 0

        for ($i = 0; $i -lt $obsLines.Count; $i += $batchSize) {
            $batch = $obsLines[$i..([Math]::Min($i + $batchSize - 1, $obsLines.Count - 1))]
            $values = @()

            foreach ($line in $batch) {
                if (-not $line.Trim()) { continue }
                $obs = $line | ConvertFrom-Json

                $hash = $obs.content_hash -replace "'", "''"
                $book = $obs.source_book -replace "'", "''"
                $chapter = if ($obs.source_chapter) { "'$($obs.source_chapter -replace "'", "''")'" } else { "null" }
                $page = if ($obs.source_page) { $obs.source_page } else { "null" }
                $layer = $obs.seo_layer -replace "'", "''"
                $catSlug = if ($obs.category_slug) { "'$($obs.category_slug -replace "'", "''")'" } else { "null" }
                $locale = $obs.locale -replace "'", "''"
                $title = ($obs.title_algorithmic -replace "'", "''").Substring(0, [Math]::Min(200, $obs.title_algorithmic.Length))
                $textSig = ($obs.text_signals | ConvertTo-Json -Compress -Depth 10) -replace "'", "''"
                $metricSig = ($obs.metric_signals | ConvertTo-Json -Compress -Depth 10) -replace "'", "''"
                $concepts = "array[" + (($obs.derived_concepts | ForEach-Object { "'$($_ -replace "'", "''")'" }) -join ",") + "]::text[]"
                $weight = $obs.training_weight
                $use = $obs.training_use -replace "'", "''"
                $risk = $obs.risk_level -replace "'", "''"
                $meta = ($obs.metadata | ConvertTo-Json -Compress -Depth 10) -replace "'", "''"

                $values += @"
('$hash','$book',$chapter,$page,'$layer',$catSlug,'$locale','$title','$textSig'::jsonb,'$metricSig'::jsonb,$concepts,$weight,'$use','$risk','$meta'::jsonb)
"@
            }

            if ($values.Count -gt 0) {
                $sql = @"
INSERT INTO public.seo_training_observations
  (content_hash, source_book, source_chapter, source_page, seo_layer, category_slug,
   locale, title_algorithmic, text_signals, metric_signals, derived_concepts,
   training_weight, training_use, risk_level, metadata)
VALUES
$($values -join ",`n")
ON CONFLICT (content_hash) DO NOTHING;
"@
                Invoke-SQL $sql
                $imported += $values.Count
            }
        }
        Write-Host "  ✓ Imported $imported observations" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Observations file not found: $obsFile" -ForegroundColor Red
    }

    # 3b. Import Glossary
    $glsFile = Join-Path $PREPARED "seo_glossary.jsonl"
    if (Test-Path $glsFile) {
        Write-Host "📚 Importing glossary..." -ForegroundColor Yellow
        $glsLines = Get-Content $glsFile -Encoding UTF8
        $imported = 0

        for ($i = 0; $i -lt $glsLines.Count; $i += $batchSize) {
            $batch = $glsLines[$i..([Math]::Min($i + $batchSize - 1, $glsLines.Count - 1))]
            $values = @()

            foreach ($line in $batch) {
                if (-not $line.Trim()) { continue }
                $g = $line | ConvertFrom-Json

                $term = $g.term -replace "'", "''"
                $def = $g.definition -replace "'", "''"
                $cat = $g.category -replace "'", "''"
                $imp = $g.importance -replace "'", "''"
                $related = "array[" + (($g.related_terms | ForEach-Object { "'$($_ -replace "'", "''")'" }) -join ",") + "]::text[]"

                $values += "('$term','$def','$cat','$imp',$related)"
            }

            if ($values.Count -gt 0) {
                $sql = @"
INSERT INTO public.seo_glossary (term, definition, category, importance, related_terms)
VALUES
$($values -join ",`n")
ON CONFLICT (term) DO NOTHING;
"@
                Invoke-SQL $sql
                $imported += $values.Count
            }
        }
        Write-Host "  ✓ Imported $imported glossary terms" -ForegroundColor Green
    }

    # 3c. Import Q&A Bank
    $qaFile = Join-Path $PREPARED "seo_qa_bank.jsonl"
    if (Test-Path $qaFile) {
        Write-Host "❓ Importing Q&A bank..." -ForegroundColor Yellow
        $qaLines = Get-Content $qaFile -Encoding UTF8
        $imported = 0

        for ($i = 0; $i -lt $qaLines.Count; $i += $batchSize) {
            $batch = $qaLines[$i..([Math]::Min($i + $batchSize - 1, $qaLines.Count - 1))]
            $values = @()

            foreach ($line in $batch) {
                if (-not $line.Trim()) { continue }
                $q = $line | ConvertFrom-Json

                $question = $q.question -replace "'", "''"
                $answer = $q.answer -replace "'", "''"
                $keywords = "array[" + (($q.keywords | ForEach-Object { "'$($_ -replace "'", "''")'" }) -join ",") + "]::text[]"
                $sourceUrl = if ($q.source_url) { "'$($q.source_url -replace "'", "''")'" } else { "null" }
                $layer = if ($q.seo_layer) { "'$($q.seo_layer -replace "'", "''")'" } else { "null" }
                $weight = $q.training_weight

                $values += "('$question','$answer',$keywords,$sourceUrl,$layer,$weight)"
            }

            if ($values.Count -gt 0) {
                $sql = @"
INSERT INTO public.seo_qa_bank (question, answer, keywords, source_url, seo_layer, training_weight)
VALUES
$($values -join ",`n")
ON CONFLICT DO NOTHING;
"@
                Invoke-SQL $sql
                $imported += $values.Count
            }
        }
        Write-Host "  [+] Imported $imported QA pairs" -ForegroundColor Green
    }

    # 3d. Create compilation record
    Write-Host "`n📊 Creating compilation record..." -ForegroundColor Yellow

    $compileSQL = @"
INSERT INTO public.seo_training_compilations (version, observation_count, glossary_count, qa_count, rule_count, layer_distribution, source_distribution, active)
SELECT
  '$CompileVersion',
  (SELECT count(*) FROM public.seo_training_observations),
  (SELECT count(*) FROM public.seo_glossary),
  (SELECT count(*) FROM public.seo_qa_bank),
  (SELECT count(*) FROM public.seo_content_rules WHERE enabled),
  (SELECT coalesce(jsonb_object_agg(seo_layer, cnt), '{}'::jsonb) FROM (SELECT seo_layer, count(*) as cnt FROM public.seo_training_observations GROUP BY seo_layer) x),
  (SELECT coalesce(jsonb_object_agg(source_book, cnt), '{}'::jsonb) FROM (SELECT source_book, count(*) as cnt FROM public.seo_training_observations GROUP BY source_book) x),
  true
ON CONFLICT (version) DO UPDATE SET
  observation_count = excluded.observation_count,
  glossary_count = excluded.glossary_count,
  qa_count = excluded.qa_count,
  rule_count = excluded.rule_count,
  layer_distribution = excluded.layer_distribution,
  source_distribution = excluded.source_distribution,
  updated_at = now();
"@
    Invoke-SQL $compileSQL
    Write-Host "  ✓ Compilation '$CompileVersion' created" -ForegroundColor Green

    # ─────────────────────────────────────────────────────────────
    # 4. Quality Report
    # ─────────────────────────────────────────────────────────────
    Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  QUALITY REPORT" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

    $reportSQL = @"
SELECT '--- OBSERVATIONS ---' as section;
SELECT seo_layer, count(*) as count, round(avg(training_weight)::numeric, 4) as avg_weight
FROM public.seo_training_observations GROUP BY seo_layer ORDER BY count DESC;

SELECT '--- GLOSSARY ---' as section;
SELECT category, count(*) as count FROM public.seo_glossary GROUP BY category ORDER BY count DESC;

SELECT '--- Q&A BANK ---' as section;
SELECT coalesce(seo_layer, 'unclassified') as seo_layer, count(*) as count
FROM public.seo_qa_bank GROUP BY seo_layer ORDER BY count DESC;

SELECT '--- RULES ---' as section;
SELECT seo_layer, count(*) as count FROM public.seo_content_rules WHERE enabled GROUP BY seo_layer ORDER BY count DESC;

SELECT '--- COMPILATION ---' as section;
SELECT version, observation_count, glossary_count, qa_count, rule_count, active
FROM public.seo_training_compilations ORDER BY created_at DESC LIMIT 3;
"@
    Invoke-SQL $reportSQL

} elseif (-not $Apply) {
    Write-Host "`n⚠ Use -Apply flag to import data into Supabase." -ForegroundColor Yellow
    Write-Host "  Without -Apply, only the extraction step runs." -ForegroundColor Gray
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ SEO CONTENT TRAINING PIPELINE COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Green
