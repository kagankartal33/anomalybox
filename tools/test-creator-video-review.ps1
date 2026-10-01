param(
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [switch]$KeepServer
)

$ErrorActionPreference = "Stop"
$toolRoot = Split-Path -Parent $PSCommandPath
. (Join-Path $toolRoot "local-functions.ps1")

$runId = "creator_video_review_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$outLog = Join-Path $env:TEMP "viralbox-cvr-out-$runId.log"
$errLog = Join-Path $env:TEMP "viralbox-cvr-err-$runId.log"
$envFile = Join-Path $env:TEMP "viralbox-cvr-env-$runId.env"
$progressLog = Join-Path $env:TEMP "viralbox-cvr-progress-$runId.log"
$server = $null

function Write-ProgressLog {
  param([Parameter(Mandatory = $true)][string]$Message)
  Add-Content -LiteralPath $progressLog -Encoding ascii -Value ("{0} {1}" -f (Get-Date -Format "HH:mm:ss"), $Message)
}

function Invoke-Json {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [object]$Body = $null,
    [string]$Token = $null,
    [string]$AdminTokenValue = $null,
    [int[]]$ExpectedStatuses = @(200, 201)
  )

  $bodyFile = $null
  try {
    $args = @("-sS", "--max-time", "120", "-X", $Method, "-H", "Content-Type: application/json", "-w", "`n%{http_code}")
    if ($Token) { $args += @("-H", "Authorization: Bearer $Token") }
    if ($AdminTokenValue) { $args += @("-H", "x-admin-token: $AdminTokenValue") }
    if ($null -ne $Body) {
      $bodyFile = Join-Path $env:TEMP ("viralbox-cvr-body-{0}.json" -f ([guid]::NewGuid().ToString("N")))
      $Body | ConvertTo-Json -Depth 100 -Compress | Set-Content -LiteralPath $bodyFile -Encoding ascii -NoNewline
      $args += @("--data-binary", "@$bodyFile")
    }
    $args += $Uri
    $raw = & curl.exe @args
    if ($LASTEXITCODE -ne 0) {
      throw "curl failed with exit code $LASTEXITCODE. Response: $($raw -join "`n")"
    }

    $lines = @($raw)
    $status = [int]$lines[-1]
    $content = if ($lines.Count -gt 1) { $lines[0..($lines.Count - 2)] -join "`n" } else { "" }
    if ($ExpectedStatuses -notcontains $status) {
      throw "HTTP $Method failed for $Uri with status $status. Response: $content"
    }
    if ([string]::IsNullOrWhiteSpace($content)) { return $null }
    return $content | ConvertFrom-Json
  } finally {
    if ($bodyFile -and (Test-Path $bodyFile)) {
      Remove-Item -LiteralPath $bodyFile -Force
    }
  }
}

function Invoke-AuthSignup {
  param(
    [Parameter(Mandatory = $true)][string]$ApiUrl,
    [Parameter(Mandatory = $true)][string]$AnonKey,
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password
  )

  $bodyFile = Join-Path $env:TEMP ("viralbox-cvr-signup-{0}.json" -f ([guid]::NewGuid().ToString("N")))
  try {
    @{ email = $Email; password = $Password } |
      ConvertTo-Json -Compress |
      Set-Content -LiteralPath $bodyFile -Encoding ascii -NoNewline
    $raw = & curl.exe `
      -sS `
      --max-time 30 `
      -X POST `
      -H "apikey: $AnonKey" `
      -H "Content-Type: application/json" `
      --data-binary "@$bodyFile" `
      -w "`n%{http_code}" `
      "$ApiUrl/auth/v1/signup"
    if ($LASTEXITCODE -ne 0) {
      throw "Auth signup curl failed with exit code $LASTEXITCODE. Response: $($raw -join "`n")"
    }

    $lines = @($raw)
    $status = [int]$lines[-1]
    $content = if ($lines.Count -gt 1) { $lines[0..($lines.Count - 2)] -join "`n" } else { "" }
    if ($status -lt 200 -or $status -ge 300) {
      throw "Auth signup failed with status $status. Response: $content"
    }
    return $content | ConvertFrom-Json
  } finally {
    if (Test-Path $bodyFile) {
      Remove-Item -LiteralPath $bodyFile -Force
    }
  }
}

function Assert-True {
  param(
    [Parameter(Mandatory = $true)][bool]$Condition,
    [Parameter(Mandatory = $true)][string]$Message
  )
  if (-not $Condition) { throw $Message }
}

function New-ChecksFromTemplate {
  param(
    [Parameter(Mandatory = $true)]$Template,
    [string]$MissingKey = ""
  )

  $checks = @()
  foreach ($item in @($Template)) {
    $status = "pass"
    $advice = $null
    if ($item.check_key -eq $MissingKey) {
      $status = "missing"
      $advice = "Ilk saniyede karttaki gorsel hook daha net uygulanmali."
    }
    $checks += @{
      check_key = $item.check_key
      status = $status
      evidence_summary = if ($status -eq "pass") { "Admin videoda bu maddeyi uygun gordu." } else { "Admin bu maddeyi eksik gordu." }
      revision_advice = $advice
      admin_private_note = "internal-only-$($item.check_key)"
    }
  }
  return $checks
}

try {
  Write-ProgressLog "start"
  if (-not $KeepServer) {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }

  $statusEnv = & cmd /c "supabase status -o env 2>nul"
  $localServiceRoleKey = ($statusEnv | Select-String -Pattern '^SERVICE_ROLE_KEY="(.+)"$').Matches.Groups[1].Value
  $localAnonKey = ($statusEnv | Select-String -Pattern '^ANON_KEY="(.+)"$').Matches.Groups[1].Value
  $localApiUrl = ($statusEnv | Select-String -Pattern '^API_URL="(.+)"$').Matches.Groups[1].Value
  if (-not $localServiceRoleKey -or -not $localAnonKey -or -not $localApiUrl) {
    throw "Could not read local Supabase API_URL/ANON_KEY/SERVICE_ROLE_KEY from supabase status -o env"
  }

  $email = "creator-video-review-$runId@example.test"
  $signup = Invoke-AuthSignup -ApiUrl $localApiUrl -AnonKey $localAnonKey -Email $email -Password "Password123!"
  $token = $signup.access_token
  $userId = $signup.user.id
  if (-not $token -or -not $userId) { throw "Auth signup did not return access_token/user.id" }
  Write-ProgressLog "signed up user $userId"

  $ideaId = [guid]::NewGuid().ToString()
  $inventoryId = [guid]::NewGuid().ToString()
  $deliveryId = [guid]::NewGuid().ToString()
  $deliveryItemId = [guid]::NewGuid().ToString()

  $card = @{
    brand_lift_statement = "Creator'i sadece urun gosteren degil, karar standardi olan premium editor gibi konumlandirir."
    creator_presence_mode = @{ mode = "Editorial Insider"; delivery_style = "Sakin ve secici."; why_it_fits_creator = "Karar kalitesini one cikarir."; avoid = "Agresif satis dili." }
    atmosphere_direction = @{ mood = "Quiet premium"; visual_texture = "Clean close-up"; color_language = "Soft neutral"; soundscape = "Net voiceover." }
    strategic_value = @{ brand_equity = "Guvenilir zevk filtresi."; audience_aftertaste = "Daha akilli karar hissi."; partnership_signal = "Dusuk baskili marka entegrasyonu." }
    hook_performance_pack = @{
      first_second_visual_hook = "Finished look hard-cuts to messy prep table."
      first_line_hook = "Finalden onceki karar daha degerli."
      hook_options = @("Finalden onceki karar daha degerli.", "Bu goruntunun arkasinda uc karar var.", "Luks gorunen sey eleme kalitesi.")
    }
    video_blueprint = @{ duration_seconds = 34; opening_visual = "Final shot, then decision table."; scene_arc = "Hook -> proof -> payoff." }
    scene_script = @(
      @{ second = "0-3"; purpose = "attention"; voiceover = "Finalden onceki karar daha degerli."; on_screen_text = "Final degil karar" },
      @{ second = "4-10"; purpose = "trust"; voiceover = "Bugunku baglama gore seciyorum."; on_screen_text = "Baglam + sinir" },
      @{ second = "11-25"; purpose = "payoff"; voiceover = "Kaydetmek istersen filtre bu."; on_screen_text = "Kaydet" }
    )
    shot_list = @(
      @{ second = "0-2"; shot = "Tight face close-up"; action = "Look at lens." },
      @{ second = "3-8"; shot = "Overhead table"; action = "Sort options." },
      @{ second = "9-20"; shot = "Checklist close-up"; action = "Show three-step filter." }
    )
    b_roll_plan = @(
      @{ type = "product_closeup"; shot = "Small amount on fingertip." },
      @{ type = "hand_movement"; shot = "Slow cap close." }
    )
    pose_direction = @{ face = "Sakin editorial ifade."; hands = "Yavas secim hareketleri."; body = "Rahat omuz."; expression = "Kucuk bilen gulumseme." }
    micro_behavior_guide = @{ facial_expression = "Sakin guven."; eye_contact = "Hook ve payoff'ta kameraya bak."; product_handling = "Urunu dusuk ve sakin tut."; avoid_over_advertising = "Acil satin alma dili kullanma." }
    camera_direction = @{ framing = "Close-up, overhead, medium frame."; movement = "Ilk saniye sert cut, sonra stabil."; lighting = "Dogal yan isik." }
    editing_timeline = @(
      @{ second = "0-2"; beat = "pattern_interrupt"; edit = "Finalden karar masasina cut." },
      @{ second = "3-8"; beat = "premise"; edit = "Karar filtresi kurulur." },
      @{ second = "9-20"; beat = "proof_turn"; edit = "Baglam ve sinir gosterilir." },
      @{ second = "last_3"; beat = "save_comment_cta"; edit = "Checklist tutulur." }
    )
    editing_notes = @{ pacing = "Ilk 2 saniye hizli, proof bolumu sakin."; sound = "Soft premium bed." }
    caption_pack = @{ caption_options = @("Finalden onceki karar daha onemli.", "Luks bazen eleme kalitesidir."); on_screen_text = @("Final degil karar", "Kaydet") }
    comment_engine = @{ pinned_comment = "Siz bu kararda neyi elerdiniz?"; audience_question = "Bu konuda en zor karar hangisi?"; reply_strategy = "En iyi yorumlari story poll'a cevir." }
    story_followup = @{ poll_question = "Bu kararda hangisi daha zor?"; poll_options = @("Secmek", "Elemek") }
    brand_safety = @{ disclosure_text = "Sponsorluysa #ad / reklam is birligi belirt."; claim_boundary = "Kisisel deneyim ve baglam."; do_not_say = @("Kesin cozum", "Herkeste calisir") }
  }
  $cardJson = ($card | ConvertTo-Json -Depth 100 -Compress).Replace("'", "''")
  $externalIdeaId = "$runId`_idea"

  $fixtureSql = @"
insert into public.profiles (id, display_name, role, plan, locale)
values ('$userId', 'Creator Video Review Test', 'creator', 'premium', 'tr-TR')
on conflict (id) do update set display_name = excluded.display_name, role = excluded.role, plan = excluded.plan, updated_at = now();

insert into public.categories (slug, name, family, risk_level, enabled)
values ('beauty', 'Beauty', 'creator_content', 'medium', true)
on conflict (slug) do update set enabled = true, updated_at = now();

insert into public.creator_personas (slug, name, description, tags, enabled)
values ('luxury_editor', 'Luxury Editor', 'Premium editorial creator mode', array['premium','editorial']::text[], true)
on conflict (slug) do update set enabled = true, updated_at = now();

insert into public.box_products (slug, name, price_usd_cents, idea_count, allocation, enabled)
values ('viral_box_500', '$500 Viral Box', 50000, 2, '{"low":1,"high":1}'::jsonb, true)
on conflict (slug) do update set enabled = true, updated_at = now();

insert into public.idea_candidates (
  id, user_id, platform, format, language, locale, title, one_sentence_premise, mechanism_ids, hook_options, story_beats,
  production_requirements, safety_status, perspective_prism_status, confidence_band, status, external_idea_id, category_id,
  persona_id, content_style_layers, candidate_source
) values (
  '$ideaId', '$userId', 'instagram_reels', 'reels_35s', 'tr', 'TR', 'Creator manual review fixture idea',
  'Creator uploads video attempts and receives manual admin checklist feedback.',
  array['VIA-TEST']::text[], '["Finalden onceki karar daha degerli."]'::jsonb, '["hook","proof","payoff"]'::jsonb,
  '{"equipment":["phone","tripod"]}'::jsonb, 'SAFE', 'PASS', 'HIGH', 'published', '$externalIdeaId',
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas where slug = 'luxury_editor'),
  array['premium_video_blueprint']::text[], 'admin_direct'
);

insert into public.idea_cards (idea_id, title, card)
values ('$ideaId', 'Creator manual review fixture card', '$cardJson'::jsonb)
on conflict (idea_id) do update set card = excluded.card, updated_at = now();

insert into public.idea_inventory (
  id, idea_id, category_id, persona_id, platform, language, content_style_layers, internal_rank_score, score_band, quality_floor_passed, status, reuse_count, max_reuse_count, metadata
) values (
  '$inventoryId', '$ideaId',
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas where slug = 'luxury_editor'),
  'instagram_reels', 'tr', array['premium_video_blueprint']::text[], 91, 'high', true, 'retired', 1, 1, '{"test":"creator_video_review"}'::jsonb
);

insert into public.idea_box_deliveries (
  id, user_id, box_product_id, category_id, persona_id, status, allocation, delivered_at
) values (
  '$deliveryId', '$userId',
  (select id from public.box_products where slug = 'viral_box_500'),
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas where slug = 'luxury_editor'),
  'delivered', '{"high":1}'::jsonb, now()
);

insert into public.idea_box_items (
  id, delivery_id, user_id, inventory_id, idea_id, slot_index, assigned_band
) values (
  '$deliveryItemId', '$deliveryId', '$userId', '$inventoryId', '$ideaId', 1, 'high'
);
"@

  $fixtureFile = Join-Path $env:TEMP "viralbox-cvr-fixture-$runId.sql"
  $fixtureSql | Set-Content -LiteralPath $fixtureFile -Encoding ascii
  Get-Content -LiteralPath $fixtureFile -Raw |
    docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - | Out-Null
  Remove-Item -LiteralPath $fixtureFile -Force
  Write-ProgressLog "fixture inserted"

  @(
    "SUPABASE_URL=$localApiUrl",
    "SUPABASE_SERVICE_ROLE_KEY=$localServiceRoleKey",
    "LOCAL_SUPABASE_URL=http://supabase_kong_ViralBox:8000",
    "LOCAL_SUPABASE_SERVICE_ROLE_KEY=$localServiceRoleKey",
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
      throw "Functions server exited early with code $($server.ExitCode). Error log: $(Get-Content -LiteralPath $errLog -Raw)"
    }
    try {
      Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews" -Token $token | Out-Null
      $ready = $true
      break
    } catch {
      $lastError = $_.Exception.Message
    }
  }
  if (-not $ready) { throw "Functions server did not become ready. Last probe error: $lastError" }
  Write-ProgressLog "functions ready"

  $created = Invoke-Json `
    -Method "POST" `
    -Uri "$FunctionsBaseUrl/creator-video-reviews" `
    -Token $token `
    -Body @{
      delivery_item_id = $deliveryItemId
      original_filename = "attempt-one.mp4"
      mime_type = "video/mp4"
      file_size_bytes = 4200000
      caption = "#ad Finalden onceki karar daha onemli."
      video_metadata = @{ duration_seconds = 34; width = 1080; height = 1920; has_audio = $true }
    }

  Assert-True ($created.review.status -eq "pending_upload") "Review should start as pending_upload"
  Assert-True ($created.attempt.status -eq "pending_upload") "Attempt should start as pending_upload"
  Assert-True ($created.upload.path -like "$userId/*/$($created.attempt.id)/*") "Upload path should include user/review/attempt"
  Assert-True (-not ($created.review.PSObject.Properties.Name -contains "admin_private_notes")) "Create leaked admin_private_notes"
  $reviewId = $created.review.id
  $attemptId = $created.attempt.id
  Write-ProgressLog "created review $reviewId attempt $attemptId"

  $submitted = Invoke-Json `
    -Method "POST" `
    -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId/attempts/$attemptId/submit" `
    -Token $token `
    -Body @{ caption = "#ad Finalden onceki karar daha onemli."; transcript = "Finalden onceki karar daha degerli." }
  Assert-True ($submitted.review.status -eq "under_review") "Submit should move review to under_review"
  Assert-True ($submitted.attempt.status -eq "under_review") "Submit should move attempt to under_review"
  Write-ProgressLog "submitted attempt"

  $creatorDetail = Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId" -Token $token
  Assert-True ($creatorDetail.card_sections.Count -eq 2) "Creator should receive only execution-safe card sections"
  $sceneSections = @($creatorDetail.card_sections | Where-Object { $_.key -eq "scene_flow" })
  Assert-True ($sceneSections[0].checklist_items.Count -gt 0) "Scene Flow section should include checklist items"
  $creatorHiddenSections = @($creatorDetail.card_sections | Where-Object { $_.key -in @("caption_comment", "brand_lift", "brand_safety") })
  Assert-True ($creatorHiddenSections.Count -eq 0) "Creator detail leaked admin-only card sections"
  Write-ProgressLog "creator detail ok"

  $queue = Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews/admin" -AdminTokenValue $AdminToken
  Write-ProgressLog ("admin queue raw {0}" -f ($queue | ConvertTo-Json -Depth 20 -Compress))
  Assert-True (@($queue.attempts | Where-Object { $_.id -eq $attemptId }).Count -eq 1) "Admin queue should include under_review attempt"
  Write-ProgressLog "admin queue ok"

  $adminDetail = Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews/admin/creator-video-reviews/$reviewId" -AdminTokenValue $AdminToken
  Assert-True ($adminDetail.admin_review_guide.sections.Count -eq 7) "Admin detail should include review guide sections"
  Assert-True ($adminDetail.checklist_template.Count -gt 8) "Admin detail should include checklist template"
  Write-ProgressLog "admin detail ok"
  $missingKey = $adminDetail.checklist_template[0].check_key
  $revisionChecks = New-ChecksFromTemplate -Template $adminDetail.checklist_template -MissingKey $missingKey

  $revision = Invoke-Json `
    -Method "POST" `
    -Uri "$FunctionsBaseUrl/creator-video-reviews/admin/creator-video-reviews/$reviewId/attempts/$attemptId/manual-review" `
    -AdminTokenValue $AdminToken `
    -Body @{
      final_decision = "minor_revisions"
      overall_feedback = "Ilk saniyedeki hook daha netlestirilmeli; diger bolumler genel olarak iyi."
      admin_private_notes = "internal dashboard note"
      checks = $revisionChecks
    }
  Assert-True ($revision.review.status -eq "revision_requested") "Minor revisions should move review to revision_requested"
  Assert-True (-not ($revision.review.PSObject.Properties.Name -contains "admin_private_notes")) "Admin private note leaked in admin save response"
  Write-ProgressLog "revision saved"

  $afterRevision = Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId" -Token $token
  Assert-True ($afterRevision.review.status -eq "revision_requested") "Creator should see revision_requested"
  Assert-True ($afterRevision.review.creator_report.overall_feedback -like "*hook*") "Creator should see admin feedback"
  Assert-True (-not ($afterRevision.review.PSObject.Properties.Name -contains "admin_private_notes")) "Creator detail leaked admin_private_notes"
  Assert-True (@($afterRevision.checks | Where-Object { $_.status -eq "missing" }).Count -ge 1) "Creator should see missing checklist item"
  Write-ProgressLog "creator revision visible"

  $second = Invoke-Json `
    -Method "POST" `
    -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId/attempts" `
    -Token $token `
    -Body @{
      original_filename = "attempt-two.mp4"
      mime_type = "video/mp4"
      file_size_bytes = 4300000
      caption = "#ad Finalden onceki karar daha net."
      video_metadata = @{ duration_seconds = 36; width = 1080; height = 1920; has_audio = $true }
    }
  Assert-True ($second.attempt.attempt_number -eq 2) "Second upload should be attempt 2"
  $secondAttemptId = $second.attempt.id
  Invoke-Json -Method "POST" -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId/attempts/$secondAttemptId/submit" -Token $token -Body @{ caption = "#ad Finalden onceki karar daha net." } | Out-Null
  Write-ProgressLog "second attempt submitted $secondAttemptId"

  $adminDetail2 = Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews/admin/creator-video-reviews/$reviewId" -AdminTokenValue $AdminToken
  $passChecks = New-ChecksFromTemplate -Template $adminDetail2.checklist_template
  $approved = Invoke-Json `
    -Method "POST" `
    -Uri "$FunctionsBaseUrl/creator-video-reviews/admin/creator-video-reviews/$reviewId/attempts/$secondAttemptId/manual-review" `
    -AdminTokenValue $AdminToken `
    -Body @{
      final_decision = "ready_to_post"
      overall_feedback = "Checklist tamam; video paylasima hazir."
      admin_private_notes = "final internal note"
      checks = $passChecks
    }
  Assert-True ($approved.review.status -eq "ready_to_post") "All required checks should allow ready_to_post"
  Write-ProgressLog "approved ready_to_post"

  $analyzeGone = Invoke-Json -Method "POST" -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId/analyze" -Token $token -Body @{} -ExpectedStatuses @(410)
  Assert-True ($analyzeGone.error -like "*disabled*") "Analyze endpoint should be disabled"
  Write-ProgressLog "analyze disabled ok"

  $finalCreator = Invoke-Json -Method "GET" -Uri "$FunctionsBaseUrl/creator-video-reviews/$reviewId" -Token $token
  Assert-True ($finalCreator.attempts.Count -eq 2) "Attempt history should be preserved"
  Assert-True ($finalCreator.review.status -eq "ready_to_post") "Creator should see ready_to_post"
  Assert-True (-not ($finalCreator.checks[0].PSObject.Properties.Name -contains "internal_evidence")) "Creator checks leaked internal_evidence"
  Assert-True (-not ($finalCreator.checks[0].PSObject.Properties.Name -contains "confidence")) "Creator checks leaked confidence"

  $trainingLeakSql = "select count(*) from public.dataset_training_observations where source_path ilike '%$reviewId%' or metadata::text ilike '%$reviewId%';"
  $trainingLeakCount = (& docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -t -A -c $trainingLeakSql).Trim()
  Assert-True ([int]$trainingLeakCount -eq 0) "Creator review leaked into training observations"
  Write-ProgressLog "training leak ok"

  Write-Host "Manual creator video review test passed. ReviewId=$reviewId Attempts=2 FinalStatus=$($finalCreator.review.status)"
} catch {
  Write-ProgressLog ("ERROR: {0}" -f $_.Exception.Message)
  Write-ProgressLog ($_.ScriptStackTrace | Out-String)
  throw
} finally {
  if ($server -and -not $server.HasExited -and -not $KeepServer) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
  if (-not $KeepServer) {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }
  if (Test-Path $envFile) {
    Remove-Item -LiteralPath $envFile -Force
  }
}