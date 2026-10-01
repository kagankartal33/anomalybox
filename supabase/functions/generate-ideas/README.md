# `generate-ideas`

Legacy placeholder. In the current product model, ideas are not generated at the moment an influencer purchases a box.

The generator runs as an internal/admin tool:

1. Admin selects category, creator mode, and target count.
2. The generator produces ideas as either `admin_direct` payloads or `jsonl_import` files.
3. The `admin-generation-batches` function runs import, scoring, and publishing.
4. Published ideas enter the `idea_inventory` stock pool.

The creator-facing app runtime does not call this function.