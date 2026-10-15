param(
  [string]$Email = "demo.creator@viralbox.test",
  [string]$Password = "DemoViralBox2026!",
  [string]$DisplayName = "Demo Creator",
  [string]$CategorySlug = "beauty",
  [string]$PersonaSlug = "luxury_editor",
  [string]$BoxProductSlug = "viral_box_500",
  [string]$DbContainer = "supabase_db_ViralBox",
  [switch]$MakeAdmin,
  [switch]$GiftBox,
  [switch]$ResetProfileOnly
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $repoRoot

function Read-DotEnvValue {
  param([string]$Path, [string]$Key)
  if (!(Test-Path $Path)) { return $null }
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trim = $line.Trim()
    if (!$trim -or $trim.StartsWith("#")) { continue }
    $parts = $trim -split "=", 2
    if ($parts.Count -ne 2) { continue }
    if ($parts[0].Trim() -eq $Key) {
      return $parts[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function ConvertTo-SqlLiteral {
  param([string]$Value)
  return "'" + ($Value -replace "'", "''") + "'"
}

function Invoke-LocalSql {
  param([string]$Sql)
  docker exec -i $DbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -t -A -c $Sql
}

$statusEnv = @(& cmd /c "supabase status -o env 2>nul")
$localApiUrl = ($statusEnv | Select-String -Pattern '^API_URL=\"(.+)\"$').Matches.Groups[1].Value
$localServiceKey = ($statusEnv | Select-String -Pattern '^SERVICE_ROLE_KEY=\"(.+)\"$').Matches.Groups[1].Value

# Prefer live local Supabase keys when the stack is running (avoids stale .env.local service role).
$supabaseUrl = if ($localApiUrl) { $localApiUrl } else { $env:NEXT_PUBLIC_SUPABASE_URL }
if (!$supabaseUrl) { $supabaseUrl = Read-DotEnvValue ".env.local" "NEXT_PUBLIC_SUPABASE_URL" }
if (!$supabaseUrl) { $supabaseUrl = "http://127.0.0.1:55321" }

$serviceKey = if ($localServiceKey) { $localServiceKey } else { $env:SUPABASE_SERVICE_ROLE_KEY }
if (!$serviceKey) { $serviceKey = Read-DotEnvValue ".env.local" "SUPABASE_SERVICE_ROLE_KEY" }
if (!$serviceKey) {
  throw "SUPABASE_SERVICE_ROLE_KEY is required. Set env or ensure local Supabase is running."
}

$headers = @{
  apikey = $serviceKey
  Authorization = "Bearer $serviceKey"
  "Content-Type" = "application/json"
}

Write-Host "== Reset demo account =="
Write-Host "Email: $Email"
Write-Host "URL:   $supabaseUrl"

$userId = $null
$hasDockerDb = $false
try {
  docker inspect $DbContainer 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $hasDockerDb = $true }
} catch {
  $hasDockerDb = $false
}

if ($hasDockerDb) {
  $userId = (Invoke-LocalSql "select id::text from auth.users where email = $(ConvertTo-SqlLiteral $Email) limit 1;").Trim()
  if ($userId) {
    Write-Host "Found existing user $userId via local database"
    if (-not $ResetProfileOnly) {
      Write-Host "Deleting existing demo user..."
      Invoke-LocalSql "delete from auth.users where id = '$userId'::uuid;" | Out-Null
      $userId = $null
    }
  }
} else {
  Write-Host "Local DB container not found; using Auth admin API only."
}

if (-not $userId) {
  Write-Host "Creating demo user..."
  $body = @{
    email = $Email
    password = $Password
    email_confirm = $true
    user_metadata = @{ display_name = $DisplayName }
  } | ConvertTo-Json -Depth 5

  try {
    $created = Invoke-RestMethod -Method POST -Uri "$supabaseUrl/auth/v1/admin/users" -Headers $headers -Body $body
    $userId = $created.id
    if (-not $userId -and $created.user) { $userId = $created.user.id }
  } catch {
    $message = $_.Exception.Message
    if ($hasDockerDb -and ($message -match "already|registered|exists" -or $true)) {
      $userId = (Invoke-LocalSql "select id::text from auth.users where email = $(ConvertTo-SqlLiteral $Email) limit 1;").Trim()
    }
    if (-not $userId) {
      throw "Demo user create failed: $message"
    }
    Write-Host "Using existing user after create conflict: $userId"
  }

  if (-not $userId) { throw "Demo user create did not return an id." }
  Write-Host "User ready: $userId"
}

$role = if ($MakeAdmin) { "admin" } else { "creator" }

if ($hasDockerDb) {
  $roleLiteral = ConvertTo-SqlLiteral $role
  $nameLiteral = ConvertTo-SqlLiteral $DisplayName
  $handleLiteral = ConvertTo-SqlLiteral "demo_creator"
  $nicheLiteral = ConvertTo-SqlLiteral $CategorySlug
  Invoke-LocalSql @"
insert into public.profiles (id, display_name, role, plan)
values ('$userId'::uuid, $nameLiteral, $roleLiteral, 'free')
on conflict (id) do update
set display_name = excluded.display_name,
    role = excluded.role;
insert into public.creator_profiles (user_id, handle, niche, default_platforms)
values ('$userId'::uuid, $handleLiteral, $nicheLiteral, array['instagram_reels']::text[])
on conflict (user_id) do update
set handle = excluded.handle,
    niche = excluded.niche;
"@ | Out-Null
} else {
  $profileBody = @{
    id = $userId
    display_name = $DisplayName
    role = $role
    plan = "free"
  } | ConvertTo-Json
  Invoke-RestMethod -Method POST -Uri "$supabaseUrl/rest/v1/profiles?on_conflict=id" -Headers ($headers + @{ Prefer = "resolution=merge-duplicates,return=minimal" }) -Body $profileBody | Out-Null

  $creatorBody = @{
    user_id = $userId
    handle = "demo_creator"
    niche = $CategorySlug
    default_platforms = @("instagram_reels")
  } | ConvertTo-Json
  Invoke-RestMethod -Method POST -Uri "$supabaseUrl/rest/v1/creator_profiles?on_conflict=user_id" -Headers ($headers + @{ Prefer = "resolution=merge-duplicates,return=minimal" }) -Body $creatorBody | Out-Null
}

Write-Host "Profile role set to $role"

if ($GiftBox) {
  if (-not $hasDockerDb) {
    throw "GiftBox currently requires local docker DB container $DbContainer (or gift from /admin/users)."
  }
  Write-Host "Gifting $BoxProductSlug for $CategorySlug / $PersonaSlug ..."
  $sql = @"
do `$`$
declare
  v_user uuid := '$userId';
  v_product public.box_products%rowtype;
  v_category public.categories%rowtype;
  v_persona public.creator_personas%rowtype;
  v_purchase_id uuid;
  v_delivery_id uuid;
begin
  select * into v_product from public.box_products where slug = '$BoxProductSlug' and enabled limit 1;
  select * into v_category from public.categories where slug = '$CategorySlug' and enabled limit 1;
  select * into v_persona from public.creator_personas where slug = '$PersonaSlug' and enabled limit 1;
  if v_product.id is null or v_category.id is null or v_persona.id is null then
    raise exception 'product/category/persona missing for gift';
  end if;

  insert into public.purchases (
    user_id, box_product_id, provider, amount_usd_cents, currency, status,
    category_id, persona_id, fulfillment_source, completed_at, metadata, raw_event
  ) values (
    v_user, v_product.id, 'admin_gift', v_product.price_usd_cents, 'usd', 'paid',
    v_category.id, v_persona.id, 'admin_gift', now(),
    jsonb_build_object('box_product_slug', '$BoxProductSlug', 'category_slug', '$CategorySlug', 'persona_slug', '$PersonaSlug', 'gift', true, 'demo_reset', true),
    jsonb_build_object('source', 'reset-demo-account.ps1')
  ) returning id into v_purchase_id;

  select public.deliver_idea_box(v_user, '$BoxProductSlug', '$CategorySlug', '$PersonaSlug', v_purchase_id) into v_delivery_id;
  raise notice 'gifted delivery %', v_delivery_id;
end
`$`$;
"@
  docker exec -i $DbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c $sql
  Write-Host "Gift box delivery attempted."
}

Write-Host ""
Write-Host "Demo account ready."
Write-Host "Login: $Email / $Password"
if ($MakeAdmin) { Write-Host "Admin: yes (use /admin/users to gift more boxes)" }
if (-not $GiftBox) { Write-Host "Tip: re-run with -GiftBox -MakeAdmin to seed a vault box quickly." }
