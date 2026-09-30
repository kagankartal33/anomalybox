param(
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [switch]$KeepServer
)

$ErrorActionPreference = "Stop"

$batchExternalId = "test_generator_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$outLog = Join-Path $env:TEMP "viralbox-functions-out-$batchExternalId.log"
$errLog = Join-Path $env:TEMP "viralbox-functions-err-$batchExternalId.log"
$server = $null

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [Parameter(Mandatory = $true)]
    [object]$Body
  )

  Invoke-RestMethod `
    -Method Post `
    -Uri $Uri `
    -Headers @{ "x-admin-token" = $AdminToken; "Content-Type" = "application/json" } `
    -Body ($Body | ConvertTo-Json -Depth 60)
}

try {
  $serveCommand = "`$env:ADMIN_API_TOKEN='$AdminToken'; `$env:INTERNAL_API_TOKEN='$AdminToken'; supabase functions serve --no-verify-jwt"
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

  $batch = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches" `
    -Body @{
      external_batch_id = $batchExternalId
      category_slug = "beauty"
      persona_slug = "luxury_editor"
      target_count = 3
      language = "tr"
      platform = "instagram_reels"
      generator_version = "test-1.0.0"
      source_mode = "admin_direct"
    }

  $ideas = @(
    @{
      external_idea_id = "$($batchExternalId)_001"
      title = "Parlak cilt rutininde kimsenin gostermedigi hazirlik dakikasi"
      one_sentence_premise = "Luxury beauty creator, kusursuz finalden onceki gercek hazirlik surtunmesini gosteren guvenli ve premium bir Reels fikri uretir."
      mechanism_ids = @("VIA-132", "VIA-150")
      category_slug = "beauty"
      persona_tags = @("luxury_editor")
      content_style_layers = @("T02", "T08")
      hook_options = @(
        "Bu goruntunun 12 dakika oncesi daha degerliydi.",
        "Final degil hazirlik rutini satiliyor.",
        "Luks gorunen seyin gercek checklisti."
      )
      story_beats = @("final shot", "prep reveal", "boundary note", "payoff")
      idea_card = @{
        concept = "Luks rutin arkasindaki gercek emek"
        format = "reels_30_45"
        beats = @("polished opening", "prep friction", "honest payoff")
      }
      safety_notes = @()
    },
    @{
      external_idea_id = "$($batchExternalId)_002"
      title = "Hangi urunu bugun kullanmayacagini sectiren mini karar agaci"
      one_sentence_premise = "Premium beauty takipcisine urun onermek yerine bugunun cilt baglamina gore neyi pas gececegini secen saveable bir karar agaci sunar."
      mechanism_ids = @("VIA-133", "VIA-148")
      category_slug = "beauty"
      persona_tags = @("luxury_editor")
      content_style_layers = @("T03", "T07")
      hook_options = @(
        "Bugun bu urunu kullanmamak daha iyi olabilir.",
        "Rutin eklemek degil elemek de luks.",
        "Cilt rutininin sessiz karar noktasi."
      )
      story_beats = @("context check", "three filters", "safe recommendation", "save prompt")
      idea_card = @{
        concept = "Karar agaci ile saveable beauty secimi"
        format = "reels_30_45"
        beats = @("wrong product assumption", "decision filter", "clean recommendation")
      }
      safety_notes = @("No medical claim; recommends patch/context caution.")
    },
    @{
      external_idea_id = "$($batchExternalId)_003"
      title = "Internal alan sizdiren kart"
      one_sentence_premise = "Bu fikir importer tarafindan reddedilmeli cunku idea_card icinde internal skor alanlari vardir."
      mechanism_ids = @("VIA-132")
      category_slug = "beauty"
      persona_tags = @("luxury_editor")
      content_style_layers = @("T02")
      hook_options = @("Reject test hook")
      story_beats = @()
      idea_card = @{
        concept = "Bu reject edilmeli"
        score_band = "high"
        internal_rank_score = 99
      }
      safety_notes = @()
    }
  )

  $importResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/import" `
    -Body @{ ideas = $ideas }

  $scoreResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/score" `
    -Body @{}

  $publishResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/publish-inventory" `
    -Body @{ quality_floor = 55; max_reuse_count = 999999 }

  [ordered]@{
    batch_id = $batch.id
    external_batch_id = $batchExternalId
    imported = $importResult.imported
    rejected = $importResult.rejected
    total_rows = $importResult.total_rows
    scored = $scoreResult.scored
    published_inventory = $publishResult.published_inventory
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