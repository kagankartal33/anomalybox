param(
  [string]$OutDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\huggingface\raw",
  [ValidateSet("p0", "p0_p1_text")]
  [string]$Preset = "p0",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$p0Datasets = @(
  "SocialGrep/one-million-reddit-jokes",
  "SocialGrep/one-million-reddit-questions",
  "SocialGrep/one-million-reddit-confessions",
  "ctr4si/reddit_tifu",
  "tskolm/youtube_top_popular_videos_comments"
)

$p1TextDatasets = @(
  "prakhars/instagram_captions",
  "databoks-irfan/labeled-instagram-comments",
  "cardiffnlp/tweet_eval",
  "underscore2/bluesky_engagement_posts_kto",
  "bhavyagiri/semantic-memes"
)

$datasets = @($p0Datasets)
if ($Preset -eq "p0_p1_text") {
  $datasets += $p1TextDatasets
}

function Get-SafePathPart {
  param([Parameter(Mandatory = $true)][string]$Value)
  return ($Value -replace '[^A-Za-z0-9._-]+', '_').Trim("_")
}

function Invoke-HfJson {
  param([Parameter(Mandatory = $true)][string]$Dataset)

  $uri = "https://datasets-server.huggingface.co/parquet?dataset=$([uri]::EscapeDataString($Dataset))"
  Invoke-RestMethod -Uri $uri -TimeoutSec 60
}

function Get-HfRepoFileMetadata {
  param(
    [Parameter(Mandatory = $true)][string]$Dataset,
    [Parameter(Mandatory = $true)][string]$FilePath
  )

  $script = @"
from huggingface_hub import HfApi
api = HfApi()
info = api.repo_info("$Dataset", repo_type="dataset", files_metadata=True)
for sibling in info.siblings:
    if sibling.rfilename == "$FilePath":
        print(getattr(sibling, "size", "") or "")
        break
"@
  $result = $script | python -
  if (-not $result) {
    throw "Could not resolve metadata for $Dataset/$FilePath"
  }
  return [int64]$result.Trim()
}

function Download-HfRepoFile {
  param(
    [Parameter(Mandatory = $true)][string]$Dataset,
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Target
  )

  $url = "https://huggingface.co/datasets/$Dataset/resolve/main/$FilePath"
  Invoke-WebRequest -Uri $url -OutFile $Target -UseBasicParsing -TimeoutSec 1800
}

$root = Resolve-Path -LiteralPath "."
if ([System.IO.Path]::IsPathRooted($OutDir)) {
  $outPath = $OutDir
} else {
  $outPath = Join-Path $root $OutDir
}
New-Item -ItemType Directory -Force -Path $outPath | Out-Null

$manifest = [ordered]@{
  preset = $Preset
  created_at = (Get-Date).ToUniversalTime().ToString("o")
  output_dir = $outPath
  datasets = @()
}

foreach ($dataset in $datasets) {
  if ($dataset -eq "ctr4si/reddit_tifu") {
    $filePath = "data/tifu_all_tokenized_and_filtered.json.gz"
    $expectedSize = Get-HfRepoFileMetadata -Dataset $dataset -FilePath $filePath
    $datasetDir = Join-Path $outPath (Get-SafePathPart $dataset)
    $splitDir = Join-Path $datasetDir "raw"
    New-Item -ItemType Directory -Force -Path $splitDir | Out-Null
    $target = Join-Path $splitDir "tifu_all_tokenized_and_filtered.json.gz"

    if ((Test-Path -LiteralPath $target) -and -not $Force) {
      $actualSize = (Get-Item -LiteralPath $target).Length
      if ($actualSize -eq $expectedSize) {
        Write-Host "Already downloaded: $target"
        $manifest.datasets += [ordered]@{
          dataset = $dataset
          config = "raw"
          split = "raw"
          filename = "tifu_all_tokenized_and_filtered.json.gz"
          size = $expectedSize
          path = $target
          status = "already_present"
        }
        continue
      }
    }

    Write-Host "Downloading $dataset / raw / $filePath ($expectedSize bytes)"
    Download-HfRepoFile -Dataset $dataset -FilePath $filePath -Target $target
    $downloadedSize = (Get-Item -LiteralPath $target).Length
    if ($downloadedSize -ne $expectedSize) {
      throw "Downloaded size mismatch for $target. Expected $expectedSize, got $downloadedSize"
    }

    $manifest.datasets += [ordered]@{
      dataset = $dataset
      config = "raw"
      split = "raw"
      filename = "tifu_all_tokenized_and_filtered.json.gz"
      size = $expectedSize
      path = $target
      status = "downloaded"
    }
    continue
  }

  Write-Host "Resolving parquet files: $dataset"
  $parquet = Invoke-HfJson -Dataset $dataset
  $files = @($parquet.parquet_files)
  if ($files.Count -eq 0) {
    throw "No parquet files found for $dataset"
  }

  foreach ($file in $files) {
    $datasetDir = Join-Path $outPath (Get-SafePathPart $dataset)
    $splitDir = Join-Path $datasetDir (Join-Path (Get-SafePathPart $file.config) (Get-SafePathPart $file.split))
    New-Item -ItemType Directory -Force -Path $splitDir | Out-Null

    $target = Join-Path $splitDir $file.filename
    $expectedSize = [int64]$file.size

    if ((Test-Path -LiteralPath $target) -and -not $Force) {
      $actualSize = (Get-Item -LiteralPath $target).Length
      if ($actualSize -eq $expectedSize) {
        Write-Host "Already downloaded: $target"
        $manifest.datasets += [ordered]@{
          dataset = $dataset
          config = $file.config
          split = $file.split
          filename = $file.filename
          size = $expectedSize
          path = $target
          status = "already_present"
        }
        continue
      }
    }

    Write-Host "Downloading $dataset / $($file.config) / $($file.split) / $($file.filename) ($expectedSize bytes)"
    Invoke-WebRequest -Uri $file.url -OutFile $target -UseBasicParsing -TimeoutSec 1800

    $downloadedSize = (Get-Item -LiteralPath $target).Length
    if ($downloadedSize -ne $expectedSize) {
      throw "Downloaded size mismatch for $target. Expected $expectedSize, got $downloadedSize"
    }

    $manifest.datasets += [ordered]@{
      dataset = $dataset
      config = $file.config
      split = $file.split
      filename = $file.filename
      size = $expectedSize
      path = $target
      status = "downloaded"
    }
  }
}

$manifestPath = Join-Path $outPath "download_manifest_$Preset.json"
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host "Downloaded parquet files to: $outPath"
Write-Host "Manifest: $manifestPath"
