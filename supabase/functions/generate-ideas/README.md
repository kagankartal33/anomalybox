# `generate-ideas`

Legacy placeholder. Yeni urun modelinde fikirler influencer satin aldigi anda uretilmez.

Generator internal/admin arac olarak calisir:

1. Admin kategori + persona + hedef adet secer.
2. Generator fikirleri `admin_direct` payload veya `jsonl_import` dosyalari olarak uretir.
3. `admin-generation-batches` function import/score/publish akisini calistirir.
4. Publish edilen fikirler `idea_inventory` stok havuzuna girer.

Creator-facing app runtime'da bu function'i cagirmaz.