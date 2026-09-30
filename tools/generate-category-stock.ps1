param(
  [int]$CardsPerCategory = 100,
  [string]$PersonaSlug = "",
  [string[]]$CategorySlugs = @(),
  [int]$LimitCategories = 0,
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [int]$QualityFloor = 45,
  [int]$MaxReuseCount = 999999,
  [int]$ScoreChunkSize = 100,
  [int]$PublishChunkSize = 100,
  [switch]$KeepServer,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$toolRoot = Split-Path -Parent $PSCommandPath
. (Join-Path $toolRoot "local-functions.ps1")

$externalPrefix = "stock_cards_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$outLog = Join-Path $env:TEMP "viralbox-stock-out-$externalPrefix.log"
$errLog = Join-Path $env:TEMP "viralbox-stock-err-$externalPrefix.log"
$envFile = Join-Path $env:TEMP "viralbox-stock-env-$externalPrefix.env"
$server = $null

$allLayerKeys = @(
  "brand_lift_layer",
  "creator_style_adapter",
  "scene_energy_curve_layer",
  "risk_reputation_layer",
  "platform_conversion_layer",
  "audience_identity_layer",
  "luxury_signal_layer",
  "proof_without_boring_layer",
  "sponsor_softness_layer",
  "ritual_series_layer",
  "status_shift_layer",
  "comment_trigger_layer",
  "save_worthy_utility_layer",
  "relatability_break_layer",
  "viral_tension_layer",
  "cultural_localization_layer",
  "narrative_serial_layer",
  "absurd_procedure_layer",
  "comedy_worldbuilding_layer"
)

function Invoke-DbSql {
  param([Parameter(Mandatory = $true)][string]$Sql)
  docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -t -A -F "`t" -c $Sql
}

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][object]$Body
  )

  $bodyFile = Join-Path $env:TEMP ("viralbox-stock-post-{0}.json" -f ([guid]::NewGuid().ToString("N")))
  try {
    $Body | ConvertTo-Json -Depth 90 -Compress | Set-Content -LiteralPath $bodyFile -Encoding utf8 -NoNewline
    $raw = & curl.exe `
      -sS `
      --max-time 240 `
      -X POST `
      -H "x-admin-token: $AdminToken" `
      -H "Content-Type: application/json" `
      --data-binary "@$bodyFile" `
      -w "`n%{http_code}" `
      $Uri

    if ($LASTEXITCODE -ne 0) {
      throw "HTTP POST failed for $Uri with curl exit code $LASTEXITCODE. Response: $($raw -join "`n")"
    }

    $lines = @($raw)
    $status = [int]$lines[-1]
    $content = if ($lines.Count -gt 1) { $lines[0..($lines.Count - 2)] -join "`n" } else { "" }
    if ($status -lt 200 -or $status -ge 300) {
      throw "HTTP POST failed for $Uri with status $status. Response: $content"
    }
    if ([string]::IsNullOrWhiteSpace($content)) {
      return $null
    }
    return $content | ConvertFrom-Json
  } finally {
    if (Test-Path $bodyFile) {
      Remove-Item -LiteralPath $bodyFile -Force
    }
  }
}

function ConvertTo-SlugText {
  param([string]$Value)
  $slug = $Value.ToLowerInvariant() -replace '[^a-z0-9]+', '_'
  return ($slug -replace '^_+', '' -replace '_+$', '')
}

function ConvertTo-TitleText {
  param([string]$Value)
  $words = ($Value -replace '[_-]+', ' ').Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
  return (($words | ForEach-Object { if ($_.Length -gt 1) { $_.Substring(0,1).ToUpperInvariant() + $_.Substring(1).ToLowerInvariant() } else { $_.ToUpperInvariant() } }) -join ' ')
}

function Get-PersonaForCategory {
  param([string]$Slug, [string]$Family)
  if ($PersonaSlug) { return $PersonaSlug }
  if ($Slug -match 'beauty|spa|cosmetic|makeup|skin|hair|salon|nail|esthetic') { return "beauty_tester" }
  if ($Slug -match 'travel|hotel|tour|restaurant|cafe|bar|food|bakery|coffee|park|city|museum|resort') { return "travel_curator" }
  if ($Slug -match 'fashion|clothing|jewelry|boutique|luxury|watch|shoe|style') { return "luxury_editor" }
  if ($Slug -match 'comedy|entertainment|meme|theater|music|creator|artist') { return "comedy_observer" }
  if ($Slug -match 'education|school|coach|consult|course|book|author|training') { return "creator_teacher" }
  if ($Slug -match 'shop|store|retail|product|commerce|affiliate|market|supply') { return "product_reviewer" }
  if ($Family -eq "instagram_business") { return "expert_guide" }
  return "relatable_lifestyle"
}

function New-PracticalEffects {
  $effects = @{}
  foreach ($layer in $allLayerKeys) {
    $effects[$layer] = switch ($layer) {
      "brand_lift_layer" { "Clarifies what this idea adds to the creator's taste, authority, and long-term perception." }
      "creator_style_adapter" { "Adapts the execution to the selected persona without copying any real public figure." }
      "scene_energy_curve_layer" { "Shapes the first-second hook, proof turn, payoff, and final viewer action." }
      "risk_reputation_layer" { "Keeps claims, sponsor language, and sensitive category wording bounded and credible." }
      "platform_conversion_layer" { "Makes the concept usable as Reels, Story, Carousel, and Shorts variations." }
      "audience_identity_layer" { "Gives the audience a clear reason to see themselves in the decision." }
      "luxury_signal_layer" { "Adds restrained visual language, clean framing, and premium pacing." }
      "proof_without_boring_layer" { "Turns proof into short visual evidence instead of a long explanation." }
      "sponsor_softness_layer" { "Keeps product or partner integration natural, disclosed, and low-pressure." }
      "ritual_series_layer" { "Makes the idea repeatable as a creator-owned format or recurring series." }
      "status_shift_layer" { "Creates a before-to-after perception shift without unsafe transformation claims." }
      "comment_trigger_layer" { "Adds a precise audience question that invites specific replies." }
      "save_worthy_utility_layer" { "Builds a reusable checklist, map, or decision filter worth saving." }
      "relatability_break_layer" { "Adds a human imperfection or friction moment so the post does not feel like an ad." }
      "viral_tension_layer" { "Creates a low-risk tension between expectation and reveal." }
      "cultural_localization_layer" { "Makes the idea adaptable to city, season, neighborhood, or community context." }
      "narrative_serial_layer" { "Gives the card a beginning, turn, payoff, and next-episode prompt." }
      "absurd_procedure_layer" { "Turns an ordinary decision into a playful but understandable procedure." }
      "comedy_worldbuilding_layer" { "Adds repeatable rules, terms, and micro-situations for a creator-owned comic world." }
      default { "Supports the card with a practical execution rule." }
    }
  }
  return $effects
}

function New-PremiumIdea {
  param(
    [Parameter(Mandatory = $true)][object]$Category,
    [Parameter(Mandatory = $true)][string]$Persona,
    [Parameter(Mandatory = $true)][int]$Index,
    [Parameter(Mandatory = $true)][string]$BatchId
  )

  $categorySlug = [string]$Category.slug
  $categoryName = [string]$Category.name
  $family = [string]$Category.family
  $categoryTitle = ConvertTo-TitleText $categoryName
  $scenarioNames = @(
    "Hidden Decision Map",
    "Three-Part Save Filter",
    "Quiet Proof Ritual",
    "Premium Mistake Reveal",
    "Audience Choice Split",
    "Behind-The-Standard Edit",
    "Micro-Authority Checklist",
    "Comment-First Comparison",
    "Real-Life Friction Turn",
    "Founder Taste Audit"
  )
  $scenario = $scenarioNames[$Index % $scenarioNames.Count]
  $variant = "{0:D3}" -f $Index
  $externalId = "{0}_{1}_{2}" -f (ConvertTo-SlugText $BatchId), (ConvertTo-SlugText $categorySlug), $variant
  $safeCategoryPhrase = if ($family -eq "instagram_business") { "$categoryTitle experience" } else { "$categoryTitle content" }
  $audiencePain = "too many options and not enough trusted context"
  $firstVisual = "A polished final shot cuts to the small decision that made it work."
  $decisionLens = "$categoryTitle decision filter"
  $title = "$categoryTitle $scenario Brief $variant"

  $practicalEffects = New-PracticalEffects
  $appliedLayers = @($allLayerKeys)

  return @{
    external_idea_id = $externalId
    title = $title
    one_sentence_premise = "A $Persona creator turns a $safeCategoryPhrase into a save-worthy Reels card by showing the hidden decision, the proof moment, and a clear viewer prompt."
    mechanism_ids = @("VIA-132", "VIA-145", "VIA-150", "VIA-160")
    category_slug = $categorySlug
    persona_tags = @($Persona)
    content_style_layers = @("T02", "T03", "T07", "T08", "T12")
    hook_options = @(
      "The part that looks effortless is actually one small decision.",
      "Before you copy the final result, look at this filter.",
      "This is the $decisionLens I would save first.",
      "The premium version is not louder; it is more selective.",
      "Which option would you remove from this setup?"
    )
    story_beats = @("visual hook", "premise", "proof detail", "decision boundary", "payoff", "comment prompt", "save CTA")
    platform = "instagram_reels"
    idea_card = @{
      title = $title
      concept = "$categoryTitle $scenario"
      format = "reels_30_45"
      brand_lift_statement = "This idea positions the creator as a selective guide who turns $safeCategoryPhrase into taste, clarity, and repeatable audience trust."
      premium_decision_note = "This card is built as a complete premium execution system: hook, proof, scene plan, visual direction, caption logic, safety boundaries, and platform variants."
      idea_summary = @{
        premise = "The creator reveals the hidden decision behind a polished $safeCategoryPhrase moment."
        target_emotion = "The audience feels invited into a smarter, more premium way to choose."
        creator_takeaway = "Show the decision process, not only the final result."
      }
      why_it_can_work = @{
        share_trigger = "Viewers recognize the gap between polished outcomes and the small decisions behind them."
        save_trigger = "The decision filter gives the audience something reusable."
        trust_trigger = "The creator names context and boundaries instead of making oversized promises."
      }
      creator_presence_mode = @{
        mode = $Persona
        delivery_style = "Calm, specific, editorial, and practical without sounding like a sales script."
        why_it_fits_creator = "This mode lets the creator become a trusted filter for $categoryTitle decisions."
        avoid = "Avoid copying a celebrity voice, overpromising outcomes, or turning the post into a hard sell."
      }
      atmosphere_direction = @{
        mood = "Premium, useful, intimate, and real."
        visual_texture = "Clean close-ups, hands in action, one imperfect preparation detail, and a final checklist frame."
        color_language = "Neutral base, one controlled accent color, clean light, and uncluttered framing."
        soundscape = "Soft ambient bed, crisp object sounds, and clear voiceover."
      }
      hook_performance_pack = @{
        hook_options = @(
          "The part that looks effortless is actually one small decision.",
          "Before you copy the final result, look at this filter.",
          "This is the $decisionLens I would save first.",
          "The premium version is not louder; it is more selective.",
          "Which option would you remove from this setup?"
        )
        luxury_hook = "The premium choice is the one you can explain calmly."
        relatable_hook = "I used to make this harder than it needed to be."
        comedy_hook = "My decision process briefly became a tiny board meeting."
        first_second_visual_hook = $firstVisual
        first_line_hook = "The part that looks effortless is actually one small decision."
        comment_trigger_hook = "What would you remove from this decision?"
      }
      video_blueprint = @{
        duration_seconds = 38
        opening_visual = $firstVisual
        scene_arc = "Final curiosity -> hidden decision -> proof detail -> boundary -> saveable payoff."
        payoff_visual = "Creator holds or points to a three-step decision filter on screen."
      }
      scene_script = @(
        @{ second = "0-3"; purpose = "attention"; voiceover = "The part that looks effortless is actually one small decision."; spoken_lines = @("Watch the decision before the result."); on_screen_text = "The hidden decision" },
        @{ second = "4-10"; purpose = "premise"; voiceover = "For this $categoryTitle moment, I start with one filter instead of adding more noise."; spoken_lines = @("I start here."); on_screen_text = "One filter first" },
        @{ second = "11-24"; purpose = "proof"; voiceover = "Here is the proof detail: what I kept, what I removed, and why it fits this context."; spoken_lines = @("This is the boundary."); on_screen_text = "Keep / remove / why" },
        @{ second = "25-34"; purpose = "payoff"; voiceover = "Save this if you want a cleaner way to make the same decision."; spoken_lines = @("Save the filter, not just the final shot."); on_screen_text = "Save the filter" },
        @{ second = "35-38"; purpose = "comment"; voiceover = "Tell me which option you would remove first."; spoken_lines = @("What would you remove?"); on_screen_text = "Comment your first remove" }
      )
      shot_list = @(
        @{ second = "0-2"; shot = "Tight final reveal"; action = "Show the polished result for one second, then interrupt it."; overlay = "Not the final. The decision." },
        @{ second = "3-8"; shot = "Overhead decision table"; action = "Place three options in frame and remove one with a clear gesture."; overlay = "Keep / remove / why" },
        @{ second = "9-20"; shot = "Medium creator frame"; action = "Explain the context boundary in one sentence."; overlay = "Context matters" },
        @{ second = "21-32"; shot = "Detail proof close-up"; action = "Show the small proof detail that supports the choice."; overlay = "Proof detail" },
        @{ second = "33-38"; shot = "Checklist payoff"; action = "Hold the three-step filter long enough to screenshot."; overlay = "Save this filter" }
      )
      b_roll_plan = @(
        @{ type = "product_closeup"; shot = "Close-up of the selected object, place, or detail."; note = "Show context, not a miracle claim." },
        @{ type = "hand_movement"; shot = "A slow remove-or-choose gesture."; note = "Make the decision physically visible." },
        @{ type = "environment_detail"; shot = "One clean atmosphere shot that signals category and taste."; note = "Use this as premium texture." },
        @{ type = "preparation_moment"; shot = "The setup before the final frame."; note = "Makes the polished result feel earned." },
        @{ type = "reality_moment"; shot = "One small imperfection or correction."; note = "Keeps the video human and believable." },
        @{ type = "safe_alternative"; shot = "Decision filter instead of before/after transformation."; note = "Avoid unsafe result promises." }
      )
      pose_direction = @{
        face = "Calm, focused, and slightly knowing."
        hands = "Use slow sorting gestures; avoid frantic pointing or constant product pushing."
        body = "Relaxed shoulders, slight angle to camera, stable posture."
        expression = "Confident but not exaggerated; let the proof carry the energy."
      }
      micro_behavior_guide = @{
        facial_expression = "Soft confidence with a small recognition moment after the proof detail."
        eye_contact = "Look into the lens for the hook and CTA; look down during proof and sorting."
        product_handling = "Hold objects low and steady so the decision feels natural."
        camera_attention = "Return to camera when explaining the boundary."
        smile_timing = "Small smile after the reveal, not during the claim boundary."
        avoid_over_advertising = "Do not repeat brand names, wave labels, or use urgent buying language."
      }
      camera_direction = @{
        framing = "Start tight, move overhead for the decision, finish medium or close for the payoff."
        movement = "One intentional cut at the hook; stable shots for the proof."
        lighting = "Natural or soft controlled light with visible texture."
      }
      editing_notes = @{
        pacing = "Fast first cut, measured proof section, clean final checklist hold."
        transitions = @("hard cut from final to decision table", "caption pop for boundary", "held frame for save CTA")
        sound = "Soft premium bed with light object sounds and clear voiceover."
      }
      editing_timeline = @(
        @{ second = "0-2"; beat = "pattern interrupt"; edit = "Cut from the polished final to the hidden decision." },
        @{ second = "3-8"; beat = "premise"; edit = "Name the filter and show the options." },
        @{ second = "9-20"; beat = "proof turn"; edit = "Show what was kept, removed, and why." },
        @{ second = "21-34"; beat = "payoff"; edit = "Reveal the clean decision and the three-step filter." },
        @{ second = "last 3"; beat = "save and comment CTA"; edit = "Hold the checklist and ask one precise comment question." }
      )
      caption_pack = @{
        caption_options = @(
          "The premium part is the decision you can explain.",
          "Save this before you copy the final shot.",
          "Less noise, clearer context, better $categoryTitle decisions."
        )
        on_screen_text = @("The hidden decision", "Keep / remove / why", "Save the filter")
        cta = "Save this filter and use it before your next $categoryTitle decision."
      }
      comment_engine = @{
        pinned_comment = "What would you remove from this decision first?"
        audience_question = "Which option would make this feel cleaner, safer, or more premium?"
        reply_strategy = "Turn the strongest replies into a follow-up Story poll or a second decision-filter Reel."
      }
      story_followup = @{
        poll_question = "Which part should I break down next?"
        poll_options = @("The hook", "The proof", "The edit", "The caption")
        followup_frame = "Share the winning poll result with a one-frame checklist recap."
      }
      variant_pack = @{
        reels = "38-second decision-filter Reel with hook, proof, payoff, and comment CTA."
        story = "Three-frame Story: poll, proof detail, checklist."
        carousel = "Five-slide decision filter with one proof example per slide."
        youtube_shorts = "Faster voiceover version with the same decision and proof structure."
        short_15s = "Final shot, hidden decision, one proof detail, save CTA."
      }
      brand_safety = @{
        disclosure_text = "If sponsored, disclose the partnership at the start of the caption and video."
        claim_boundary = "Frame this as creator context and decision support, not a universal result promise."
        do_not_say = @("This works for everyone", "Guaranteed result", "You must buy this", "This fixes the problem")
        evidence_note = "If a performance claim is used, add substantiation or replace it with personal-context wording."
        safer_alternative_phrase = "In my context, this is the cleaner decision."
      }
      production_notes = @{
        props = @("phone", "tripod", "decision card", "three category-relevant options")
        wardrobe = "Clean outfit that matches the category mood."
        location = "Home, studio corner, hotel room, car, shop, venue, or desk setup depending on category."
        safety = "Avoid medical, financial, legal, or guaranteed outcome claims unless properly substantiated."
      }
      production_plan = @{
        shoot_time_minutes = 35
        equipment = @("phone", "tripod", "natural light", "simple surface")
        solo_creator_friendly = $true
        location_options = @("home setup", "studio corner", "hotel room", "car setup", "venue detail")
        production_versions = @{ low = "phone and window light"; mid = "tripod and lav mic"; high = "assistant plus macro b-roll" }
      }
      personalization_slots = @{
        product_name = "{product_name}"
        daily_context = "{daily_context}"
        audience_pain = "{audience_pain}"
        signature_phrase = "{signature_phrase}"
      }
      strategic_value = @{
        brand_equity = "Builds the creator's reputation as a trusted filter for $categoryTitle decisions."
        audience_aftertaste = "The audience should feel calmer, smarter, and more willing to save the creator's advice."
        partnership_signal = "Shows partners that the creator can integrate context, restraint, disclosure, and useful proof."
      }
      category_layer_pack = @{
        applied_layers = $appliedLayers
        category_fit_note = "This $categoryTitle card uses a broad premium layer pack so the idea can adapt to the category while staying safe and practical."
        premium_execution_note = "The card is premium because it gives the creator a complete execution plan, not only a concept."
        practical_effects = $practicalEffects
      }
    }
    safety_notes = @()
  }
}

function Get-Categories {
  $where = "enabled = true"
  if ($CategorySlugs.Count -gt 0) {
    $quoted = ($CategorySlugs | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }) -join ","
    $where = "$where and slug in ($quoted)"
  }
  $limit = if ($LimitCategories -gt 0) { " limit $LimitCategories" } else { "" }
  $sql = "select slug, name, family from public.categories where $where order by sort_order, slug$limit;"
  $rows = Invoke-DbSql -Sql $sql
  return @($rows | Where-Object { $_ } | ForEach-Object {
    $parts = $_ -split "`t"
    [pscustomobject]@{ slug = $parts[0]; name = $parts[1]; family = $parts[2] }
  })
}

try {
  if ($CardsPerCategory -lt 1) {
    throw "CardsPerCategory must be positive."
  }

  $categories = Get-Categories
  if (-not $categories.Count) {
    throw "No enabled categories matched the request."
  }

  $totalTarget = $categories.Count * $CardsPerCategory
  Write-Host "Preparing $totalTarget cards: $CardsPerCategory per category across $($categories.Count) categories."

  if ($DryRun) {
    $categories | Select-Object -First 20 | Format-Table -AutoSize
    return
  }

  if (-not $KeepServer) {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }

  $statusEnv = & cmd /c "supabase status -o env 2>nul"
  $localServiceRoleKey = ($statusEnv | Select-String -Pattern '^SERVICE_ROLE_KEY="(.+)"$').Matches.Groups[1].Value
  $localApiUrl = ($statusEnv | Select-String -Pattern '^API_URL="(.+)"$').Matches.Groups[1].Value
  if (-not $localServiceRoleKey -or -not $localApiUrl) {
    throw "Could not read local Supabase API_URL/SERVICE_ROLE_KEY from supabase status -o env"
  }

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

  $ready = $false
  $lastError = $null
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    if ($server.HasExited) {
      throw "Functions server exited early with code $($server.ExitCode)"
    }
    try {
      Invoke-WebRequest -Uri "$FunctionsBaseUrl/inventory-health" -Headers @{ "x-admin-token" = $AdminToken } -UseBasicParsing -TimeoutSec 3 | Out-Null
      $ready = $true
      break
    } catch {
      $lastError = $_.Exception.Message
    }
  }
  if (-not $ready) {
    throw "Functions server did not become ready. Last probe error: $lastError"
  }

  $summary = [ordered]@{
    categories = $categories.Count
    target_cards = $totalTarget
    imported = 0
    rejected = 0
    scored = 0
    published = 0
    failed_categories = @()
  }

  $categoryIndex = 0
  foreach ($category in $categories) {
    $categoryIndex += 1
    $persona = Get-PersonaForCategory -Slug $category.slug -Family $category.family
    $batchId = "{0}_{1}_{2}" -f $externalPrefix, (ConvertTo-SlugText $category.slug), $persona
    Write-Host "[$categoryIndex/$($categories.Count)] $($category.slug) / $persona"

    try {
      $batch = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches" -Body @{
        external_batch_id = $batchId
        category_slug = $category.slug
        persona_slug = $persona
        target_count = $CardsPerCategory
        language = "en"
        platform = "instagram_reels"
        generator_version = "bulk-stock-v1.0.0"
        source_mode = "admin_direct"
        manifest = @{
          batch_id = $batchId
          category_slug = $category.slug
          persona_slug = $persona
          target_count = $CardsPerCategory
          language = "en"
          platform = "instagram_reels"
          generator_version = "bulk-stock-v1.0.0"
        }
      }

      $ideas = for ($i = 1; $i -le $CardsPerCategory; $i++) {
        New-PremiumIdea -Category $category -Persona $persona -Index $i -BatchId $batchId
      }

      $import = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/import" -Body @{ ideas = @($ideas) }
      $summary.imported += [int]$import.imported
      $summary.rejected += [int]$import.rejected

      for ($offset = 0; $offset -lt $CardsPerCategory; $offset += $ScoreChunkSize) {
        $score = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/score" -Body @{
          limit = $ScoreChunkSize
          offset = $offset
        }
        $summary.scored += [int]$score.scored
      }

      for ($offset = 0; $offset -lt $CardsPerCategory; $offset += $PublishChunkSize) {
        $finalChunk = ($offset + $PublishChunkSize) -ge $CardsPerCategory
        $publish = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/publish-inventory" -Body @{
          quality_floor = $QualityFloor
          max_reuse_count = $MaxReuseCount
          limit = $PublishChunkSize
          offset = $offset
          final_chunk = $finalChunk
        }
        $summary.published += [int]$publish.published_inventory
      }
    } catch {
      $summary.failed_categories += @([ordered]@{ slug = $category.slug; persona = $persona; error = $_.Exception.Message })
      Write-Host "FAILED $($category.slug): $($_.Exception.Message)"
    }
  }

  $summary | ConvertTo-Json -Depth 20
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
  if (-not $KeepServer) {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }
  if (Test-Path $envFile) {
    Remove-Item -LiteralPath $envFile -Force
  }
}