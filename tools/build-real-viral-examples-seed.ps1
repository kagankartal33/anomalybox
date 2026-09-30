param(
  [int]$TargetCount = 1000,
  [string]$OutputSql = ".\supabase\seeds\real_viral_examples.sql"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function SqlQuote([string]$Value) {
  return "'" + (($Value ?? "") -replace "'", "''") + "'"
}

function JsonSql([object]$Value) {
  return (SqlQuote ($Value | ConvertTo-Json -Depth 12 -Compress)) + "::jsonb"
}

function Normalize-Slug([string]$Value) {
  $s = $Value.ToLowerInvariant()
  $s = $s -replace "&", " and "
  $s = $s -replace "[^a-z0-9]+", "_"
  $s = ($s.Trim("_") -replace "_+", "_")
  if ([string]::IsNullOrWhiteSpace($s)) { $s = "viral_example" }
  if ($s.Length -gt 80) { $s = $s.Substring(0, 80).Trim("_") }
  return $s
}

function Infer-Type([string]$Name, [string]$ClassLabel) {
  $n = ($Name + " " + $ClassLabel).ToLowerInvariant()
  if ($n -match "challenge|ice bucket|mannequin|bottle|dance") { return "challenge" }
  if ($n -match "video|youtube|tiktok|vine|clip") { return "platform_shift" }
  if ($n -match "hashtag|movement|campaign") { return "social_movement" }
  if ($n -match "ad|advert|marketing|brand|commercial|campaign") { return "marketing_case" }
  return "meme"
}

function Infer-Platform([string]$Name) {
  $n = $Name.ToLowerInvariant()
  if ($n -match "tiktok") { return "tiktok" }
  if ($n -match "youtube") { return "youtube_shorts" }
  if ($n -match "instagram|reels") { return "instagram_reels" }
  if ($n -match "vine") { return "vine" }
  if ($n -match "twitter|x ") { return "x" }
  return "internet"
}

function Infer-Category([string]$Name, [string]$Type) {
  $n = $Name.ToLowerInvariant()
  if ($n -match "food|cake|pizza|coffee|restaurant|recipe") { return "food" }
  if ($n -match "beauty|makeup|skin|hair") { return "beauty" }
  if ($n -match "fashion|outfit|dress|style|luxury") { return "fashion" }
  if ($n -match "travel|hotel|flight|tourist") { return "travel" }
  if ($n -match "ai|tech|software|computer|robot") { return "creator_education" }
  if ($n -match "fitness|gym|health|wellness") { return "fitness_wellness_safe" }
  if ($n -match "brand|ad|commercial|shop|product") { return "commerce_affiliate" }
  if ($Type -eq "social_movement") { return "thought_leadership" }
  return "entertainment_comedy"
}

function PatternFor([string]$Name, [string]$Type) {
  $n = $Name.ToLowerInvariant()
  if ($Type -eq "challenge") { return "publicly documented viral challenge + repeatable constraint + audience participation => abstract safe challenge mechanism" }
  if ($Type -eq "social_movement") { return "publicly documented hashtag/movement + shared phrase + personal or collective signal => awareness cascade mechanism" }
  if ($n -match "reaction|reply|response") { return "publicly documented viral reaction + human interpretation + comment surface => reaction context mechanism" }
  if ($n -match "dance|song|music") { return "publicly documented music/dance trend + audio anchor + recreation loop => remixable performance mechanism" }
  if ($n -match "photo|image|picture") { return "publicly documented image meme + recognizable visual premise + caption variation => template translation mechanism" }
  if ($n -match "video|clip") { return "publicly documented viral video + compressed premise + social retelling => short-form narrative mechanism" }
  return "publicly documented viral internet example + recognizable emotional shape + remixable context => pattern-only training mechanism"
}

function TriggersFor([string]$Name, [string]$Type) {
  $n = $Name.ToLowerInvariant()
  $items = [System.Collections.Generic.List[string]]::new()
  foreach ($x in @("recognition", "curiosity")) { $items.Add($x) }
  if ($Type -eq "challenge") { $items.Add("participation") }
  if ($Type -eq "social_movement") { $items.Add("solidarity") }
  if ($n -match "funny|joke|meme|lol|fail") { $items.Add("humor") }
  if ($n -match "cute|baby|kid|cat|dog") { $items.Add("warmth") }
  if ($n -match "scary|creepy|horror") { $items.Add("tension") }
  if ($n -match "nostalgia|old|throwback") { $items.Add("nostalgia") }
  return @($items | Select-Object -Unique)
}

function Add-Example($Map, [string]$Name, [string]$Source, [string]$Url, [string]$ClassLabel, [Nullable[int]]$Year) {
  $clean = (($Name -replace "\s+", " ").Trim())
  if (-not $clean -or $clean.Length -lt 2) { return }
  if ($clean -match "^Category:|^Template:|^File:|^List of|^Timeline of") { return }
  $slugBase = Normalize-Slug $clean
  $slug = "real_" + $slugBase
  $i = 2
  while ($Map.Contains($slug)) {
    if ($Map[$slug].title -eq $clean) {
      if (-not $Map[$slug].sources.Contains($Source)) { $Map[$slug].sources.Add($Source) }
      if ($Url -and -not $Map[$slug].urls.Contains($Url)) { $Map[$slug].urls.Add($Url) }
      return
    }
    $slug = "real_" + $slugBase + "_" + $i
    $i++
  }
  $type = Infer-Type $clean $ClassLabel
  $Map[$slug] = [ordered]@{
    slug = $slug
    title = $clean
    source = $Source
    sources = [System.Collections.Generic.List[string]]::new()
    urls = [System.Collections.Generic.List[string]]::new()
    class_label = $ClassLabel
    year = if ($Year.HasValue) { $Year.Value } else { 2026 }
    platform = Infer-Platform $clean
    category_slug = Infer-Category $clean $type
    phenomenon_type = $type
    reusable_pattern = PatternFor $clean $type
    triggers = @(TriggersFor $clean $type)
  }
  $Map[$slug].sources.Add($Source)
  if ($Url) { $Map[$slug].urls.Add($Url) }
}

function Invoke-WikidataSparql([string]$Query) {
  $encoded = [uri]::EscapeDataString($Query)
  $uri = "https://query.wikidata.org/sparql?query=$encoded&format=json"
  $headers = @{ "User-Agent" = "ViralBoxTrainingBuilder/1.0 (local research corpus builder)" }
  return Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 60
}

function Get-WikipediaCategoryMembers([string]$Category, [int]$Limit) {
  $results = [System.Collections.Generic.List[object]]::new()
  $continue = $null
  while ($results.Count -lt $Limit) {
    $uri = "https://en.wikipedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:$([uri]::EscapeDataString($Category))&cmlimit=500&cmnamespace=0"
    if ($continue) { $uri += "&cmcontinue=$([uri]::EscapeDataString($continue))" }
    $r = Invoke-RestMethod -Uri $uri -TimeoutSec 30 -Headers @{ "User-Agent" = "ViralBoxTrainingBuilder/1.0" }
    foreach ($m in $r.query.categorymembers) { $results.Add($m) }
    if (-not $r.continue) { break }
    $continue = $r.continue.cmcontinue
  }
  return @($results | Select-Object -First $Limit)
}

$examples = [ordered]@{}

$queries = @(
@"
SELECT ?item ?itemLabel ?classLabel ?date WHERE {
  VALUES ?root { wd:Q2927074 wd:Q1030329 wd:Q60714051 wd:Q6056014 }
  ?item wdt:P31/wdt:P279* ?root .
  OPTIONAL { ?item wdt:P31 ?class . }
  OPTIONAL { ?item wdt:P571|wdt:P577|wdt:P585 ?date . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 2500
"@,
@"
SELECT ?item ?itemLabel ?classLabel ?date WHERE {
  VALUES ?root { wd:Q278485 wd:Q17442446 wd:Q63412991 }
  ?item wdt:P31/wdt:P279* ?root .
  OPTIONAL { ?item wdt:P31 ?class . }
  OPTIONAL { ?item wdt:P571|wdt:P577|wdt:P585 ?date . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1500
"@
)

foreach ($query in $queries) {
  $data = Invoke-WikidataSparql $query
  foreach ($row in $data.results.bindings) {
    $name = $row.itemLabel.value
    $url = $row.item.value
    $class = if ($row.classLabel) { $row.classLabel.value } else { "internet phenomenon" }
    $year = $null
    if ($row.date -and $row.date.value -match "^(\d{4})") { $year = [int]$Matches[1] }
    Add-Example $examples $name "wikidata_sparql" $url $class $year
  }
}

$categories = @(
  "Internet memes",
  "Internet memes introduced in 2024",
  "Internet memes introduced in 2023",
  "Internet memes introduced in 2022",
  "Internet memes introduced in 2021",
  "Internet memes introduced in 2020",
  "Internet memes introduced in 2019",
  "Internet memes introduced in 2018",
  "Internet memes introduced in 2017",
  "Internet memes introduced in 2016",
  "Viral videos",
  "Internet challenges",
  "Internet memes by decade",
  "YouTube videos",
  "TikTok trends",
  "Hashtags"
)
foreach ($cat in $categories) {
  try {
    $members = Get-WikipediaCategoryMembers $cat 500
    foreach ($m in $members) {
      $url = "https://en.wikipedia.org/?curid=$($m.pageid)"
      Add-Example $examples $m.title "wikipedia_category:$cat" $url $cat $null
    }
  } catch {
    Write-Warning "Could not fetch category $cat`: $($_.Exception.Message)"
  }
}

$selected = @($examples.Values | Sort-Object title | Select-Object -First $TargetCount)
if ($selected.Count -lt $TargetCount) {
  throw "Only collected $($selected.Count) real examples; target is $TargetCount."
}

$sourceMetadata = [ordered]@{
  training_policy = "pattern_only"
  real_example_count = $selected.Count
  source_systems = @("Wikidata SPARQL", "Wikipedia categorymembers API")
  anti_copy_required = $true
  generated_at = "2026-06-29"
  note = "Rows contain real documented viral/meme/challenge/video/trend titles, but generator must extract mechanisms only and must not copy titles, people, images, audio, captions or exact execution."
}

$rows = @()
foreach ($item in $selected) {
  $externalRef = $item.slug
  $metadata = [ordered]@{
    real_title = $item.title
    source_systems = @($item.sources)
    source_urls = @($item.urls)
    source_class = $item.class_label
    anti_copy = $true
    use_surface = $false
    training_instruction = "Extract mechanism only; do not copy title, media, catchphrase, person, soundtrack or exact execution."
  }
  $rows += "(" + (@(
    "source.id",
    (SqlQuote $externalRef),
    $item.year,
    (SqlQuote $item.platform),
    (SqlQuote $item.category_slug),
    (SqlQuote ("Real viral example: " + $item.title)),
    (SqlQuote $item.phenomenon_type),
    (SqlQuote ("Documented real internet example from " + (($item.sources | Select-Object -First 1)) + "; use only as abstract viral behavior evidence.")),
    (SqlQuote $item.reusable_pattern),
    (SqlQuote "real-world documented spread"),
    "array[" + (($item.triggers | ForEach-Object { SqlQuote $_ }) -join ",") + "]",
    "array[" + ((@("documented_real_example","anti_copy_required","source_backed") | ForEach-Object { SqlQuote $_ }) -join ",") + "]",
    "array[" + ((@("copy_risk","context_collapse","rights_check") | ForEach-Object { SqlQuote $_ }) -join ",") + "]",
    (SqlQuote "high"),
    (SqlQuote "pattern_only"),
    "'medium'::public.viral_training_risk_level",
    (JsonSql $metadata)
  ) -join ", ") + ")"
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputSql) | Out-Null
$sql = @()
$sql += "-- Generated by tools/build-real-viral-examples-seed.ps1."
$sql += "-- Contains real documented viral/meme/challenge/video/trend examples from Wikidata/Wikipedia."
$sql += "-- Training policy: pattern-only, anti-copy. Do not use titles/surfaces as generated ideas."
$sql += "with source as ("
$sql += "  insert into public.viral_training_sources ("
$sql += "    slug, title, source_type, uri, coverage_start_year, coverage_end_year, reliability_notes, metadata, enabled"
$sql += "  ) values ("
$sql += "    'real_internet_viral_examples_1000',"
$sql += "    '1000 Real Internet Viral Examples Corpus',"
$sql += "    'external_research',"
$sql += "    'wikidata_wikipedia_real_viral_examples',"
$sql += "    1990,"
$sql += "    2026,"
$sql += "    'Real documented viral/meme/challenge/video/trend examples gathered from Wikidata SPARQL and Wikipedia category APIs. Pattern-only training; no surface copying.',"
$sql += "    $(JsonSql $sourceMetadata),"
$sql += "    true"
$sql += "  )"
$sql += "  on conflict (slug) do update set"
$sql += "    title = excluded.title,"
$sql += "    source_type = excluded.source_type,"
$sql += "    uri = excluded.uri,"
$sql += "    coverage_start_year = excluded.coverage_start_year,"
$sql += "    coverage_end_year = excluded.coverage_end_year,"
$sql += "    reliability_notes = excluded.reliability_notes,"
$sql += "    metadata = excluded.metadata,"
$sql += "    enabled = excluded.enabled"
$sql += "  returning id"
$sql += ")"
$sql += "insert into public.viral_training_examples ("
$sql += "  source_id, external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata"
$sql += ")"
$sql += "select source_id, external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata"
$sql += "from ("
$sql += "  values"
$sql += ($rows -join ",`r`n")
$sql += ") as v(source_id, external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata)"
$sql += "on conflict (source_id, external_ref) do update set"
$sql += "  year = excluded.year,"
$sql += "  platform = excluded.platform,"
$sql += "  category_slug = excluded.category_slug,"
$sql += "  title = excluded.title,"
$sql += "  phenomenon_type = excluded.phenomenon_type,"
$sql += "  abstracted_mechanism = excluded.abstracted_mechanism,"
$sql += "  reusable_pattern = excluded.reusable_pattern,"
$sql += "  participation_mode = excluded.participation_mode,"
$sql += "  emotional_triggers = excluded.emotional_triggers,"
$sql += "  format_signals = excluded.format_signals,"
$sql += "  safety_risks = excluded.safety_risks,"
$sql += "  copy_risk = excluded.copy_risk,"
$sql += "  training_use = excluded.training_use,"
$sql += "  risk_level = excluded.risk_level,"
$sql += "  metadata = excluded.metadata,"
$sql += "  updated_at = now();"

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($OutputSql), ($sql -join "`r`n"), $utf8NoBom)

[pscustomobject]@{
  generated_examples = $selected.Count
  collected_candidates = $examples.Count
  output = $OutputSql
  first = $selected[0].title
  last = $selected[-1].title
}