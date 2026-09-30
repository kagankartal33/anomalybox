param(
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [string]$CompileVersion = "2026-v4-media-training",
  [switch]$KeepServer
)

$ErrorActionPreference = "Stop"

$sourceExternalId = "test_media_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$outLog = Join-Path $env:TEMP "viralbox-media-functions-out-$sourceExternalId.log"
$errLog = Join-Path $env:TEMP "viralbox-media-functions-err-$sourceExternalId.log"
$envFile = Join-Path $env:TEMP "viralbox-media-functions-env-$sourceExternalId.env"
$server = $null

function Invoke-DbSql {
  param([Parameter(Mandatory = $true)][string]$Sql)

  $dbContainer = docker ps --format "{{.Names}}" |
    Where-Object { $_ -eq "supabase_db_ViralBox" } |
    Select-Object -First 1

  if (-not $dbContainer) {
    $dbContainer = docker ps --format "{{.Names}}" |
      Where-Object { $_ -like "supabase_db_*" } |
      Select-Object -First 1
  }

  if (-not $dbContainer) {
    throw "Could not find a running Supabase database container. Run supabase start first."
  }

  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c $Sql
}

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][object]$Body
  )

  Invoke-RestMethod `
    -Method Post `
    -Uri $Uri `
    -Headers @{ "x-admin-token" = $AdminToken; "Content-Type" = "application/json" } `
    -Body ($Body | ConvertTo-Json -Depth 80)
}

try {
  $statusEnv = supabase status -o env
  $localServiceRoleKey = ($statusEnv | Select-String -Pattern '^SERVICE_ROLE_KEY="(.+)"$').Matches.Groups[1].Value
  $localApiUrl = ($statusEnv | Select-String -Pattern '^API_URL="(.+)"$').Matches.Groups[1].Value

  if (-not $localServiceRoleKey -or -not $localApiUrl) {
    throw "Could not read local Supabase API_URL/SERVICE_ROLE_KEY from supabase status -o env"
  }

  @(
    "SUPABASE_URL=$localApiUrl",
    "SUPABASE_SERVICE_ROLE_KEY=$localServiceRoleKey",
    "ADMIN_API_TOKEN=$AdminToken",
    "INTERNAL_API_TOKEN=$AdminToken"
  ) | Set-Content -LiteralPath $envFile -Encoding ascii

  $serveCommand = "supabase functions serve --no-verify-jwt --env-file `"$envFile`""
  $server = Start-Process `
    -FilePath "powershell" `
    -ArgumentList @("-NoProfile", "-Command", $serveCommand) `
    -WorkingDirectory (Get-Location) `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog

  Write-Host "Started functions server pid=$($server.Id)"

  $ready = $false
  $lastError = $null
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    if ($server.HasExited) {
      throw "Functions server exited early with code $($server.ExitCode)"
    }
    try {
      Invoke-WebRequest `
        -Uri "$FunctionsBaseUrl/inventory-health" `
        -Headers @{ "x-admin-token" = $AdminToken } `
        -UseBasicParsing `
        -TimeoutSec 3 | Out-Null
      $ready = $true
      break
    } catch {
      $lastError = $_.Exception.Message
    }
  }

  if (-not $ready) {
    throw "Functions server did not become ready. Last probe error: $lastError"
  }

  $source = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-media-training" `
    -Body @{
      external_source_id = $sourceExternalId
      title = "Media training regression source"
      category_slug = "beauty"
      persona_slug = "luxury_editor"
      platform = "instagram_reels"
      language = "tr"
    }

  $assetsResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-media-training/$($source.id)/assets" `
    -Body @{
      assets = @(
        @{
          source_type = "upload"
          storage_path = "training-media/$sourceExternalId/owned-video-source.mp4"
          file_hash = "a21f$sourceExternalId"
          rights_status = "owned"
          training_use = "pattern_only"
          caption = "secret_source_caption_phrase save checklist product close-up calm luxury editor #ad disclosure"
          transcript = "First second product macro then decision filter. Save this checklist and comment your routine context."
          admin_notes = "premium beauty reels; mirror shot; hand sorting; brand safety claim boundary"
          frame_metadata = @{
            sampled_frames = @("0s", "1s", "2s", "9s", "payoff", "cta")
            opening_visual = "product close-up with hand pause"
            setting = "vanity desk"
          }
        },
        @{
          source_type = "instagram_reels_url"
          source_url = "https://www.instagram.com/reel/CODEXYZ/?utm_source=test"
          rights_status = "permissioned"
          training_use = "pattern_only"
          caption = "question hook poll comment desk setup save guide"
          transcript = "A creator asks the audience which routine step they skip and turns answers into a story poll."
          admin_notes = "comment trigger, save utility, split screen, story followup"
        },
        @{
          source_type = "instagram_reels_url"
          source_url = "https://instagram.com/reel/CODEXYZ/"
          rights_status = "permissioned"
          training_use = "pattern_only"
          caption = "duplicate url should not create a second asset"
          transcript = "duplicate url should not create a second asset"
        },
        @{
          source_type = "manual_transcript"
          rights_status = "unknown"
          training_use = "pattern_only"
          caption = "unknown rights public figure celebrity clip should stay in review"
          transcript = "A famous public figure clip with copyrighted audio and no permission."
          admin_notes = "public figure risk, copyrighted audio"
        }
      )
    }

  $analysis = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-media-training/$($source.id)/analyze" `
    -Body @{}

  $promotion = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-media-training/$($source.id)/promote-training" `
    -Body @{ compile_version = $CompileVersion }

  $assertSql = @"
with metrics as (
  select 'media_sources' as metric, count(*)::integer as value
  from public.media_training_sources
  where external_source_id = '$sourceExternalId'
  union all
  select 'media_assets', count(*)::integer
  from public.media_training_assets asset
  join public.media_training_sources source on source.id = asset.source_id
  where source.external_source_id = '$sourceExternalId'
  union all
  select 'media_observations', count(*)::integer
  from public.media_training_observations observation
  join public.media_training_sources source on source.id = observation.source_id
  where source.external_source_id = '$sourceExternalId'
  union all
  select 'promoted_observations', count(*)::integer
  from public.media_training_observations observation
  join public.media_training_sources source on source.id = observation.source_id
  where source.external_source_id = '$sourceExternalId'
    and observation.status = 'promoted'
  union all
  select 'blocked_unknown_rights_promoted', count(*)::integer
  from public.media_training_observations observation
  join public.media_training_sources source on source.id = observation.source_id
  where source.external_source_id = '$sourceExternalId'
    and observation.rights_status = 'unknown'
    and observation.status = 'promoted'
  union all
  select 'review_queue', count(*)::integer
  from public.media_training_review_queue review
  join public.media_training_sources source on source.id = review.source_id
  where source.external_source_id = '$sourceExternalId'
  union all
  select 'dataset_media_observations', count(*)::integer
  from public.dataset_training_observations
  where metadata ->> 'source_slug' = 'media_training_v1'
    and source_kind in ('media_video','media_reels_url','media_transcript')
  union all
  select 'media_examples', count(*)::integer
  from public.viral_training_examples example
  join public.viral_training_sources source on source.id = example.source_id
  where source.slug = 'media_training_v1'
  union all
  select 'media_trend_signals', count(*)::integer
  from public.trend_signals
  where source = 'media_training_v1'
  union all
  select 'media_eval_cases', count(*)::integer
  from public.generator_eval_cases
  where slug like 'media_eval_%'
  union all
  select 'active_compile', count(*)::integer
  from public.viral_training_compilations
  where version = '$CompileVersion'
    and active = true
  union all
  select 'client_grants', count(*)::integer
  from information_schema.role_table_grants
  where grantee in ('anon','authenticated')
    and table_schema = 'public'
    and table_name in (
      'media_training_sources',
      'media_training_assets',
      'media_training_observations',
      'media_training_analysis_runs',
      'media_training_review_queue'
    )
  union all
  select 'creator_facing_media_leaks', count(*)::integer
  from public.viral_training_examples example
  join public.viral_training_sources source on source.id = example.source_id
  where source.slug = 'media_training_v1'
    and (
      example.title ~* '(CODEXYZ|owned-video-source|secret_source_caption_phrase|instagram\.com)'
      or example.abstracted_mechanism ~* '(CODEXYZ|owned-video-source|secret_source_caption_phrase|instagram\.com)'
      or example.reusable_pattern ~* '(CODEXYZ|owned-video-source|secret_source_caption_phrase|instagram\.com)'
    )
)
select * from metrics order by metric;
"@

  $output = Invoke-DbSql -Sql $assertSql
  $text = $output -join "`n"

  function Get-Metric([string]$Name) {
    $line = $output | Where-Object { $_ -match "^\s*$Name\s+\|" } | Select-Object -First 1
    if (-not $line) { throw "Metric not found: $Name`n$text" }
    return [int](($line -split "\|")[1].Trim())
  }

  if ((Get-Metric "media_sources") -ne 1) { throw "Expected one media source" }
  if ((Get-Metric "media_assets") -ne 3) { throw "Expected duplicate URL asset to be skipped" }
  if ((Get-Metric "media_observations") -lt 2) { throw "Expected media observations" }
  if ((Get-Metric "promoted_observations") -lt 2) { throw "Expected approved observations to be promoted" }
  if ((Get-Metric "blocked_unknown_rights_promoted") -ne 0) { throw "Unknown rights media was promoted" }
  if ((Get-Metric "review_queue") -lt 1) { throw "Expected review queue entries for rights/safety risks" }
  if ((Get-Metric "dataset_media_observations") -lt 2) { throw "Expected media observations in dataset training table" }
  if ((Get-Metric "media_examples") -lt 2) { throw "Expected media viral training examples" }
  if ((Get-Metric "media_trend_signals") -lt 2) { throw "Expected media trend signals" }
  if ((Get-Metric "media_eval_cases") -lt 2) { throw "Expected media eval cases" }
  if ((Get-Metric "active_compile") -ne 1) { throw "Expected active compile $CompileVersion" }
  if ((Get-Metric "client_grants") -ne 0) { throw "Media training internal tables are exposed to anon/authenticated" }
  if ((Get-Metric "creator_facing_media_leaks") -ne 0) { throw "Media training examples leak source URL, file name, or exact caption" }

  [ordered]@{
    source_id = $source.id
    external_source_id = $sourceExternalId
    assets_created = $assetsResult.created
    duplicate_assets = $assetsResult.duplicate_assets
    approved_observations = $analysis.approved_observations
    quarantined_observations = $analysis.quarantined_observations
    promoted_observations = $promotion.promoted_observations
    compile_version = $CompileVersion
    metrics = $text
    stdout_log = $outLog
    stderr_log = $errLog
  } | ConvertTo-Json -Depth 20
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if (Test-Path $outLog) {
    Write-Host "STDOUT:"
    Get-Content $outLog -Raw
  }
  if (Test-Path $errLog) {
    Write-Host "STDERR:"
    Get-Content $errLog -Raw
  }
  exit 1
} finally {
  if ($server -and -not $server.HasExited -and -not $KeepServer) {
    Stop-Process -Id $server.Id -Force
  }
}