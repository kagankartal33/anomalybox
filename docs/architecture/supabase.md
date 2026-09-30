# Supabase Architecture

## Amaç

Supabase, ViralBox için hızlı MVP veri katmanıdır:

- Auth: creator hesapları ve workspace sahipliği.
- Postgres: fikir adayları, skorlar, insan farkındalığı değerlendirmeleri, deneyler ve performans verisi.
- RLS: kullanıcı verisinin satır bazında korunması.
- Edge Functions: fikir üretimi, skor hesaplama, webhook ve platform bağlantıları.
- Storage: ileride görsel/video taslakları ve export dosyaları.

## Çekirdek Tablolar

| Tablo | Rol |
|---|---|
| `profiles` | `auth.users` için uygulama profili |
| `creator_profiles` | creator kapasitesi, niş, ses ve üretim sınırları |
| `brands` | marka tonu, güvenlik kuralları, ticari hedefler |
| `audience_profiles` | hedef kitle ihtiyaçları, gerilimleri, paylaşma motivasyonları |
| `algorithm_definitions` | `VIA-*` operatör kütüphanesi |
| `admin_configs` | dışarıdan değiştirilebilir ağırlıklar ve kalite eşikleri |
| `trend_signals` | trend/freshness sinyalleri |
| `idea_candidates` | üretilen fikir adayları |
| `idea_scores` | VPS, feasibility, novelty, comedy/remix vb. skorlar |
| `human_awareness_assessments` | HAS ve perspektif prizması kayıtları |
| `idea_cards` | kullanıcıya gösterilecek final fikir kartı |
| `experiments` / `experiment_variants` | A/B test kayıtları |
| `performance_events` | yayın sonrası metrikler |
| `audit_logs` | karar ve işlem izleri |

## RLS Modeli

Kullanıcıya ait tablolarda temel kural:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

`algorithm_definitions` yalnızca `enabled = true` kayıtları için okunabilir. Admin yazma işlemleri servis rolü veya ileride ayrı admin paneli üzerinden yapılmalıdır.

## MVP Veri Akışı

```text
brief
→ creator/audience/brand context
→ algorithm_definitions + admin_configs
→ idea_candidates
→ idea_scores + human_awareness_assessments
→ idea_cards
→ experiments
→ performance_events
→ creator learning loop
```

## Tasarım Kararı

Bu ilk migration, devasa spesifikasyondaki tüm tabloları birebir açmaz. Önce ürünün hızlı çalışması için gerekli çekirdek yüzeyi kurar; diğer katmanlar `jsonb` alanlarda güvenli şekilde taşınır ve stabil hale geldikçe normalize edilir.