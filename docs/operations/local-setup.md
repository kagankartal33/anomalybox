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