# `generate-ideas` Edge Function

Bu klasör henüz çalıştırılabilir function kodu değil, function sözleşmesidir.

Görev:

1. Kullanıcı session'ını doğrula.
2. Creator, brand ve audience context'ini oku.
3. `algorithm_definitions` ve aktif `admin_configs` kayıtlarını al.
4. LLM veya yerel generator ile aday fikirleri üret.
5. `idea_candidates` kayıtlarını oluştur.
6. `score-idea` akışını tetikle veya aynı transaction sonrası skor yaz.

Gizli anahtarlar sadece Edge Function environment içinde tutulmalıdır. Frontend `service_role` kullanmaz.