param(
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [switch]$KeepServer
)

$ErrorActionPreference = "Stop"
$toolRoot = Split-Path -Parent $PSCommandPath
. (Join-Path $toolRoot "local-functions.ps1")
$cleanupScript = Join-Path $toolRoot "cleanup-test-generated-stock.ps1"

$batchExternalId = "test_generator_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$outLog = Join-Path $env:TEMP "viralbox-functions-out-$batchExternalId.log"
$errLog = Join-Path $env:TEMP "viralbox-functions-err-$batchExternalId.log"
$envFile = Join-Path $env:TEMP "viralbox-functions-env-$batchExternalId.env"
$server = $null

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [Parameter(Mandatory = $true)]
    [object]$Body
  )

  $bodyFile = Join-Path $env:TEMP ("viralbox-post-{0}.json" -f ([guid]::NewGuid().ToString("N")))
  try {
    $Body | ConvertTo-Json -Depth 60 | Set-Content -LiteralPath $bodyFile -Encoding utf8 -NoNewline
    $raw = & curl.exe `
      -sS `
      --max-time 120 `
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

  $trainingContext = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/training-context" `
    -Body @{
      limit = 12
      trend_limit = 8
      eval_limit = 4
    }

  if (-not $trainingContext.pattern_profile -or @($trainingContext.pattern_profile).Count -lt 1) {
    throw "Training context did not return an active pattern profile"
  }
  if (-not $trainingContext.category_layer_policy -or -not $trainingContext.category_layer_policy.required_layers) {
    throw "Training context did not return category layer policy"
  }

  $ideas = @(
    @{
      external_idea_id = "$($batchExternalId)_001"
      title = "The Soft Proof Reveal"
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
        brand_lift_statement = "Bu fikir creator'i sadece urun gosteren biri degil, premium zevki surece cevirebilen guvenilir bir editor gibi konumlandirir."
        premium_decision_note = "Bu fikir 5'li premium kutuda yer alir cunku hem estetik arzuyu hem de perde arkasi gercekligi ayni anda tasir."
        idea_summary = @{
          premise = "Polished final look is reframed through the invisible prep ritual behind it."
          target_emotion = "Private access to tasteful expertise."
          creator_takeaway = "Show the decision process, not only the result."
        }
        why_it_can_work = @{
          share_trigger = "Audience recognizes that premium results usually hide small prep decisions."
          save_trigger = "The prep checklist gives practical value."
          trust_trigger = "The creator names boundaries instead of overclaiming."
        }
        creator_presence_mode = @{
          mode = "Editorial Insider"
          delivery_style = "Sakin, secici, detay bilen ama ogretmen gibi davranmayan premium editor tonu."
          why_it_fits_creator = "Luxury editor personasinin gucu, sonucu degil secim mantigini gostermesinden gelir."
          avoid = "Asiri heyecanli satis tonu, tibbi iddia, her cilde uygun kesin sonuc vaadi."
        }
        atmosphere_direction = @{
          mood = "Quiet luxury, intimate vanity, polished but human."
          visual_texture = "Clean mirror reflections, towel texture, small real-life prep friction."
          color_language = "Soft neutrals, warm whites, one muted product accent."
          soundscape = "Low-volume premium routine audio with crisp product handling sounds."
        }
        hook_performance_pack = @{
          hook_options = @(
            "Bu goruntunun 12 dakika oncesi daha degerliydi.",
            "Final degil hazirlik rutini satiliyor.",
            "Luks gorunen seyin gercek checklisti.",
            "Cildim iyi gorunmeden once bunu yaptim.",
            "Bu urun degil, oncesindeki karar onemli."
          )
          luxury_hook = "Final degil, finali mumkun kilan sessiz hazirlik."
          relatable_hook = "Ben de bazen finali gosterip arkasini sakliyordum."
          comedy_hook = "Cildim parlamadan once banyo tezgahi savas alaniydi."
          first_second_visual_hook = "Finished glow shot hard-cuts to messy prep table."
          first_line_hook = "Bu goruntunun 12 dakika oncesi daha degerliydi."
          comment_trigger_hook = "Sizin rutinde kimsenin gormedigi hazirlik adimi ne?"
        }
        beats = @("polished opening", "prep friction", "honest payoff")
        video_blueprint = @{
          duration_seconds = 35
          opening_visual = "Creator finished glow shot, then quick cut to messy prep table."
          scene_arc = "Final look -> hidden prep friction -> product/context boundary -> calm payoff."
          payoff_visual = "Creator holds the product lower in frame and points to the prep checklist."
        }
        shot_list = @(
          @{ second = "0-3"; shot = "Tight face close-up"; action = "Look into lens, slight smile, show finished look."; overlay = "12 dakika once daha onemliydi." },
          @{ second = "4-12"; shot = "Table top macro"; action = "Show towel, tools, product amount, small imperfection."; overlay = "Final degil hazirlik." },
          @{ second = "13-26"; shot = "Mirror medium shot"; action = "Explain one prep decision and one boundary."; overlay = "Benim cildimde / bugun / bu kadar." },
          @{ second = "27-35"; shot = "Product + checklist"; action = "Point to saveable three-step checklist."; overlay = "Kaydet: hazirlik checklisti." }
        )
        scene_script = @(
          @{ second = "0-3"; purpose = "attention"; voiceover = "Bu final goruntusunden daha onemli bir an var."; spoken_lines = @("Bu kisim degil..."); on_screen_text = "12 dakika once"; },
          @{ second = "4-12"; purpose = "trust"; voiceover = "Hazirlik masasini gostermek istiyorum cunku asil karar burada."; spoken_lines = @("Burada miktari abartmiyorum."); on_screen_text = "Final degil hazirlik"; },
          @{ second = "13-26"; purpose = "proof"; voiceover = "Bugun cildimde bunu bu kadar kullaniyorum; herkese uygun bir iddia degil."; spoken_lines = @("Benim bugunku sinirim bu."); on_screen_text = "Benim cildimde / bugun"; },
          @{ second = "27-35"; purpose = "payoff"; voiceover = "Kaydetmek istersen, benim hazirlik checklistim bu."; spoken_lines = @("Bunu sonra denemeden once kaydet."); on_screen_text = "3 adim checklist"; }
        )
        b_roll_plan = @(
          @{ type = "product_closeup"; shot = "Small amount on fingertip"; note = "Avoid miracle-result implication." },
          @{ type = "hand_movement"; shot = "Slow cap close and towel fold"; note = "Premium restraint." },
          @{ type = "environment_detail"; shot = "Vanity corner and mirror edge"; note = "Atmosphere without clutter." },
          @{ type = "preparation_moment"; shot = "Checklist card before application"; note = "Turns routine into method." },
          @{ type = "reality_moment"; shot = "Messy towel/tool micro-friction"; note = "Humanizes the polished result." },
          @{ type = "safe_alternative"; shot = "Context checklist instead of before/after"; note = "Avoids transformation claim." }
        )
        pose_direction = @{
          face = "Soft editorial face; eyebrows relaxed, no exaggerated surprise."
          hands = "Slow product hold, two-finger point to checklist, avoid frantic gestures."
          body = "Slight 45-degree angle to mirror, shoulders relaxed."
          expression = "Calm confidence, tiny knowing smile at reveal."
        }
        micro_behavior_guide = @{
          facial_expression = "Soft confidence, not sales excitement."
          eye_contact = "Look at lens for hook and payoff; look down during prep proof."
          product_handling = "Hold product low and steady, label visible but not pushed."
          camera_attention = "Return to camera only when explaining boundary."
          smile_timing = "Small smile after revealing the messy prep table."
          avoid_over_advertising = "Do not point at product repeatedly or use urgent buying language."
        }
        camera_direction = @{
          framing = "Start tight face close-up, move to overhead table shot, end medium mirror frame."
          movement = "One slow push-in on product amount; otherwise stable shots."
          lighting = "Natural side light, no harsh filter; keep texture visible."
        }
        editing_notes = @{
          pacing = "Fast first cut, slower middle proof, clean final checklist."
          transitions = @("match cut from final glow to prep table", "caption pop for boundary")
          sound = "Soft luxury routine audio under voiceover."
        }
        editing_timeline = @(
          @{ second = "0-2"; beat = "pattern_interrupt"; edit = "Hard cut from final glow to prep table." },
          @{ second = "3-8"; beat = "premise"; edit = "Voiceover names hidden prep." },
          @{ second = "9-20"; beat = "proof_turn"; edit = "Macro prep shots and boundary caption." },
          @{ second = "21-35"; beat = "payoff"; edit = "Checklist appears and save CTA lands." },
          @{ second = "last_3"; beat = "save_comment_cta"; edit = "Hold checklist long enough to screenshot." }
        )
        caption_pack = @{
          caption_options = @("Luks rutin bazen urun eklemek degil, hazirligi dogru yapmak.", "Finalden onceki 12 dakika rutini degistiriyor.", "Parlak goruntunun arkasinda kucuk ama onemli bir hazirlik var.")
          on_screen_text = @("Final degil hazirlik", "Benim cildimde / bugun / bu kadar", "Kaydet: 3 adim")
          cta = "Kaydet ve kendi hazirlik checklistinle dene."
        }
        comment_engine = @{
          pinned_comment = "Sizin rutinde kimsenin gormedigi hazirlik adimi ne?"
          audience_question = "Finalden once yaptiginiz en kucuk ama en etkili adim hangisi?"
          reply_strategy = "En iyi cevaplara story'de anonim mini checklist olarak don."
        }
        story_followup = @{
          poll_question = "Rutininizde en cok hangi adimi atliyorsunuz?"
          poll_options = @("Hazirlik", "Miktar", "Sira", "Bekleme suresi")
          followup_frame = "Ertesi story'de en cok secilen adim icin mini checklist paylas."
        }
        variant_pack = @{
          reels = "35-second polished prep reveal."
          story = "3-frame poll + checklist follow-up."
          carousel = "Slide-by-slide prep checklist."
          youtube_shorts = "Same structure with stronger voiceover and faster cuts."
          short_15s = "Final shot -> prep table -> one boundary -> checklist."
        }
        brand_safety = @{
          disclosure_text = "Sponsorluysa ilk caption satirinda #ad veya yerel disclosure kullan."
          claim_boundary = "Personal routine context only; no universal result claim."
          do_not_say = @("Herkeste ayni sonucu verir", "Cildi tedavi eder", "Kesin cozum")
          evidence_note = "If a performance claim is made, require product-side substantiation."
          safer_alternative_phrase = "Benim bugunku rutinimde daha iyi calisan sinir bu."
        }
        production_notes = @{
          props = @("mirror", "clean towel", "product", "small checklist card")
          wardrobe = "Neutral robe or simple premium top."
          location = "Bathroom mirror or vanity with natural light."
          safety = "No medical claim; frame as personal routine context."
        }
        production_plan = @{
          shoot_time_minutes = 35
          equipment = @("phone", "tripod", "natural light", "small mirror")
          solo_creator_friendly = $true
          location_options = @("home vanity", "hotel bathroom", "studio dressing room")
          production_versions = @{ low = "phone + window light"; mid = "tripod + lav mic"; high = "macro lens + assistant hand shots" }
        }
        personalization_slots = @{
          product_name = "{product_name}"
          daily_context = "{daily_context}"
          audience_pain = "{audience_pain}"
          signature_phrase = "{signature_phrase}"
        }
        strategic_value = @{
          brand_equity = "Builds taste authority by showing the creator's decision process, not only the final look."
          audience_aftertaste = "The audience should feel invited into a premium but believable private ritual."
          partnership_signal = "Signals to beauty partners that the creator can integrate products with restraint and trust."
        }
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
          category_fit_note = "Beauty icin proof, luxury signal ve sponsor softness zorunlu premium katmanlardir."
          premium_execution_note = "Rituel karti close-up kanit, sakin luxury edit ve claim boundary ile uygulanabilir hale gelir."
          practical_effects = @{
            brand_lift_layer = "Creator'i zevk filtresi olan guvenilir beauty editor gibi konumlar."
            creator_style_adapter = "Luxury editor tonunu sakin, secici ve abartisiz tutar."
            scene_energy_curve_layer = "Hook, proof, payoff ve save CTA temposunu netlestirir."
            risk_reputation_layer = "Cilt/sonuc iddiasi ve sponsor disclosure riskini sinirlar."
            platform_conversion_layer = "Reels, Story, Carousel ve Shorts varyantini kullanilir yapar."
            proof_without_boring_layer = "Urun etkisini iddia yerine rituel baglami ve close-up ile gosterir."
            luxury_signal_layer = "Isik, texture ve sessiz premium detaylarla pahali his verir."
            sponsor_softness_layer = "Urun entegrasyonunu dogal kullanim ani ve disclosure ile yumusatir."
            save_worthy_utility_layer = "Takipciye tekrar kullanabilecegi mini karar filtresi verir."
            relatability_break_layer = "Hazirlik/duzeltme ani ile reklam hissini azaltir."
          }
        }
      }
      safety_notes = @()
    },
    @{
      external_idea_id = "$($batchExternalId)_002"
      title = "The Quiet Choice"
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
        brand_lift_statement = "Bu fikir creator'i takipcisine daha fazla urun degil, daha iyi karar hissi veren sofistike bir rehber olarak konumlandirir."
        premium_decision_note = "Bu fikir premium kutuya deger katar cunku tek seferlik post degil, kaydedilebilir bir karar sistemi sunar."
        idea_summary = @{
          premise = "A beauty recommendation becomes a decision system for what to skip today."
          target_emotion = "Relief from overchoice."
          creator_takeaway = "Help the audience decide, not just buy."
        }
        why_it_can_work = @{
          share_trigger = "Followers recognize product overload."
          save_trigger = "The use/skip decision tree is reusable."
          trust_trigger = "The creator avoids overclaiming and reduces pressure."
        }
        creator_presence_mode = @{
          mode = "Calm Expert Editor"
          delivery_style = "Net, dusuk tempolu, yardimci ve karar kolaylastiran editor sesi."
          why_it_fits_creator = "Luxury editor personasinin takipcisi urun listesinden cok secim filtresi ister."
          avoid = "Korku dili, cilt problemi teshisi, agresif urun karsilastirmasi."
        }
        atmosphere_direction = @{
          mood = "Clean decision desk, premium utility, calm morning reset."
          visual_texture = "Two trays, simple checklist, crisp hand movements, uncluttered vanity."
          color_language = "Cream, glass, silver, soft beige with one clear accent label."
          soundscape = "Soft click sounds for each decision branch and minimal voiceover bed."
        }
        hook_performance_pack = @{
          hook_options = @(
            "Bugun bu urunu kullanmamak daha iyi olabilir.",
            "Rutin eklemek degil elemek de luks.",
            "Cilt rutininin sessiz karar noktasi.",
            "Urun onerisi degil, urun eleme filtresi.",
            "Bugun neyi pas gececegini birlikte secelim."
          )
          luxury_hook = "En luks rutin, bazen en dogru seyi kullanmamaktir."
          relatable_hook = "Cok urun var ve bugun hangisini pas gececegimi boyle seciyorum."
          comedy_hook = "Cildim bugun CV istemiyor, sadece sakinlik istiyor."
          first_second_visual_hook = "Hand reaches for product, freezes, then puts it back."
          first_line_hook = "Bugun bu urunu kullanmamak daha iyi olabilir."
          comment_trigger_hook = "Siz bugun rutinden neyi cikardiniz?"
        }
        beats = @("wrong product assumption", "decision filter", "clean recommendation")
        video_blueprint = @{
          duration_seconds = 40
          opening_visual = "Creator reaches for product, freezes, then puts it back."
          scene_arc = "Temptation to add product -> three-question filter -> skip/use decision -> save prompt."
          payoff_visual = "Creator shows two baskets: use today / skip today."
        }
        shot_list = @(
          @{ second = "0-4"; shot = "Hand close-up"; action = "Reach for product, pause before opening."; overlay = "Bugun kullanmamak daha iyi olabilir." },
          @{ second = "5-18"; shot = "Face-to-camera medium"; action = "Ask three context questions."; overlay = "1. Cilt nasil? 2. Gun plani? 3. Diger aktifler?" },
          @{ second = "19-31"; shot = "Overhead two-basket shot"; action = "Place products into use/skip groups."; overlay = "Ekleme degil eleme." },
          @{ second = "32-40"; shot = "Checklist close-up"; action = "Tap saveable decision tree."; overlay = "Kaydet: bugunun filtresi." }
        )
        scene_script = @(
          @{ second = "0-4"; purpose = "attention"; voiceover = "Bugun bu urunu kullanmamak daha iyi olabilir."; spoken_lines = @("Bunu her gun kullanmak zorunda degilim."); on_screen_text = "Bugun kullanmama filtresi"; },
          @{ second = "5-18"; purpose = "trust"; voiceover = "Once uc seye bakiyorum: cildim, gun planim, diger aktifler."; spoken_lines = @("Bu bir teshis degil, karar filtresi."); on_screen_text = "3 soru"; },
          @{ second = "19-31"; purpose = "proof"; voiceover = "Bu urun bugun skip; bu daha sakin bir secim."; spoken_lines = @("Bugun elemek daha iyi."); on_screen_text = "Use / Skip"; },
          @{ second = "32-40"; purpose = "payoff"; voiceover = "Kaydet; yarin urun secmeden once bunu kullan."; spoken_lines = @("Bunu screenshot alabilirsiniz."); on_screen_text = "Kaydet"; }
        )
        b_roll_plan = @(
          @{ type = "product_closeup"; shot = "Product placed between use/skip trays"; note = "Show decision, not forced sale." },
          @{ type = "hand_movement"; shot = "Creator moves product from hand to skip tray"; note = "Clear, satisfying gesture." },
          @{ type = "environment_detail"; shot = "Clean vanity and decision card"; note = "Utility atmosphere." },
          @{ type = "preparation_moment"; shot = "Writing three filter questions"; note = "Makes system tangible." },
          @{ type = "reality_moment"; shot = "Creator hesitates before adding another active"; note = "Relatable overchoice." },
          @{ type = "safe_alternative"; shot = "Use/skip trays instead of before/after"; note = "Avoids transformation framing." }
        )
        pose_direction = @{
          face = "Thoughtful pause, direct eye contact during questions."
          hands = "Clear sorting gestures; hold product label away from medical-style claims."
          body = "Centered medium frame, lean slightly in for question moments."
          expression = "Helpful editor energy; calm, not alarmist."
        }
        micro_behavior_guide = @{
          facial_expression = "Thoughtful and reassuring."
          eye_contact = "Direct eye contact on each question, look down while sorting."
          product_handling = "Move product gently into use/skip tray without dramatic rejection."
          camera_attention = "Look back at camera before final save prompt."
          smile_timing = "Small smile after saying 'elemek de luks'."
          avoid_over_advertising = "Do not over-display product label or push urgency."
        }
        camera_direction = @{
          framing = "Hand macro opener, medium talking frame, overhead sorting shot."
          movement = "Tiny handheld pause at hook, locked overhead for clarity."
          lighting = "Bright neutral vanity light; avoid heavy beauty filter."
        }
        editing_notes = @{
          pacing = "Question beats every 3-4 seconds; final checklist held long enough to screenshot."
          transitions = @("freeze-frame on product reach", "snap cut to baskets")
          sound = "Minimal click/pop sounds for each decision branch."
        }
        editing_timeline = @(
          @{ second = "0-2"; beat = "pattern_interrupt"; edit = "Freeze on product reach." },
          @{ second = "3-8"; beat = "premise"; edit = "Text overlay frames skip decision." },
          @{ second = "9-20"; beat = "proof_turn"; edit = "Three questions appear one by one." },
          @{ second = "21-35"; beat = "payoff"; edit = "Use/skip trays resolve the tension." },
          @{ second = "last_3"; beat = "save_comment_cta"; edit = "Hold decision tree and ask comment question." }
        )
        caption_pack = @{
          caption_options = @("Rutin eklemek degil, bugun neyi pas gececegini bilmek.", "Beauty rutininin en luks karari: elemek.", "Bazen en iyi urun karari, bugun kullanmamaktir.")
          on_screen_text = @("Bugun kullanma filtresi", "3 soru", "Use / Skip")
          cta = "Kaydet; yarin urun secmeden once kullan."
        }
        comment_engine = @{
          pinned_comment = "Bugun rutinden neyi cikardiniz?"
          audience_question = "Sizde en cok hangi urun 'her gun kullanmaliyim' baskisi yaratiyor?"
          reply_strategy = "Cok gelen urunleri anonim olarak story'de use/skip filtresine cevir."
        }
        story_followup = @{
          poll_question = "Bugun rutininiz neye ihtiyac duyuyor?"
          poll_options = @("Sadelik", "Nem", "Dinlenme", "Koruma")
          followup_frame = "Poll sonucuna gore ertesi gun mini use/skip listesi paylas."
        }
        variant_pack = @{
          reels = "40-second decision tree with trays."
          story = "Poll-first use/skip interactive story."
          carousel = "5-slide decision tree."
          youtube_shorts = "Fast-paced hook plus three questions."
          short_15s = "Reach for product -> freeze -> 3-question overlay -> skip/use tray."
        }
        brand_safety = @{
          disclosure_text = "Sponsor varsa caption ve video basinda disclosure kullan."
          claim_boundary = "Decision support only; no skin diagnosis or treatment guidance."
          do_not_say = @("Bunu kullanirsan duzelir", "Herkes bunu pas gecmeli", "Kesinlikle zararli")
          evidence_note = "Ingredient or clinical claims require substantiation."
          safer_alternative_phrase = "Ben bugun bu baglamda daha sakin bir secim yapiyorum."
        }
        production_notes = @{
          props = @("two small trays", "3-5 products", "printed mini decision tree")
          wardrobe = "Clean neutral top, minimal jewelry."
          location = "Vanity, desk, or bathroom counter."
          safety = "No diagnosis or treatment claim; include patch/context caution."
        }
        production_plan = @{
          shoot_time_minutes = 45
          equipment = @("phone", "tripod", "two trays", "printed decision card")
          solo_creator_friendly = $true
          location_options = @("home vanity", "desk", "hotel bathroom")
          production_versions = @{ low = "two trays + natural light"; mid = "tripod + overhead mount"; high = "assistant sorting b-roll + clean set styling" }
        }
        personalization_slots = @{
          product_name = "{product_name}"
          daily_context = "{daily_context}"
          audience_pain = "{audience_pain}"
          signature_phrase = "{signature_phrase}"
        }
        strategic_value = @{
          brand_equity = "Turns the creator into a trusted filter for overchoice, which raises long-term authority."
          audience_aftertaste = "The audience should leave feeling calmer, smarter, and more in control of buying decisions."
          partnership_signal = "Shows brands the creator can drive consideration without overclaiming."
        }
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
          category_fit_note = "Beauty karar agaci proof, luxury signal ve sponsor softness ile guvenli premium karta donusur."
          premium_execution_note = "Urunleri satin alma baskisi yerine karar filtresiyle anlatir; bu da premium kutu degerini artirir."
          practical_effects = @{
            brand_lift_layer = "Creator'i overchoice icinde guvenilir filtre olarak konumlandirir."
            creator_style_adapter = "Anlatimi luxury_editor icin sakin, net ve secici yapar."
            scene_energy_curve_layer = "Ilk saniye eleme gorseli, orta kisim karar proof'u, finalde save CTA verir."
            risk_reputation_layer = "Skin claim ve sponsor disclosure risklerini kontrol eder."
            platform_conversion_layer = "Reels ana versiyonunu Story poll ve Carousel checklist'e cevirir."
            proof_without_boring_layer = "Kanit hissini close-up, tray ayrimi ve baglamla verir."
            luxury_signal_layer = "Minimal tray, temiz isik ve yavas el hareketiyle pahali his verir."
            sponsor_softness_layer = "Sponsorluysa disclosure ve dogal secim ani ile reklami yumusatir."
            save_worthy_utility_layer = "Takipciye satin almadan once kaydedecegi karar agaci verir."
            relatability_break_layer = "Kararsizlik/eleme ani ile insani ve tanidik bir kirilma ekler."
          }
        }
      }
      safety_notes = @("No medical claim; recommends patch/context caution.")
    },
    @{
      external_idea_id = "$($batchExternalId)_003"
      title = "The Hidden Leak"
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

  $scenarioTokens = @(
    "aurora-liva-vanity-map-$($batchExternalId)",
    "nocturne-seda-skip-filter-$($batchExternalId)"
  )
  $scenarioVocabulary = @(
    ((1..28 | ForEach-Object { "aur{0}" -f ([guid]::NewGuid().ToString("N").Substring(0, 10)) }) -join " "),
    ((1..28 | ForEach-Object { "noc{0}" -f ([guid]::NewGuid().ToString("N").Substring(0, 10)) }) -join " ")
  )
  for ($ideaIndex = 0; $ideaIndex -lt 2; $ideaIndex++) {
    $scenarioToken = $scenarioTokens[$ideaIndex]
    $scenarioText = "$scenarioToken $($scenarioVocabulary[$ideaIndex])"
    $ideas[$ideaIndex].one_sentence_premise = "$($ideas[$ideaIndex].one_sentence_premise) Seasonal editorial marker: $scenarioText gives the premium beauty brief a fresh context."
    $ideas[$ideaIndex].hook_options += @(
      "Bu $scenarioToken karar notu bugunku cekime ozel.",
      "$scenarioToken filtresiyle finalden onceki secimi goster."
    )

    $card = $ideas[$ideaIndex].idea_card
    $card.idea_summary.premise = "$($card.idea_summary.premise) Unique scenario marker: $scenarioToken."
    $card.idea_summary.creator_takeaway = "$($card.idea_summary.creator_takeaway) Use the $scenarioToken constraint as a one-run editorial decision lens."
    $card.why_it_can_work.share_trigger = "$($card.why_it_can_work.share_trigger) The $scenarioToken detail gives the example a fresh context."
    $card.hook_performance_pack.hook_options += @(
      "$scenarioToken icin final degil, secim haritasi konusuyor.",
      "Bu cekimde $scenarioToken notunu once goster."
    )
    $card.brand_safety.evidence_note = "$($card.brand_safety.evidence_note) The $scenarioToken marker is an editorial context note; no medical outcome is claimed."
    $card.production_plan.location_options += @("controlled test set $scenarioToken")
    $card.strategic_value.context_note = "Seasonal editorial context marker: $scenarioToken."
  }

  $duplicateIdea = $ideas[0] | ConvertTo-Json -Depth 100 | ConvertFrom-Json
  $duplicateIdea.external_idea_id = "$($batchExternalId)_004"
  $ideas = @($ideas[0], $ideas[1], $duplicateIdea, $ideas[2])

  $importResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/import" `
    -Body @{ ideas = $ideas }

  $scoreResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/score" `
    -Body @{}

  $publishResult = Invoke-JsonPost `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/publish-inventory" `
    -Body @{ quality_floor = 80; max_reuse_count = 1; editorial_quality_floor = 80 }

  if ([int]$importResult.imported -ne 2) {
    throw "Expected 2 imported ideas, got $($importResult.imported)"
  }
  if ([int]$importResult.rejected -ne 2) {
    throw "Expected 2 rejected rows (duplicate card + internal-field leak), got $($importResult.rejected)"
  }
  if ([int]$scoreResult.scored -lt 2) {
    throw "Expected at least 2 scored ideas, got $($scoreResult.scored)"
  }
  if ([int]$publishResult.published_inventory -lt 1) {
    throw "Expected at least 1 published inventory row, got $($publishResult.published_inventory)"
  }

  if (Test-Path $cleanupScript) {
    & powershell -ExecutionPolicy Bypass -File $cleanupScript | Out-Null
  }

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
  if (-not $KeepServer) {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }
  if (Test-Path $envFile) {
    Remove-Item -LiteralPath $envFile -Force
  }
}
