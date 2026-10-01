param(
  [switch]$Apply,
  [int]$Limit = 500
)

$ErrorActionPreference = "Stop"

$args = @(".\\scripts\\cleanup-review-videos.mjs", "--limit", "$Limit")
if ($Apply) {
  $args += "--apply"
}

node @args