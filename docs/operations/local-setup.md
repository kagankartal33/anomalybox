# Local Supabase Setup

## Requirements

- Docker Desktop
- Supabase CLI

Check CLI:

```powershell
supabase --version
supabase --help
```

## Run

```powershell
supabase start
supabase db reset
```

Studio:

```text
http://127.0.0.1:55323
```

API:

```text
http://127.0.0.1:55321
```

## Edge Function Secrets

Admin/internal functions require a token. Locally:

```powershell
supabase secrets set ADMIN_API_TOKEN="local-admin-token"
supabase secrets set INTERNAL_API_TOKEN="local-internal-token"
```

Then call with either:

```http
x-admin-token: local-admin-token
```

or:

```http
Authorization: Bearer local-admin-token
```

## Verify

```powershell
supabase status
supabase migration list --local
supabase db lint --local
```

Public schema is exposed through the Data API, so RLS must stay enabled. Sensitive creator-hidden fields use column-level grants in addition to RLS.

## Full Local Health Check

Run the project-level verifier after training, generator, quality gate, or Docker/container changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\test-all.ps1
```

The script intentionally removes only the local functions Edge Runtime container if it is stale. It does not remove database, storage, auth, or Studio containers.

For container cleanup only:

```powershell
powershell -ExecutionPolicy Bypass -Command ". .\tools\local-functions.ps1; Stop-LocalFunctionServers -RemoveEdgeRuntime"
```
