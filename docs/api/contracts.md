# API Contracts

Bu sozlesme yeni stok modeline gore gunceldir: fikirler influencer satin aldigi anda uretilmez. Admin/generator once fikirleri batch olarak uretir, skorlar ve `idea_inventory` stok havuzuna publish eder. Influencer sadece satin aldigi kutudan kendisine atanmis fikir kartlarini gorur.

## Public App Reads

Frontend publishable/anon key + authenticated session kullanir. `service_role` sadece Edge Function/server tarafinda kalir.

### Kategori, persona ve urun listesi

```http
GET /rest/v1/categories?select=slug,name,metadata&enabled=eq.true
GET /rest/v1/creator_personas?select=slug,name,description,tags,metadata&enabled=eq.true
GET /rest/v1/box_products?select=slug,name,price_usd_cents,idea_count,metadata&enabled=eq.true
```

### Creator kategori secimi

```json
{
  "user_id": "auth.uid()",
  "category_id": "uuid",
  "persona_id": "uuid|null",
  "selected_content_layers": ["T02", "T07"]
}
```

RLS: kullanici sadece kendi `creator_category_preferences` satirlarini okuyup yazabilir.

## Admin Batch API

Bu endpointler `supabase/functions/admin-generation-batches/index.ts` icindedir ve `ADMIN_API_TOKEN` veya `INTERNAL_API_TOKEN` ister.

### `POST /admin/generation-batches`

Batch kaydi olusturur.

```json
{
  "external_batch_id": "batch_2026_06_28_beauty_luxury_editor",
  "category_slug": "beauty",
  "persona_slug": "luxury_editor",
  "target_count": 1000,
  "language": "tr",
  "platform": "instagram_reels",
  "generator_version": "1.0.0",
  "source_mode": "jsonl_import"
}
```

### `POST /admin/generation-batches/:id/import`

JSONL dosyalarini veya direct payload fikirlerini import eder. Hatali satirlar batch'i bozmaz; `idea_import_errors` tablosuna yazilir.

```json
{
  "manifest": {
    "batch_id": "batch_2026_06_28_beauty_luxury_editor",
    "category_slug": "beauty",
    "persona_slug": "luxury_editor",
    "target_count": 1000,
    "language": "tr",
    "platform": "instagram_reels",
    "generator_version": "1.0.0"
  },
  "files": [
    {
      "name": "ideas_0001.jsonl",
      "content": "{\"external_idea_id\":\"beauty_luxury_editor_000001\",\"title\":\"...\"}\n"
    }
  ]
}
```

Direct mode icin ayni endpoint:

```json
{
  "ideas": [
    {
      "external_idea_id": "beauty_luxury_editor_000001",
      "title": "string",
      "one_sentence_premise": "string",
      "mechanism_ids": ["VIA-132", "VIA-145"],
      "category_slug": "beauty",
      "persona_tags": ["luxury_editor"],
      "content_style_layers": ["T02", "T07"],
      "hook_options": ["string", "string", "string"],
      "story_beats": [],
      "idea_card": {},
      "safety_notes": []
    }
  ]
}
```

### `POST /admin/generation-batches/:id/score`

Batch icindeki valid fikirleri skorlar ve `idea_scores` tablosuna yazar. Skorlar internal kalir.

### `POST /admin/generation-batches/:id/publish-inventory`

Kalite tabanini gecen fikirleri `idea_inventory` stok havuzuna alir.

```json
{
  "quality_floor": 55,
  "max_reuse_count": 999999
}
```

## Inventory Health

`supabase/functions/inventory-health/index.ts` admin token ister.

```http
GET /functions/v1/inventory-health
```

Response her `category + persona` icin band stoklarini ve reorder durumunu dondurur.

```json
{
  "reorder_rows": [
    {
      "category_slug": "beauty",
      "persona_slug": "luxury_editor",
      "low_count": 42,
      "mid_count": 20,
      "high_count": 12,
      "needs_generation": true
    }
  ],
  "rows": []
}
```

## Box Delivery

Odeme basarili olunca server/Stripe webhook `supabase/functions/deliver-idea-box/index.ts` fonksiyonunu cagirir. Bu fonksiyon internal token ister ve DB'deki atomik `deliver_idea_box` RPC'sini kullanir.

```json
{
  "user_id": "uuid",
  "purchase_id": "uuid|null",
  "box_product_slug": "viral_box_500",
  "category_slug": "beauty",
  "persona_slug": "luxury_editor"
}
```

Allocation kurallari:

| Urun | Fikir | Internal band dagilimi |
|---|---:|---|
| `viral_box_500` | 2 | `low:1`, `high:1` |
| `premium_viral_box_1000` | 5 | `low:2`, `mid:1`, `high:2` |

## Creator-Facing Idea Read

Influencer teslim edilen fikirleri kendi hesabindan okur:

```http
GET /rest/v1/idea_box_deliveries?select=id,status,delivered_at,idea_box_items(slot_index,idea_id)&order=created_at.desc
GET /rest/v1/idea_cards?select=idea_id,title,card,markdown
```

Creator UI asla su alanlari gostermez:

- `idea_scores`
- `idea_inventory`
- `score_band`
- `assigned_band`
- `internal_rank_score`
- `reuse_count`
- `max_reuse_count`

RLS bu alanlari normal authenticated kullanicidan saklar; `idea_box_items.assigned_band` sadece tablo icinde internal dagilim izidir ve UI response'una alinmaz.