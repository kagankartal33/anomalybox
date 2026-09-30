# `inventory-health`

Admin/internal low-stock dashboard function.

Requires one of:

- `ADMIN_API_TOKEN`
- `INTERNAL_API_TOKEN`

It calls the database RPC `inventory_health()` and returns all category/persona rows plus the subset that needs generation.

```http
GET /functions/v1/inventory-health
```