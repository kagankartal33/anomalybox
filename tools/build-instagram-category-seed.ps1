param(
  [string]$LocalCategoryFile = ".\instagram_tum_kategoriler_birlesik.md",
  [string]$OutputSql = ".\supabase\seeds\instagram_categories.sql",
  [string]$SourceUrl = "https://thepennymatters.com/instagram-categories-list/"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Convert-Slug([string]$Name) {
  $s = $Name.ToLowerInvariant()
  $s = $s -replace ([string][char]0x2019), ""
  $s = $s -replace ([string][char]0x2018), ""
  $s = $s.Replace("'", "")
  $s = $s -replace "&", " and "
  $s = $s -replace "\+", " plus "
  $s = $s -replace "/", " "
  $s = $s -replace "\([^)]*\)", " "
  $s = $s -replace "[^a-z0-9]+", "_"
  $s = ($s.Trim("_") -replace "_+", "_")
  if ([string]::IsNullOrWhiteSpace($s)) {
    $s = "category"
  }
  return $s
}

function SqlQuote([string]$Value) {
  return "'" + ($Value -replace "'", "''") + "'"
}

function JsonSql([object]$Value) {
  $json = $Value | ConvertTo-Json -Depth 12 -Compress
  return (SqlQuote $json) + "::jsonb"
}

function RiskFor([string]$Name) {
  $n = $Name.ToLowerInvariant()
  if ($n -match "adult|gambling|casino|gun range|tobacco|sex therapist|lottery") {
    return "restricted"
  }
  if ($n -match "medical|health|doctor|dentist|therapist|psychologist|psychiatrist|hospital|clinic|pharmacy|drug|addiction|nutrition|supplement|weight loss|pregnancy|child|children|baby|finance|financial|investment|bank|loan|mortgage|lawyer|law firm|legal|insurance|tax|political|government|public figure|immigration|obgyn|surgeon|urologist|oncologist|pediatrician|dermatologist|mental|veterinarian") {
    return "medium"
  }
  return "low"
}

function LayersFor([string]$Name, [string]$Family) {
  $n = $Name.ToLowerInvariant()
  $layers = [System.Collections.Generic.List[string]]::new()
  foreach ($layer in @("T01", "T02", "T07")) {
    $layers.Add($layer)
  }
  if ($n -match "luxury|jewelry|watch|hotel|resort|real estate|fashion|beauty|spa|salon") {
    $layers.Add("T08")
  }
  if ($n -match "education|school|teacher|tutor|consultant|tech|software|ai|science|finance|medical|health") {
    $layers.Add("T10")
  }
  if ($n -match "food|restaurant|cafe|bakery|coffee|recipe|cooking") {
    $layers.Add("T03")
  }
  if ($n -match "family|parent|baby|children|mental|health|medical|law|finance|government") {
    $layers.Add("T12")
  }
  if ($Family -eq "creator_content") {
    $layers.Add("T09")
  }
  return @($layers | Select-Object -Unique)
}

function Add-Category($Map, [string]$Name, [string]$Source, [string]$Group, [string]$Family, [string]$PreferredSlug = "") {
  $clean = (($Name -replace "\s+", " ").Trim())
  if (-not $clean) {
    return
  }
  if ($clean -match "^[-*_]+$|^Genel$|^Not$") {
    return
  }

  $slug = if ($PreferredSlug) { $PreferredSlug } else { Convert-Slug $clean }
  if (-not $Map.Contains($slug)) {
    $Map[$slug] = [ordered]@{
      slug = $slug
      name = $clean
      family = $Family
      risk_level = RiskFor $clean
      sources = [System.Collections.Generic.List[string]]::new()
      display_groups = [System.Collections.Generic.List[string]]::new()
      aliases = [System.Collections.Generic.List[string]]::new()
    }
  } else {
    if ($Map[$slug].name -ne $clean -and -not $Map[$slug].aliases.Contains($clean)) {
      $Map[$slug].aliases.Add($clean)
    }
    if ($Family -eq "creator_content") {
      $Map[$slug].family = "creator_content"
    }
    $risk = RiskFor $clean
    if ($risk -eq "restricted" -or ($risk -eq "medium" -and $Map[$slug].risk_level -eq "low")) {
      $Map[$slug].risk_level = $risk
    }
  }

  if (-not $Map[$slug].sources.Contains($Source)) {
    $Map[$slug].sources.Add($Source)
  }
  if ($Group -and -not $Map[$slug].display_groups.Contains($Group)) {
    $Map[$slug].display_groups.Add($Group)
  }
}

$map = [ordered]@{}

$html = (Invoke-WebRequest -Uri $SourceUrl -UseBasicParsing -TimeoutSec 30).Content
$tds = [regex]::Matches($html, "<td[^>]*>([\s\S]*?)</td>", "IgnoreCase")
foreach ($match in $tds) {
  $value = $match.Groups[1].Value -replace "<[^>]+>", " "
  $value = [System.Net.WebUtility]::HtmlDecode($value)
  $value = ($value -replace "\s+", " ").Trim()
  if ($value -and $value.Length -lt 90 -and $value -notmatch "^[0-9]+$") {
    Add-Category $map $value "the_penny_matters_2026" "Instagram Business Categories" "instagram_business"
  }
}

$currentGroup = $null
Get-Content -Path $LocalCategoryFile -Encoding UTF8 | ForEach-Object {
  $line = $_.Trim()
  if ($line -match "^##\s+\d+\.\s+(.+)$") {
    $currentGroup = $Matches[1].Trim()
    return
  }
  if ($line -match "^-\s+(.+)$") {
    $name = $Matches[1].Trim()
    if ($name -notmatch "^artifacts klas|^https?://|^\*\*") {
      Add-Category $map $name "local_influencer_niches" $currentGroup "creator_content"
    }
  }
}

$coreCategories = @(
  @("beauty", "Beauty", "Core Creator Category"),
  @("fashion", "Fashion", "Core Creator Category"),
  @("travel", "Travel", "Core Creator Category"),
  @("lifestyle", "Lifestyle", "Core Creator Category"),
  @("food", "Food", "Core Creator Category"),
  @("luxury", "Luxury", "Core Creator Category"),
  @("commerce_affiliate", "Commerce & Affiliate", "Core Creator Category"),
  @("creator_education", "Creator Education", "Core Creator Category"),
  @("thought_leadership", "Thought Leadership", "Core Creator Category"),
  @("parenting_family", "Parenting & Family", "Core Creator Category"),
  @("entertainment_comedy", "Entertainment Comedy", "Core Creator Category"),
  @("fitness_wellness_safe", "Fitness & Wellness Safe", "Core Creator Category")
)
foreach ($category in $coreCategories) {
  Add-Category $map $category[1] "viralbox_core" $category[2] "creator_content" $category[0]
}

$rows = @()
$sortOrder = 1000
foreach ($item in ($map.Values | Sort-Object @{ Expression = "family"; Descending = $true }, name)) {
  $metadata = [ordered]@{
    sources = @($item.sources)
    display_groups = @($item.display_groups)
    aliases = @($item.aliases)
    selection_surface = "influencer_onboarding_and_box_purchase"
    generator_use = "batch_stock_generation"
    platform_fit = @("instagram_reels", "instagram_stories", "instagram_carousel")
    suggested_layers = @(LayersFor $item.name $item.family)
    safety_note = if ($item.risk_level -eq "restricted") {
      "Requires admin review and stricter brand-safety boundaries before generation."
    } elseif ($item.risk_level -eq "medium") {
      "Use evidence, disclosure, claim-boundary, and privacy checks."
    } else {
      "Standard creator and brand-safety checks apply."
    }
  }

  $rowValues = @(
    (SqlQuote $item.slug),
    (SqlQuote $item.name),
    (SqlQuote $item.family),
    (SqlQuote $item.risk_level),
    $sortOrder,
    (JsonSql $metadata),
    "true"
  )
  $rows += "(" + ($rowValues -join ", ") + ")"
  $sortOrder += 10
}

$summary = [ordered]@{
  generated_at = "2026-06-29"
  source_files = @($LocalCategoryFile)
  source_urls = @($SourceUrl)
  total_categories = $map.Count
  the_penny_matters_unique_categories = ($map.Values | Where-Object { $_.sources.Contains("the_penny_matters_2026") }).Count
  local_influencer_niche_categories = ($map.Values | Where-Object { $_.sources.Contains("local_influencer_niches") }).Count
  use_case = "Influencer selects one or more categories before buying 500/1000 USD viral idea boxes; admin/generator uses the same slug for stock generation and inventory health."
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputSql) | Out-Null

$sql = @()
$sql += "-- Generated from instagram_tum_kategoriler_birlesik.md and The PennyMatters Instagram category table."
$sql += "-- Rebuild with tools/build-instagram-category-seed.ps1 when the source catalogue changes."
$sql += "insert into public.categories ("
$sql += "  slug, name, family, risk_level, sort_order, metadata, enabled"
$sql += ") values"
$sql += ($rows -join ",`r`n")
$sql += "on conflict (slug) do update set"
$sql += "  name = excluded.name,"
$sql += "  family = case when public.categories.family = 'creator_content' or excluded.family = 'creator_content' then 'creator_content' else excluded.family end,"
$sql += "  risk_level = case when public.categories.risk_level = 'restricted' or excluded.risk_level = 'restricted' then 'restricted' when public.categories.risk_level = 'medium' or excluded.risk_level = 'medium' then 'medium' else 'low' end,"
$sql += "  sort_order = least(public.categories.sort_order, excluded.sort_order),"
$sql += "  metadata = public.categories.metadata || excluded.metadata,"
$sql += "  enabled = true,"
$sql += "  updated_at = now();"
$sql += ""
$sql += "insert into public.admin_configs (namespace, version, config, enabled)"
$sql += "values ('taxonomy.instagram_categories', '2026-06-29', $(JsonSql $summary), true)"
$sql += "on conflict (namespace, version) do update set"
$sql += "  config = excluded.config,"
$sql += "  enabled = excluded.enabled;"

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$outputFullPath = [System.IO.Path]::GetFullPath($OutputSql)
[System.IO.File]::WriteAllText($outputFullPath, ($sql -join "`r`n"), $utf8NoBom)

[pscustomobject]@{
  generated_categories = $map.Count
  the_penny_matters_unique_categories = $summary.the_penny_matters_unique_categories
  local_influencer_niche_categories = $summary.local_influencer_niche_categories
  output = $OutputSql
}
