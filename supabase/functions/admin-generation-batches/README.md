# `admin-generation-batches`

Admin/internal batch lifecycle function.

Requires one of:

- `ADMIN_API_TOKEN`
- `INTERNAL_API_TOKEN`

Supported actions:

```http
POST /functions/v1/admin-generation-batches
POST /functions/v1/admin-generation-batches/:id/import
POST /functions/v1/admin-generation-batches/:id/score
POST /functions/v1/admin-generation-batches/:id/publish-inventory
```

Also accepts the planned admin-style path when routed through a gateway:

```http
POST /admin/generation-batches
POST /admin/generation-batches/:id/import
POST /admin/generation-batches/:id/score
POST /admin/generation-batches/:id/publish-inventory
```

Use this for both `admin_direct` payloads and `jsonl_import` files.