param(
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [int]$IdeaCount = 1000,
  [int]$ScoreChunkSize = 25,
  [int]$PublishChunkSize = 100,
  [int]$MaxHttpAttempts = 3,
  [switch]$KeepServer
)

$ErrorActionPreference = "Stop"
$toolRoot = Split-Path -Parent $PSCommandPath
. (Join-Path $toolRoot "local-functions.ps1")
$cleanupScript = Join-Path $toolRoot "cleanup-test-generated-stock.ps1"

$batchExternalId = "quality_gate_v2_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$outLog = Join-Path $env:TEMP "viralbox-qg2-out-$batchExternalId.log"
$errLog = Join-Path $env:TEMP "viralbox-qg2-err-$batchExternalId.log"
$envFile = Join-Path $env:TEMP "viralbox-qg2-env-$batchExternalId.env"
$server = $null

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][object]$Body
  )

  $bodyFile = Join-Path $env:TEMP ("viralbox-post-{0}.json" -f ([guid]::NewGuid().ToString("N")))
  try {
    $Body | ConvertTo-Json -Depth 80 -Compress | Set-Content -LiteralPath $bodyFile -Encoding utf8 -NoNewline
    $raw = & curl.exe `
      -sS `
      --max-time 180 `
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

function Invoke-JsonPostWithRetry {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][object]$Body,
    [Parameter(Mandatory = $true)][string]$Context
  )

  $attempt = 1
  while ($true) {
    try {
      return Invoke-JsonPost -Uri $Uri -Body $Body
    } catch {
      if ($attempt -ge $MaxHttpAttempts) {
        throw "$Context failed after $attempt attempt(s): $($_.Exception.Message)"
      }

      $delay = [Math]::Min(10, 2 * $attempt)
      Write-Host "$Context failed on attempt $attempt; retrying in $delay seconds..."
      Start-Sleep -Seconds $delay
      $attempt += 1
    }
  }
}

function New-PremiumCard {
  param(
    [Parameter(Mandatory = $true)][int]$Index,
    [Parameter(Mandatory = $true)][string]$Concept,
    [Parameter(Mandatory = $true)][bool]$HighSignal
  )

  $duration = if ($HighSignal) { 42 } else { 28 }
  $hooks = @(
    "$Concept icin pahali duran sey final degil karar anidir.",
    "Bunu herkes gosteriyor ama kimse karar filtresini gostermiyor.",
    "Bu fikrin sakin ama kaydedilebilir versiyonu.",
    "Luks hissi bazen daha az seyi daha net secmektir.",
    "Yorumlarda en cok tartisilacak kisim burasi."
  )

  return @{
    idea_summary = @{
      premise = "$Concept uzerinden creator'in karar surecini premium ve uygulanabilir bir video formatina cevirir."
      target_emotion = "Gizli editor notuna erismis gibi hissetmek."
      creator_takeaway = "Sonucu degil, sonuca goturen secim mantigini goster."
    }
    why_it_can_work = @{
      share_trigger = "Takipci kendi rutinindeki benzer karar anini tanir."
      save_trigger = "Karar filtresi tekrar kullanilabilir."
      trust_trigger = "Creator iddia yerine sinir ve baglam verir."
    }
    brand_lift_statement = "Bu fikir creator'i sadece gosteren degil, secim standardi olan premium bir editor gibi konumlandirir."
    premium_decision_note = "Premium kutuya uygundur cunku fikir tek bir post degil, hook, proof, production ve yorum motoru olan uygulanabilir bir icerik sistemi sunar."
    creator_presence_mode = @{
      mode = "Editorial Insider"
      delivery_style = "Sakin, net, secici ve takipciye karar kolaylastiran bir ton."
      why_it_fits_creator = "Creator'in otoritesini abartili iddia yerine zevk ve karar kalitesiyle kurar."
      avoid = "Agresif satis, mucize vaat, baska creator taklidi ve gereksiz drama."
    }
    atmosphere_direction = @{
      mood = "Quiet premium, warm, clean, real but polished."
      visual_texture = "Yakın plan detay, el hareketi, sade masa, gercek hazirlik ani."
      color_language = "Soft neutral zemin, tek vurgu rengi, temiz isik."
      soundscape = "Dusuk tempolu ritim, net voiceover, hafif obje sesleri."
    }
    hook_performance_pack = @{
      hook_options = $hooks
      luxury_hook = "$Concept icin en luks sey daha fazlasi degil, dogru eleme."
      relatable_hook = "Ben de bunu once fazla karmasik yapiyordum."
      comedy_hook = "Bu karar agaci olmasa yine her seyi ayni anda denerdim."
      first_second_visual_hook = "Final shot hard-cuts to the decision table."
      first_line_hook = $hooks[0]
      comment_trigger_hook = "Siz bu kararda neyi elerdiniz?"
    }
    video_blueprint = @{
      duration_seconds = $duration
      opening_visual = "Final goruntu, sonra karar masasina sert gecis."
      scene_arc = "Final meraki -> karar filtresi -> kanit/baglam -> saveable payoff."
      payoff_visual = "Creator ekranda 3 maddelik kaydetme filtresini tutar."
    }
    scene_script = @(
      @{ second = "0-3"; purpose = "attention"; voiceover = "Bu finalden daha degerli olan sey, onceki karar."; spoken_lines = @("Final degil karar."); on_screen_text = "Final degil karar" },
      @{ second = "4-10"; purpose = "trust"; voiceover = "Once baglama bakiyorum: bugun ne lazim, ne fazla, ne riskli?"; spoken_lines = @("Uc soruyla seciyorum."); on_screen_text = "3 soru" },
      @{ second = "11-24"; purpose = "proof"; voiceover = "Bunu seciyorum cunku vaadi bugunku baglama uyuyor."; spoken_lines = @("Burada sinirim bu."); on_screen_text = "Baglam + sinir" },
      @{ second = "25-35"; purpose = "payoff"; voiceover = "Kaydetmek istersen filtre bu."; spoken_lines = @("Bunu sonra kullan."); on_screen_text = "Kaydet" }
    )
    shot_list = @(
      @{ second = "0-2"; shot = "Tight final close-up"; action = "Creator kameraya bakar."; overlay = "Final degil karar" },
      @{ second = "3-8"; shot = "Overhead table"; action = "Secenekleri iki gruba ayirir."; overlay = "Kullan / ele" },
      @{ second = "9-20"; shot = "Medium mirror frame"; action = "Karar sinirini anlatir."; overlay = "Bugunku baglam" },
      @{ second = "21-35"; shot = "Checklist close-up"; action = "Kaydedilebilir filtreyi gosterir."; overlay = "3 maddelik filtre" }
    )
    b_roll_plan = @(
      @{ type = "product_closeup"; shot = "Close-up detail"; note = "Iddia degil baglam goster." },
      @{ type = "hand_movement"; shot = "Yavas eleme hareketi"; note = "Satis baskisi olmasin." },
      @{ type = "environment_detail"; shot = "Masa ve isik detayi"; note = "Premium atmosfer." },
      @{ type = "preparation_moment"; shot = "Checklist yazimi"; note = "Sistemi somutlastir." },
      @{ type = "reality_moment"; shot = "Kucuk duzeltme ani"; note = "Gercek insan kaniti." },
      @{ type = "safe_alternative"; shot = "Before/after yerine karar filtresi"; note = "Transformasyon iddiasindan kacin." }
    )
    pose_direction = @{ face = "Sakin ve emin ifade."; hands = "Yavas ve net secim hareketleri."; body = "45 derece aci, rahat omuz."; expression = "Kucuk bilen gulumseme." }
    micro_behavior_guide = @{ facial_expression = "Sakin guven."; eye_contact = "Hook ve payoff'ta kameraya bak."; product_handling = "Urunu dusuk ve sakin tut."; camera_attention = "Sinir cumlesinde kameraya don."; smile_timing = "Payoff sonrasi kisa gulumse."; avoid_over_advertising = "Etiket sallama, acil satin alma dili ve mucize vaadi kullanma." }
    camera_direction = @{ framing = "Close-up, overhead, medium frame."; movement = "Ilk saniye sert cut, sonra stabil."; lighting = "Dogal yan isik, fazla filtre yok." }
    editing_notes = @{ pacing = "Ilk 2 saniye hizli, proof bolumu sakin."; transitions = @("hard cut", "caption pop", "checklist hold"); sound = "Soft premium bed + net voiceover." }
    editing_timeline = @(
      @{ second = "0-2"; beat = "pattern_interrupt"; edit = "Finalden karar masasina cut." },
      @{ second = "3-8"; beat = "premise"; edit = "Karar filtresi kurulur." },
      @{ second = "9-20"; beat = "proof_turn"; edit = "Baglam ve sinir gosterilir." },
      @{ second = "21-35"; beat = "payoff"; edit = "Checklist payoff." },
      @{ second = "last_3"; beat = "save_comment_cta"; edit = "Checklist tutulur ve yorum sorusu gelir." }
    )
    caption_pack = @{ caption_options = @("Finalden onceki karar daha onemli.", "Luks bazen eleme kalitesidir.", "Bunu sonra kendi rutinin icin kaydet."); on_screen_text = @("Final degil karar", "3 soru", "Kaydet"); cta = "Kaydet ve kendi baglamina gore dene." }
    comment_engine = @{ pinned_comment = "Siz bu kararda neyi elerdiniz?"; audience_question = "Bu konuda en cok hangi karar zor geliyor?"; reply_strategy = "En iyi yorumlari story poll'a cevir." }
    story_followup = @{ poll_question = "Bu kararda hangisi daha zor?"; poll_options = @("Secmek", "Elemek", "Sinir koymak", "Kaniti anlamak"); followup_frame = "Poll sonucuna gore mini karar filtresi paylas." }
    variant_pack = @{ reels = "35-45 saniye karar filtresi Reels."; story = "Poll + follow-up checklist."; carousel = "5 slide karar filtresi."; youtube_shorts = "Daha hizli voiceover ve net payoff."; short_15s = "Final -> karar -> 1 sinir -> kaydet." }
    brand_safety = @{ disclosure_text = "Sponsorluysa video ve caption basinda #ad / reklam is birligi belirt."; claim_boundary = "Kisisel deneyim ve baglam; evrensel sonuc vaadi yok."; do_not_say = @("Kesin cozum", "Herkeste calisir", "Bunu almazsan eksik kalirsin"); evidence_note = "Performans iddiasi varsa kanit veya kaynak gerekir."; safer_alternative_phrase = "Benim bugunku baglamimda daha guvenli secim bu." }
    production_notes = @{ props = @("phone", "tripod", "checklist card", "simple table"); wardrobe = "Neutral premium top."; location = "Home, hotel, studio corner."; safety = "No medical, financial or universal claim." }
    production_plan = @{ shoot_time_minutes = 35; equipment = @("phone", "tripod", "natural light"); solo_creator_friendly = $true; location_options = @("home", "hotel", "studio"); production_versions = @{ low = "phone + window light"; mid = "tripod + lav mic"; high = "assistant + macro b-roll" } }
    personalization_slots = @{ product_name = "{product_name}"; daily_context = "{daily_context}"; audience_pain = "{audience_pain}"; signature_phrase = "{signature_phrase}" }
    strategic_value = @{ brand_equity = "Creator'in zevk ve karar standardini buyutur."; audience_aftertaste = "Takipci daha sakin ve daha akilli karar almis hisseder."; partnership_signal = "Markalara guvenli entegrasyon ve dusuk baskili ikna kapasitesi gosterir." }
    category_layer_pack = @{
      applied_layers = @(
        "brand_lift_layer",
        "creator_style_adapter",
        "scene_energy_curve_layer",
        "risk_reputation_layer",
        "platform_conversion_layer",
        "proof_without_boring_layer",
        "luxury_signal_layer",
        "sponsor_softness_layer",
        "save_worthy_utility_layer",
        "relatability_break_layer"
      )
      category_fit_note = "Beauty kategorisi icin proof, luxury signal ve sponsor softness zorunlu tutulur."
      premium_execution_note = "Kart close-up kanit, claim siniri ve sessiz premium edit hissiyle $1000 kutu algisini destekler."
      practical_effects = @{
        brand_lift_layer = "Creator'i zevk filtresi olan guvenilir editor gibi konumlar."
        creator_style_adapter = "Fikri luxury_editor tonunda sakin ve secici anlatima uyarlar."
        scene_energy_curve_layer = "Ilk saniye karar hook'u, orta kisim proof, finalde save CTA kurar."
        risk_reputation_layer = "Medical claim, sponsor disclosure ve fazla reklam gorunumu riskini sinirlar."
        platform_conversion_layer = "Reels, Story, Carousel, Shorts versiyonlarini hazirlar."
        proof_without_boring_layer = "Close-up ve karar filtresiyle kaniti reklamsiz gosterir."
        luxury_signal_layer = "Texture, isik ve az konusan premium edit hissi verir."
        sponsor_softness_layer = "Disclosure ve dogal kullanim ani ile sponsor hissini yumusatir."
        save_worthy_utility_layer = "Takipciye tekrar kullanabilecegi karar filtresi verir."
        relatability_break_layer = "Kucuk gerceklik ani ile kusursuzlugu insani hale getirir."
      }
    }
  }
}

function New-Idea {
  param([int]$Index)

  $concepts = @("glow_prep", "style_filter", "travel_route", "shopping_trust", "quiet_luxury", "routine_reset", "comment_debate", "sensory_proof", "creator_lore", "decision_tree")
  $angles = @("mirror_logic", "texture_signal", "hotel_corner", "desk_reset", "vanity_rule", "soft_proof", "caption_ladder", "taste_filter", "audience_prompt", "save_map")
  $moments = @("morning", "launch_day", "travel_bag", "studio_light", "sunday_reset", "brand_call", "event_prep", "quick_errand", "quiet_evening", "shoot_day")
  $briefToken = $batchExternalId.Replace("quality_gate_v2_", "qg_")
  $concept = "{0}_{1}_{2}_{3}_{4:D4}" -f $briefToken, $concepts[$Index % $concepts.Count], $angles[$Index % $angles.Count], $moments[$Index % $moments.Count], $Index
  $highSignal = ($Index % 4 -ne 0)
  $mechanisms = if ($highSignal) { @("VIA-132", "VIA-145", "VIA-150", "VIA-160") } else { @("VIA-132") }
  $layers = if ($highSignal) { @("T02", "T03", "T07", "T08", "T12") } else { @("T02") }
  $storyBeats = if ($highSignal) { @("final", "decision", "proof", "boundary", "payoff", "comment", "save", "variant") } else { @("decision") }
  $candidateHooks = if ($highSignal) {
    @(
      "$concept icin final degil karar onemli.",
      "Bu goruntuyu pahali gosteren sey secim filtresi.",
      "Bunu herkes atliyor.",
      "Kaydetmelik karar agaci.",
      "Siz olsaniz neyi elerdiniz?"
    )
  } else {
    @("$concept icin tek karar filtresi.")
  }

  return @{
    external_idea_id = "qg2_{0:D4}" -f $Index
    title = "The Soft Proof Reveal"
    one_sentence_premise = "$concept creator icin premium ama guvenli karar filtresiyle cekilebilir viral Reels fikrine donusur."
    mechanism_ids = @($mechanisms)
    category_slug = "beauty"
    persona_tags = @("luxury_editor")
    content_style_layers = @($layers)
    hook_options = @($candidateHooks)
    story_beats = @($storyBeats)
    idea_card = New-PremiumCard -Index $Index -Concept $concept -HighSignal $highSignal
    safety_notes = @("No medical claim; sponsor disclosure and claim boundary included.")
  }
}

function Invoke-DbSql {
  param([Parameter(Mandatory = $true)][string]$Sql)
  docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c $Sql
}

try {
  if (-not $KeepServer) {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }

  if (Test-Path $cleanupScript) {
    & powershell -ExecutionPolicy Bypass -File $cleanupScript | Out-Null
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
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    if ($server.HasExited) { throw "Functions server exited early with code $($server.ExitCode)" }
    try {
      Invoke-WebRequest -Uri "$FunctionsBaseUrl/inventory-health" -Headers @{ "x-admin-token" = $AdminToken } -UseBasicParsing -TimeoutSec 3 | Out-Null
      $ready = $true
      break
    } catch {}
  }
  if (-not $ready) { throw "Functions server did not become ready" }

  $batch = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches" -Body @{
    external_batch_id = $batchExternalId
    category_slug = "beauty"
    persona_slug = "luxury_editor"
    target_count = $IdeaCount
    language = "tr"
    platform = "instagram_reels"
    generator_version = "quality-gate-v2-test"
    source_mode = "jsonl_import"
  }

  $files = @()
  $lines = New-Object System.Collections.Generic.List[string]
  for ($i = 1; $i -le $IdeaCount; $i++) {
    $lines.Add((New-Idea -Index $i | ConvertTo-Json -Depth 80 -Compress))
    if ($lines.Count -eq 100 -or $i -eq $IdeaCount) {
      $fileNumber = $files.Count + 1
      $files += @{
        name = "ideas_{0:D4}.jsonl" -f $fileNumber
        content = ($lines -join "`n")
      }
      $lines.Clear()
    }
  }

  $manifest = @{
    batch_id = $batchExternalId
    category_slug = "beauty"
    persona_slug = "luxury_editor"
    target_count = $IdeaCount
    language = "tr"
    platform = "instagram_reels"
    generator_version = "quality-gate-v2-test"
  }

  $importResult = [ordered]@{
    imported = 0
    rejected = 0
    total_rows = 0
  }
  foreach ($file in $files) {
    $chunkImport = Invoke-JsonPostWithRetry -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/import" -Context "import chunk $($file.name)" -Body @{
      manifest = $manifest
      files = @($file)
    }
    $importResult.imported += [int]$chunkImport.imported
    $importResult.rejected += [int]$chunkImport.rejected
    $importResult.total_rows += [int]$chunkImport.total_rows
  }

  $scoreTotals = [ordered]@{
    scored = 0
    quality_checked = 0
    quality_approved = 0
    quality_refine = 0
    quality_rejected = 0
    quality_human_review_required = 0
    claim_evidence_rows = 0
    second_opinion_required = 0
  }
  $safeScoreChunkSize = [Math]::Max(1, [Math]::Min($ScoreChunkSize, 100))
  for ($offset = 0; $offset -lt $IdeaCount; $offset += $safeScoreChunkSize) {
    $scoreChunk = Invoke-JsonPostWithRetry -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/score" -Context "score chunk offset=$offset limit=$safeScoreChunkSize" -Body @{
      limit = $safeScoreChunkSize
      offset = $offset
    }
    foreach ($key in @("scored", "quality_checked", "quality_approved", "quality_refine", "quality_rejected", "quality_human_review_required", "claim_evidence_rows", "second_opinion_required")) {
      $scoreTotals[$key] += [int]$scoreChunk.$key
    }
  }
  $publishedInventory = 0
  $safePublishChunkSize = [Math]::Max(1, [Math]::Min($PublishChunkSize, 250))
  for ($offset = 0; $offset -lt $IdeaCount; $offset += $safePublishChunkSize) {
    $isFinalChunk = ($offset + $safePublishChunkSize) -ge $IdeaCount
    $publishChunk = Invoke-JsonPostWithRetry -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/publish-inventory" -Context "publish chunk offset=$offset limit=$safePublishChunkSize" -Body @{
      quality_floor = 45
      editorial_quality_floor = 78
      max_reuse_count = 1
      limit = $safePublishChunkSize
      offset = $offset
      final_chunk = $isFinalChunk
    }
    $publishedInventory += [int]$publishChunk.published_inventory
  }

  $deliverySql = @"
with test_user as (
  insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
  values ('00000000-0000-4000-8000-000000000020'::uuid, 'authenticated', 'authenticated', 'qg2@example.test', '{}'::jsonb, '{}'::jsonb, now(), now(), now())
  on conflict (id) do update set updated_at = now()
  returning id
),
profile as (
  insert into public.profiles (id, display_name, role)
  select id, 'Quality Gate V2 Test', 'creator' from test_user
  on conflict (id) do update set display_name = excluded.display_name
  returning id
),
purchase as (
  insert into public.purchases (user_id, box_product_id, amount_usd_cents, status)
  select profile.id, product.id, product.price_usd_cents, 'paid'
  from profile
  join public.box_products product on product.slug = 'viral_box_500'
  returning id, user_id
),
delivery as (
  select public.deliver_idea_box(
    purchase.user_id,
    'viral_box_500',
    'beauty',
    'luxury_editor',
    purchase.id
  ) as delivery_id
  from purchase
)
select delivery_id from delivery;
"@

  $deliveryOutput = Invoke-DbSql -Sql $deliverySql

  $assertSql = @"
select
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid) as quality_checks,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and decision = 'approve') as approved,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and evaluator_version = 'quality-gate-v2.1.0') as v2_1_checks,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and lexical_signature <> '{}'::jsonb) as lexical_signature_rows,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and metadata ? 'category_layer_policy') as category_layer_policy_rows,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and coalesce((metadata -> 'category_layer_policy' ->> 'score')::numeric, 0) >= 85) as category_layer_policy_pass_rows,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and 'category_layer_policy_incomplete' = any(reasons)) as category_layer_policy_incomplete_rows,
  (select count(*) from public.idea_quality_checks where generation_batch_id = '$($batch.id)'::uuid and claim_evidence_status in ('not_required', 'missing', 'provided', 'needs_review')) as claim_status_rows,
  (select count(*) from public.idea_claim_evidence where generation_batch_id = '$($batch.id)'::uuid) as claim_evidence_rows,
  (select count(*) from public.idea_inventory where metadata ->> 'batch_id' = '$($batch.id)') as inventory_rows,
  (select count(*)
   from public.idea_box_items item
   join public.idea_box_deliveries delivery on delivery.id = item.delivery_id
   join public.purchases purchase on purchase.id = delivery.purchase_id
   where purchase.raw_event = '{}'::jsonb
     and delivery.created_at > now() - interval '10 minutes') as recent_box_items;
"@
  $assertOutput = Invoke-DbSql -Sql $assertSql

  if (Test-Path $cleanupScript) {
    & powershell -ExecutionPolicy Bypass -File $cleanupScript | Out-Null
  }

  [ordered]@{
    batch_id = $batch.id
    external_batch_id = $batchExternalId
    imported = $importResult.imported
    rejected = $importResult.rejected
    scored = $scoreTotals.scored
    quality_checked = $scoreTotals.quality_checked
    quality_approved = $scoreTotals.quality_approved
    quality_refine = $scoreTotals.quality_refine
    quality_rejected = $scoreTotals.quality_rejected
    quality_human_review_required = $scoreTotals.quality_human_review_required
    claim_evidence_rows = $scoreTotals.claim_evidence_rows
    second_opinion_required = $scoreTotals.second_opinion_required
    published_inventory = $publishedInventory
    delivery = ($deliveryOutput -join "`n")
    assertions = ($assertOutput -join "`n")
  } | ConvertTo-Json -Depth 20
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if (Test-Path $outLog) { Write-Host "STDOUT:"; Get-Content $outLog -Raw }
  if (Test-Path $errLog) { Write-Host "STDERR:"; Get-Content $errLog -Raw }
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