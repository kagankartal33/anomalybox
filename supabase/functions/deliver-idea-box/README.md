# `deliver-idea-box`

Internal payment/webhook delivery function.

Requires one of:

- `INTERNAL_API_TOKEN`
- `ADMIN_API_TOKEN`

Input:

```json
{
  "user_id": "uuid",
  "purchase_id": "uuid|null",
  "box_product_slug": "viral_box_500",
  "category_slug": "beauty",
  "persona_slug": "luxury_editor"
}
```

The database RPC `deliver_idea_box()` atomically assigns ideas from `idea_inventory` using the product allocation rules. The response does not include scores or bands.