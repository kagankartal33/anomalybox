param(
  [int]$CardsPerCategory = 100,
  [string]$PersonaSlug = "",
  [string]$CategorySlugs = "",
  [int]$LimitCategories = 0,
  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",
  [string]$AdminToken = "local-admin-token",
  [int]$QualityFloor = 45,
  [int]$MaxReuseCount = 1,
  [int]$ScoreChunkSize = 100,
  [int]$PublishChunkSize = 100,
  [int]$MaxTopUpAttempts = 8,
  [switch]$TopUpExistingStock,
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

function Get-PremiumCategoryCue {
  param([string]$Slug, [string]$Title)
  $text = ("$Slug $Title").ToLowerInvariant()
  switch -Regex ($text) {
    'beauty|makeup|skin|hair|salon|cosmetic|spa|nail|fragrance' { return "Soft" }
    'fashion|style|clothing|jewelry|watch|shoe|boutique|outfit' { return "Mirror" }
    'restaurant|food|cafe|coffee|bakery|dessert|pizza|kitchen|dining|bar' { return "First Bite" }
    'travel|hotel|tour|resort|city|museum|venue|park' { return "Arrival" }
    'fitness|sport|athlete|training|workout|wellness' { return "Performance" }
    'science|tech|software|gadget|education|course|coach|book|author' { return "Clear" }
    'comedy|film|cinema|music|gaming|podcast|creator|entertainment' { return "Timing" }
    'shop|store|commerce|retail|product|affiliate|market' { return "Honest" }
    'business|startup|founder|operator|career|marketing|leadership' { return "Operator" }
    default {
      $first = (($Title -replace '[^A-Za-z0-9 ]+', ' ').Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries) | Select-Object -First 1)
      if ($first) { return (ConvertTo-TitleText $first) }
      return "Signature"
    }
  }
}

function New-PremiumCardTitle {
  param(
    [Parameter(Mandatory = $true)][string]$Scenario,
    [Parameter(Mandatory = $true)][string]$CategorySlug,
    [Parameter(Mandatory = $true)][string]$CategoryTitle,
    [Parameter(Mandatory = $true)][int]$Index
  )

  $cue = Get-PremiumCategoryCue -Slug $CategorySlug -Title $CategoryTitle
  $scenarioTitle = switch -Regex ($Scenario) {
    'Three-Part Save Filter' { "Proof Reveal"; break }
    'Comment-First Comparison' { "Vote Turn"; break }
    'Behind-The-Standard Edit' { "Standard Turn"; break }
    'Real-Life Friction Turn' { "Human Detail"; break }
    'Quiet Proof Ritual' { "Proof Signal"; break }
    'Micro-Authority Checklist' { "Trust Marker"; break }
    'Founder Taste Audit' { "Taste Decision"; break }
    'Hidden Decision Map' { "Hidden Choice"; break }
    'Premium Mistake Reveal' { "Polished Mistake"; break }
    'Audience Choice Split' { "Audience Vote"; break }
    'Local Context Lens' { "Local Signal"; break }
    'Soft Objection Turn' { "Soft Objection"; break }
    'Saveable Sorting Ritual' { "Save Signal"; break }
    'One-Minute Trust Audit' { "Trust Minute"; break }
    'Tiny Upgrade Sequence' { "Tiny Upgrade"; break }
    'Expectation Reset' { "Expectation Flip"; break }
    'Proof-First Walkthrough' { "Proof Reveal"; break }
    'Taste Boundary Test' { "Taste Boundary"; break }
    'Viewer Vote Framework' { "Viewer Vote"; break }
    'Calm Expert Breakdown' { "Calm Expert Turn"; break }
    default { "Creator Signal" }
  }

  $title = "The $cue $scenarioTitle"
  if ($title.Length -gt 52) {
    $title = "The $scenarioTitle"
  }
  return $title.Trim()
}

function Get-CreatorSafeCategoryTitle {
  param(
    [Parameter(Mandatory = $true)][string]$Slug,
    [Parameter(Mandatory = $true)][string]$DefaultTitle
  )

  switch -Regex ($Slug) {
    '^crypto_and_web3$' { return "Digital Culture" }
    'kids|child|children|baby|preschool' { return "Family Lifestyle" }
    'womens_health_clinic' { return "Personal Care Studio" }
    default { return $DefaultTitle }
  }
}

function Get-PersonaForCategory {
  param([string]$Slug, [string]$Family)
  if ($PersonaSlug) { return $PersonaSlug }
  $tokens = @($Slug -split '_' | Where-Object { $_ })
  $slugText = ($tokens -join ' ')
  $tokenSet = @{}
  foreach ($token in $tokens) { $tokenSet[$token] = $true }
  $has = {
    param([string[]]$Needles)
    foreach ($needle in $Needles) {
      if ($tokenSet.ContainsKey($needle)) { return $true }
    }
    return $false
  }
  if (& $has @("beauty", "spa", "cosmetic", "cosmetics", "makeup", "skin", "hair", "salon", "nail", "esthetic", "aesthetic")) { return "beauty_tester" }
  if (& $has @("lifestyle")) { return "relatable_lifestyle" }
  if (& $has @("fashion", "clothing", "jewelry", "boutique", "luxury", "watch", "shoe", "style", "outfit", "apparel")) { return "style_strategist" }
  if (& $has @("food", "restaurant", "cafe", "bar", "bakery", "coffee", "pizza", "diner", "deli", "grill", "pub", "bistro", "kitchen", "dessert", "ice", "cream", "tea", "juice", "smoothie")) { return "food_experience_maker" }
  if (& $has @("travel", "hotel", "tour", "tourism", "resort", "city", "museum", "park", "venue", "stadium", "arena", "plaza", "garden", "mall", "pool", "rink", "field", "ground", "zoo", "aquarium", "film", "cinema", "visual")) { return "cinematic_storyteller" }
  if (& $has @("sport", "sports", "fitness", "gym", "athlete", "training", "motoring", "car", "auto", "automotive", "motorcycle", "outdoor", "performance")) { return "performance_athlete" }
  if (& $has @("gaming", "game", "live", "stream", "streaming", "fandom", "community", "fan", "esports")) { return "live_community_host" }
  if (& $has @("art", "artist", "music", "design", "designer", "photo", "photography", "photographer", "gallery", "creative", "craft")) { return "artist_worldbuilder" }
  if (& $has @("tech", "technology", "science", "ai", "software", "tool", "tools", "data", "security", "privacy")) { return "science_tech_explainer" }
  if (& $has @("business", "startup", "founder", "operator", "career", "sales", "marketing", "entrepreneur", "leadership")) { return "founder_operator" }
  if (& $has @("preschool", "kindergarten", "university", "college", "academy", "education", "school", "coach", "consult", "course", "book", "author")) { return "science_tech_explainer" }
  if ($slugText -match '\\b(content|creator|social|influencer)\\b') { return "creator_teacher" }
  if ((& $has @("supply", "store", "shop", "retail", "product", "commerce", "affiliate", "market")) -and -not (& $has @("hotel", "travel", "tourism"))) { return "product_reviewer" }
  if ((& $has @("supply", "store", "shop", "retail", "product", "commerce", "affiliate", "market")) -and (& $has @("restaurant", "food", "sporting", "outdoor"))) { return "product_reviewer" }
  if (& $has @("comedy", "entertainment", "meme", "theater", "music", "creator", "artist")) { return "comedy_observer" }
  if (& $has @("shop", "store", "retail", "product", "commerce", "affiliate", "market", "supply")) { return "product_reviewer" }
  if ($Family -eq "instagram_business") { return "expert_guide" }
  return "relatable_lifestyle"
}

function Get-PersonaProfile {
  param([string]$Slug)
  $title = ConvertTo-TitleText $Slug
  $defaults = @{
    display = $title
    delivery = "Calm, specific, premium, and practical without sounding like a sales script."
    audience = "The audience receives a sharper decision filter and a more polished reason to save."
    visual = "Clean close-ups, restrained motion, one human imperfection, and a final checklist frame."
    brand = "Builds the creator's reputation as a trusted premium filter."
  }
  $profiles = @{
    luxury_editor = @{ display = "Luxury Editor"; delivery = "Selective, composed, tasteful, and confident."; audience = "The audience feels guided toward a calmer, more premium choice."; visual = "Restrained framing, clean surfaces, quiet detail shots, and confident pauses."; brand = "Builds long-term taste authority and high-trust recommendation power." }
    relatable_lifestyle = @{ display = "Relatable Lifestyle"; delivery = "Warm, direct, human, and lightly playful."; audience = "The audience feels recognized and practically helped."; visual = "Natural light, lived-in details, casual proof moments, and soft corrections."; brand = "Makes the creator feel approachable while still useful and premium." }
    expert_guide = @{ display = "Expert Guide"; delivery = "Clear, structured, evidence-aware, and easy to follow."; audience = "The audience leaves with a framework they can apply immediately."; visual = "Annotated overlays, steady explanation, simple examples, and screenshotable summaries."; brand = "Strengthens authority without overclaiming." }
    beauty_tester = @{ display = "Beauty Tester"; delivery = "Specific, honest, visual, and boundary-aware."; audience = "The audience understands what to test, what to ignore, and what context matters."; visual = "Macro texture, mirror checks, routine context, and controlled proof close-ups."; brand = "Positions the creator as a trusted beauty decision filter." }
    travel_curator = @{ display = "Travel Curator"; delivery = "Observant, place-aware, practical, and aspirational."; audience = "The audience can picture the route, the mood, and the decision."; visual = "Location texture, movement, map cues, service details, and sensory b-roll."; brand = "Builds credibility as a refined guide to places and experiences." }
    comedy_observer = @{ display = "Comedy Observer"; delivery = "Recognizable, quick, non-cruel, and comment-first."; audience = "The audience sees a shared situation from a sharper comic angle."; visual = "Fast setup, readable reaction, simple props, and a clean punchline frame."; brand = "Turns the creator into a repeatable source of safe, social recognition." }
    product_reviewer = @{ display = "Product Reviewer"; delivery = "Useful, transparent, conditional, and sponsor-safe."; audience = "The audience gets a clear decision filter instead of pressure."; visual = "Hands-on demos, use-case b-roll, comparison rows, and disclosure moments."; brand = "Shows partners and followers that the creator can sell without sounding salesy." }
    creator_teacher = @{ display = "Creator Teacher"; delivery = "Structured, encouraging, sharp, and tactical."; audience = "The audience gets a creator workflow they can use today."; visual = "Screen notes, whiteboard logic, numbered overlays, and short examples."; brand = "Builds authority as a creator operating system, not just a personality." }
    cinematic_storyteller = @{ display = "Cinematic Storyteller"; delivery = "Atmospheric, visual-first, emotionally paced, and polished."; audience = "The audience feels inside a story, not just beside a recommendation."; visual = "Opening image, wide-to-close rhythm, texture, motion, and intentional silence."; brand = "Elevates the creator into a premium visual narrator." }
    founder_operator = @{ display = "Founder Operator"; delivery = "Decisive, strategic, practical, and low-fluff."; audience = "The audience understands a real decision, constraint, or operating lesson."; visual = "Desk notes, decision memos, sharp captions, founder walk-throughs, and proof points."; brand = "Positions the creator as an operator with earned judgment." }
    live_community_host = @{ display = "Live Community Host"; delivery = "High-energy, participatory, responsive, and event-led."; audience = "The audience feels part of the room, vote, challenge, or live moment."; visual = "Comment overlays, quick reactions, guest beats, room energy, and visible audience loops."; brand = "Turns community participation into a signature format." }
    performance_athlete = @{ display = "Performance Athlete"; delivery = "Disciplined, grounded, progress-led, and safety-aware."; audience = "The audience sees preparation, effort, and progress without unsafe promises."; visual = "Training details, controlled movement, warm-up moments, measured proof, and recovery context."; brand = "Builds credibility through discipline and visible standards." }
    artist_worldbuilder = @{ display = "Artist Worldbuilder"; delivery = "Symbolic, tactile, process-led, and visually consistent."; audience = "The audience enters a recognizable creative world."; visual = "Recurring motifs, studio fragments, material close-ups, and gallery-like pacing."; brand = "Makes the creator's world feel collectible and authored." }
    food_experience_maker = @{ display = "Food Experience Maker"; delivery = "Sensory, specific, warm, and appetite-led."; audience = "The audience can taste, choose, or recreate the moment before acting."; visual = "Macro texture, sound detail, plate reveals, ingredient context, and local cues."; brand = "Builds trust as a guide to taste, place, and repeatable food experiences." }
    style_strategist = @{ display = "Style Strategist"; delivery = "Editorial, useful, selective, and visually precise."; audience = "The audience learns a style rule they can actually use."; visual = "Mirror logic, outfit sequencing, detail crops, clean comparisons, and capsule frames."; brand = "Turns aesthetics into repeatable authority." }
    science_tech_explainer = @{ display = "Science & Tech Explainer"; delivery = "Clear, curious, evidence-aware, and demo-led."; audience = "The audience understands a complex idea through a useful visual explanation."; visual = "Screen capture, diagram overlays, demo tables, controlled comparisons, and source-aware captions."; brand = "Builds authority through clarity, proof boundaries, and useful simplification." }
  }
  if ($profiles.ContainsKey($Slug)) { return $profiles[$Slug] }
  return $defaults
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
  $categoryTitleSource = if ($categoryName -match '[^\\u0000-\\u007F]') { $categorySlug } else { $categoryName }
  $categoryTitle = Get-CreatorSafeCategoryTitle -Slug $categorySlug -DefaultTitle (ConvertTo-TitleText $categoryTitleSource)
  $personaProfile = Get-PersonaProfile -Slug $Persona
  $personaDisplay = [string]$personaProfile.display
  $scenarioNames = @(
    "Hidden Decision Map",
    "Three-Part Save Filter",
    "Quiet Proof Signal",
    "Premium Mistake Reveal",
    "Audience Choice Split",
    "Behind-The-Standard Edit",
    "Micro-Authority Checklist",
    "Comment-First Comparison",
    "Real-Life Friction Turn",
    "Founder Taste Audit",
    "Local Context Lens",
    "Soft Objection Turn",
    "Saveable Sorting Signal",
    "One-Minute Trust Audit",
    "Tiny Upgrade Sequence",
    "Expectation Reset",
    "Proof-First Walkthrough",
    "Taste Boundary Test",
    "Viewer Vote Framework",
    "Calm Expert Breakdown"
  )
  $settingAngles = @("studio corner", "morning desk", "hotel counter", "car seat setup", "venue entrance", "window light table", "phone notes screen", "clean shelf", "street-side pause", "quiet checkout moment")
  $proofAngles = @("texture check", "time-saving cue", "price-context note", "comfort signal", "use-case boundary", "audience objection", "comparison frame", "mini checklist", "mistake correction", "final save map")
  $tensionAngles = @("too many options", "premium but practical", "popular but not always right", "simple but overlooked", "beautiful but unclear", "fast but considered", "sponsored but transparent", "polished but human", "specific but reusable", "expert but relatable")
  $visualMotifs = @("mirror note", "two-tray edit", "receipt reveal", "map pin", "voice memo", "calendar mark", "object lineup", "corner detail", "before-choice pause", "save card", "field label")
  $payoffModes = @("screen-shot checklist", "viewer vote", "soft objection answer", "micro tutorial", "ranked decision", "mistake repair", "context boundary", "premium shortcut", "myth reset", "side-by-side choice", "quiet confidence", "field note")
  $audienceRoles = @("busy beginner", "taste-driven follower", "skeptical buyer", "local explorer", "quiet luxury viewer", "practical planner", "comment-first fan", "brand-aware shopper", "routine optimizer", "curious saver", "comparison seeker", "high-trust follower", "repeat viewer")
  $actionVerbs = @("sorts", "audits", "trims", "tests", "maps", "filters", "pauses", "compares", "screens", "frames", "rebuilds", "ranks", "softens", "translates", "anchors", "separates", "calibrates")
  $laneAdjectives = @("polished", "grounded", "cinematic", "tactile", "local", "editorial", "practical", "quiet", "sensory", "selective", "credible", "warm", "sharp", "human", "premium", "minimal", "confident", "observant", "fresh")
  $laneNouns = @("compass", "threshold", "ledger", "atlas", "signal", "ritual", "frame", "cue", "marker", "lens", "index", "map", "filter", "sequence", "anchor", "notebook", "receipt", "proof", "standard")
  $laneObjects = @("saved note", "choice card", "detail tray", "context strip", "proof tile", "comment board", "viewer receipt", "micro map", "taste meter", "trust card", "caption shelf", "setup label", "scene marker", "decision tab", "utility slip", "boundary card", "sorting line")
  $premiseTemplates = @(
    "A {persona} creator {verb} a {category} moment with a {visual}, then turns the {proof} into a saveable answer for the {audience}.",
    "For {category}, the Reel opens on a {setting}, uses a {proof}, and resolves {tension} with a {payoff}.",
    "A {persona} creator reframes {category} through {visual}: one kept choice, one removed choice, and one {payoff} for the {audience}.",
    "The card turns {category} confusion into a {proof}-led decision, using a {setting} and a comment prompt built for the {audience}.",
    "A premium but practical {category} Reel shows how the creator {verb} the setup, handles {tension}, and lands on a {payoff}.",
    "The creator starts with a {visual}, proves the choice through a {proof}, and gives the {audience} a cleaner way to decide.",
    "This {category} idea uses a {setting} as the hook, a {proof} as the trust signal, and a {payoff} as the save trigger.",
    "A {persona} creator makes {category} feel less noisy by showing the {visual}, naming {tension}, and ending with a {payoff}."
  )
  $scenario = $scenarioNames[$Index % $scenarioNames.Count]
  $settingAngle = $settingAngles[$Index % $settingAngles.Count]
  $proofAngle = $proofAngles[($Index * 3) % $proofAngles.Count]
  $tensionAngle = $tensionAngles[($Index * 7) % $tensionAngles.Count]
  $visualMotif = $visualMotifs[($Index * 5) % $visualMotifs.Count]
  $payoffMode = $payoffModes[($Index * 7) % $payoffModes.Count]
  $audienceRole = $audienceRoles[($Index * 11) % $audienceRoles.Count]
  $actionVerb = $actionVerbs[($Index * 13) % $actionVerbs.Count]
  $laneAdjective = $laneAdjectives[($Index * 7) % $laneAdjectives.Count]
  $laneNoun = $laneNouns[($Index * 11) % $laneNouns.Count]
  $laneObject = $laneObjects[($Index * 13) % $laneObjects.Count]
  $creativeLane = "$laneAdjective $laneNoun"
  $premiseTemplate = $premiseTemplates[$Index % $premiseTemplates.Count]
  $variant = "{0:D3}" -f $Index
  $decisionLens = "$categoryTitle decision filter"
  $bandSlot = ($Index - 1) % 10
  $targetBand = if ($bandSlot -lt 4) { "low" } elseif ($bandSlot -lt 6) { "mid" } else { "high" }
  $candidateMechanisms = switch ($targetBand) {
    "low" { @("VIA-132") }
    "mid" { @("VIA-132", "VIA-145") }
    default { @("VIA-132", "VIA-145", "VIA-150", "VIA-160") }
  }
  $candidateLayers = switch ($targetBand) {
    "low" { @("T02") }
    "mid" { @("T02", "T03", "T07") }
    default { @("T02", "T03", "T07", "T08", "T12") }
  }
  $candidateHooks = switch ($targetBand) {
    "low" {
      @("The part that looks effortless is actually one small $proofAngle.")
    }
    "mid" {
      @(
        "The part that looks effortless is actually one small $proofAngle.",
        "Before you copy the final result, look at this $creativeLane filter."
      )
    }
    default {
      @(
        "The part that looks effortless is actually one small $proofAngle.",
        "Before you copy the final result, look at this $creativeLane filter.",
        "This is the $decisionLens I would save first.",
        "The premium version is not louder; it is more selective about $tensionAngle.",
        "Which option would you remove from this setup?"
      )
    }
  }
  $candidateBeats = switch ($targetBand) {
    "low" { @("visual hook", "proof detail") }
    "mid" { @("visual hook", "premise", "proof detail", "save CTA") }
    default { @("visual hook", "premise", "proof detail", "decision boundary", "payoff", "comment prompt", "save CTA") }
  }
  $externalId = "{0}_{1}_{2}" -f (ConvertTo-SlugText $BatchId), (ConvertTo-SlugText $categorySlug), $variant
  $safeCategoryPhrase = if ($family -eq "instagram_business") { "$categoryTitle experience" } else { "$categoryTitle content" }
  $audiencePain = "too many options and not enough trusted context"
  $firstVisual = "A polished final shot cuts to the small decision that made it work."
  $title = New-PremiumCardTitle -Scenario $scenario -CategorySlug $categorySlug -CategoryTitle $categoryTitle -Index $Index
  $premise = $premiseTemplate
  $premise = $premise.Replace("{persona}", $personaDisplay)
  $premise = $premise.Replace("{verb}", $actionVerb)
  $premise = $premise.Replace("{category}", $safeCategoryPhrase)
  $premise = $premise.Replace("{visual}", $visualMotif)
  $premise = $premise.Replace("{proof}", $proofAngle)
  $premise = $premise.Replace("{audience}", $audienceRole)
  $premise = $premise.Replace("{setting}", $settingAngle)
  $premise = $premise.Replace("{tension}", $tensionAngle)
  $premise = $premise.Replace("{payoff}", $payoffMode)
  $premise = "$premise The creative lane is a $creativeLane built around a $laneObject."

  $practicalEffects = New-PracticalEffects
  $appliedLayers = @($allLayerKeys)

  return @{
    external_idea_id = $externalId
    title = $title
    one_sentence_premise = $premise
    mechanism_ids = @($candidateMechanisms)
    category_slug = $categorySlug
    persona_tags = @($Persona)
    content_style_layers = @($candidateLayers)
    hook_options = @($candidateHooks)
    story_beats = @($candidateBeats)
    platform = "instagram_reels"
    idea_card = @{
      title = $title
      concept = "$categoryTitle $scenario"
      format = "reels_30_45"
      brand_lift_statement = "$($personaProfile.brand) This idea turns $safeCategoryPhrase into a distinctive audience promise instead of a generic post."
      premium_decision_note = "This card is built as a complete premium execution system: hook, proof, scene plan, visual direction, caption logic, safety boundaries, and platform variants."
      idea_summary = @{
        premise = "The creator reveals the hidden decision behind a polished $safeCategoryPhrase moment using a $settingAngle and a $proofAngle."
        target_emotion = "The audience feels invited into a smarter, more premium way to choose when $tensionAngle is handled clearly."
        creator_takeaway = "Show the decision process, not only the final result."
      }
      why_it_can_work = @{
        share_trigger = "Viewers recognize the gap between polished outcomes and the small decisions behind them."
        save_trigger = "The decision filter gives the audience something reusable."
        trust_trigger = "The creator names context and boundaries instead of making oversized promises."
      }
      creator_presence_mode = @{
        mode = $personaDisplay
        delivery_style = $personaProfile.delivery
        why_it_fits_creator = "This creator mode fits because $($personaProfile.audience)"
        avoid = "Avoid copying a celebrity voice, overpromising outcomes, or turning the post into a hard sell."
      }
      atmosphere_direction = @{
        mood = "Premium, useful, intimate, and real."
        visual_texture = $personaProfile.visual
        color_language = "Neutral base, one controlled accent color, clean light, and uncluttered framing."
        soundscape = "Soft ambient bed, crisp object sounds, and clear voiceover."
      }
      hook_performance_pack = @{
        hook_options = @(
          "The part that looks effortless is actually one small $proofAngle.",
          "Before you copy the final result, look at this $settingAngle filter.",
          "This is the $decisionLens I would save first.",
          "The premium version is not louder; it is more selective about $tensionAngle.",
          "Which option would you remove from this setup?"
        )
        luxury_hook = "The premium choice is the one you can explain calmly."
        relatable_hook = "I used to make this harder than it needed to be."
        comedy_hook = "My decision process briefly became a tiny board meeting."
        first_second_visual_hook = "$firstVisual The frame starts with a $laneObject in the $settingAngle."
        first_line_hook = "The part that looks effortless is actually one small $proofAngle."
        comment_trigger_hook = "What would you remove from this decision?"
      }
      video_blueprint = @{
        duration_seconds = 38
        opening_visual = "$firstVisual Use the $laneObject and the $settingAngle as the visual anchor."
        scene_arc = "Final curiosity -> hidden decision -> $proofAngle -> boundary -> saveable payoff."
        payoff_visual = "Creator holds or points to a three-step decision filter on screen."
      }
      scene_script = @(
        @{ second = "0-3"; purpose = "attention"; voiceover = "The part that looks effortless is actually one small $proofAngle."; spoken_lines = @("Watch the decision before the result."); on_screen_text = "The hidden decision" },
        @{ second = "4-10"; purpose = "premise"; voiceover = "For this $categoryTitle moment, I start from the $creativeLane and the $settingAngle instead of adding more noise."; spoken_lines = @("I start here."); on_screen_text = "One filter first" },
        @{ second = "11-24"; purpose = "proof"; voiceover = "Here is the proof detail: $proofAngle, what I kept, what I removed, and why it fits this context."; spoken_lines = @("This is the boundary."); on_screen_text = "Keep / remove / why" },
        @{ second = "25-34"; purpose = "payoff"; voiceover = "Save this if you want a cleaner way to make the same decision."; spoken_lines = @("Save the filter, not just the final shot."); on_screen_text = "Save the filter" },
        @{ second = "35-38"; purpose = "comment"; voiceover = "Tell me which option you would remove first."; spoken_lines = @("What would you remove?"); on_screen_text = "Comment your first remove" }
      )
      shot_list = @(
        @{ second = "0-2"; shot = "Tight final reveal"; action = "Show the polished result for one second, then interrupt it from the $settingAngle."; overlay = "Not the final. The decision." },
        @{ second = "3-8"; shot = "Overhead decision table"; action = "Place three options in frame and remove one with a clear gesture."; overlay = "Keep / remove / why" },
        @{ second = "9-20"; shot = "Medium creator frame"; action = "Explain the context boundary in one sentence."; overlay = "Context matters" },
        @{ second = "21-32"; shot = "Detail proof close-up"; action = "Show the $proofAngle that supports the choice."; overlay = "Proof detail" },
        @{ second = "33-38"; shot = "Checklist payoff"; action = "Hold the $laneObject and three-step filter long enough to screenshot."; overlay = "Save this filter" }
      )
      b_roll_plan = @(
        @{ type = "product_closeup"; shot = "Close-up of the selected object, place, or $proofAngle."; note = "Show context, not a miracle claim." },
        @{ type = "hand_movement"; shot = "A slow remove-or-choose gesture."; note = "Make the decision physically visible." },
        @{ type = "environment_detail"; shot = "One clean $settingAngle atmosphere shot that signals category and taste."; note = "Use this as premium texture." },
        @{ type = "preparation_moment"; shot = "The $laneObject setup before the final frame."; note = "Makes the polished result feel earned." },
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
          "The premium part is the $creativeLane you can explain.",
          "Save this before you copy the final shot from the $settingAngle.",
          "Less noise, clearer context, better $categoryTitle decisions around $tensionAngle."
        )
        on_screen_text = @("The hidden decision", "Keep / remove / why", "Save the filter")
        cta = "Save this $creativeLane filter and use it before your next $categoryTitle decision."
      }
      comment_engine = @{
        pinned_comment = "What would you remove from this decision first?"
        audience_question = "Which option would make this feel cleaner, safer, or more premium when $tensionAngle is the problem?"
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
        disclosure_text = "If sponsored, use a clear #ad disclosure at the start of the caption and video."
        claim_boundary = "No medical claim, no financial claim, and no universal result promise. Frame this as creator context and decision support."
        do_not_say = @("This works for everyone", "Guaranteed result", "You must buy this", "This fixes the problem")
        evidence_note = "Evidence is required for any performance claim; otherwise replace it with personal-context wording."
        safer_alternative_phrase = "In my context, this is the cleaner decision."
      }
      production_notes = @{
        props = @("phone", "tripod", "decision card", "three category-relevant options")
        wardrobe = "Clean outfit that matches the category mood."
        location = "Home, studio corner, hotel room, car, shop, venue, or desk setup depending on category."
        safety = "No medical claim, no financial claim, no legal advice, and no guaranteed outcome claims unless properly substantiated."
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
        brand_equity = "$($personaProfile.brand) The $personaDisplay mode makes this feel tailored rather than templated."
        audience_aftertaste = $personaProfile.audience
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
  $normalizedSlugs = @(([string]$CategorySlugs).Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  if ($normalizedSlugs.Count -gt 0) {
    $quoted = ($normalizedSlugs | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }) -join ","
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

function Get-CurrentPublishedStock {
  param(
    [Parameter(Mandatory = $true)][string]$CategorySlug,
    [Parameter(Mandatory = $true)][string]$PersonaSlug
  )

  $safeCategory = $CategorySlug -replace "'", "''"
  $safePersona = $PersonaSlug -replace "'", "''"
  $sql = @"
select count(inv.id)
from public.idea_inventory inv
join public.categories c on c.id = inv.category_id
join public.creator_personas p on p.id = inv.persona_id
where c.slug = '$safeCategory'
  and p.slug = '$safePersona'
  and (inv.metadata->>'external_batch_id') like 'stock\\_cards\\_%' escape '\\';
"@
  $raw = Invoke-DbSql -Sql $sql | Select-Object -First 1
  if ([string]::IsNullOrWhiteSpace($raw)) { return 0 }
  return [int]$raw
}

function Get-PublishedStockMap {
  $sql = @"
select c.slug || '|' || p.slug as route_key, count(inv.id)
from public.idea_inventory inv
join public.categories c on c.id = inv.category_id
join public.creator_personas p on p.id = inv.persona_id
where (inv.metadata->>'external_batch_id') like 'stock\\_cards\\_%' escape '\\'
group by c.slug, p.slug;
"@
  $map = @{}
  $rows = @(Invoke-DbSql -Sql $sql)
  foreach ($row in $rows) {
    if ([string]::IsNullOrWhiteSpace($row)) { continue }
    $parts = $row -split "`t"
    if ($parts.Count -ge 2) {
      $map[$parts[0]] = [int]$parts[1]
    }
  }
  return $map
}

function Get-StockFromMap {
  param(
    [Parameter(Mandatory = $true)][hashtable]$StockMap,
    [Parameter(Mandatory = $true)][string]$CategorySlug,
    [Parameter(Mandatory = $true)][string]$PersonaSlug
  )

  $key = "$CategorySlug|$PersonaSlug"
  if ($StockMap.ContainsKey($key)) {
    return [int]$StockMap[$key]
  }
  return 0
}

try {
  if ($CardsPerCategory -lt 1) {
    throw "CardsPerCategory must be positive."
  }

  $categories = @(Get-Categories)
  if ($categories.Count -eq 0) {
    throw "No enabled categories matched the request."
  }

  $totalTarget = $categories.Count * $CardsPerCategory
  Write-Host "Preparing $totalTarget cards: $CardsPerCategory per category across $($categories.Count) categories."
  $stockMap = @{}
  if ($TopUpExistingStock) {
    Write-Host "Loading current published stock map..."
    $stockMap = Get-PublishedStockMap
  }

  if ($DryRun) {
    $preview = foreach ($category in $categories) {
      $persona = Get-PersonaForCategory -Slug $category.slug -Family $category.family
      $existing = if ($TopUpExistingStock) { Get-StockFromMap -StockMap $stockMap -CategorySlug $category.slug -PersonaSlug $persona } else { 0 }
      [pscustomobject]@{
        slug = $category.slug
        name = $category.name
        family = $category.family
        persona = $persona
        existing_stock = $existing
        missing_to_target = [Math]::Max(0, $CardsPerCategory - $existing)
      }
    }
    $preview | Select-Object -First 40 | Format-Table -AutoSize
    if ($TopUpExistingStock) {
      $missingTotal = ($preview | Measure-Object -Property missing_to_target -Sum).Sum
      $readyCategories = @($preview | Where-Object { $_.missing_to_target -eq 0 }).Count
      Write-Host "Top-up dry run: $readyCategories/$($preview.Count) category/persona routes already meet target. Missing cards to target: $missingTotal."
    }
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
    target_published_cards = $totalTarget
    imported = 0
    rejected = 0
    scored = 0
    published = 0
    skipped_categories = 0
    existing_stock_counted = 0
    failed_categories = @()
  }

  $categoryIndex = 0
  foreach ($category in $categories) {
    $categoryIndex += 1
    $persona = Get-PersonaForCategory -Slug $category.slug -Family $category.family
    Write-Host "[$categoryIndex/$($categories.Count)] $($category.slug) / $persona"

    try {
      $existingForCategory = if ($TopUpExistingStock) { Get-StockFromMap -StockMap $stockMap -CategorySlug $category.slug -PersonaSlug $persona } else { 0 }
      $summary.existing_stock_counted += $existingForCategory
      if ($TopUpExistingStock -and $existingForCategory -ge $CardsPerCategory) {
        $summary.skipped_categories += 1
        Write-Host "  existing $existingForCategory/$CardsPerCategory, skipping"
        continue
      }

      $publishedForCategory = $existingForCategory
      $attempt = 0
      $indexOffset = 0

      while ($publishedForCategory -lt $CardsPerCategory -and $attempt -lt $MaxTopUpAttempts) {
        $attempt += 1
        $remaining = $CardsPerCategory - $publishedForCategory
        $batchSize = if ($attempt -eq 1) { $remaining } else { [Math]::Min(180, [Math]::Max(50, [Math]::Ceiling($remaining * 2.0))) }
        $batchId = "{0}_{1}_{2}_a{3}" -f $externalPrefix, (ConvertTo-SlugText $category.slug), $persona, $attempt

        $batch = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches" -Body @{
          external_batch_id = $batchId
          category_slug = $category.slug
          persona_slug = $persona
          target_count = $batchSize
          language = "en"
          platform = "instagram_reels"
          generator_version = "bulk-stock-v1.0.0"
          source_mode = "admin_direct"
          manifest = @{
            batch_id = $batchId
            category_slug = $category.slug
            persona_slug = $persona
            target_count = $batchSize
            language = "en"
            platform = "instagram_reels"
            generator_version = "bulk-stock-v1.0.0"
            top_up_attempt = $attempt
            target_published_cards = $CardsPerCategory
          }
        }

        $ideas = for ($i = 1; $i -le $batchSize; $i++) {
          New-PremiumIdea -Category $category -Persona $persona -Index ($indexOffset + $i) -BatchId $batchId
        }
        $indexOffset += $batchSize

        $import = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/import" -Body @{ ideas = @($ideas) }
        $summary.imported += [int]$import.imported
        $summary.rejected += [int]$import.rejected

        for ($offset = 0; $offset -lt $batchSize; $offset += $ScoreChunkSize) {
          $score = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/score" -Body @{
            limit = $ScoreChunkSize
            offset = $offset
          }
          $summary.scored += [int]$score.scored
        }

        for ($offset = 0; $offset -lt $batchSize; $offset += $PublishChunkSize) {
          $finalChunk = ($offset + $PublishChunkSize) -ge $batchSize
          $publish = Invoke-JsonPost -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/publish-inventory" -Body @{
            quality_floor = $QualityFloor
            max_reuse_count = 1
            limit = $PublishChunkSize
            offset = $offset
            final_chunk = $finalChunk
          }
          $publishedNow = [int]$publish.published_inventory
          $summary.published += $publishedNow
          $publishedForCategory += $publishedNow
        }

        Write-Host "  published $publishedForCategory/$CardsPerCategory after attempt $attempt"
      }

      if ($publishedForCategory -lt $CardsPerCategory) {
        $summary.failed_categories += @([ordered]@{ slug = $category.slug; persona = $persona; error = "published $publishedForCategory of $CardsPerCategory after $MaxTopUpAttempts attempts" })
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