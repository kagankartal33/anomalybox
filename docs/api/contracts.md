# API Contracts

Bu sozlesme yeni stok modeline gore gunceldir: fikirler influencer satin aldigi anda uretilmez. Admin/generator once fikirleri batch olarak uretir, skorlar ve `idea_inventory` stok havuzuna publish eder. Influencer sadece satin aldigi kutudan kendisine atanmis fikir kartlarini gorur.

## Public App Reads

Frontend publishable/anon key + authenticated session kullanir. `service_role` sadece Edge Function/server tarafinda kalir.

### Kategori, persona ve urun listesi

```http
GET /rest/v1/categories?select=slug,name,family,risk_level,sort_order,metadata&enabled=eq.true&order=sort_order.asc
GET /rest/v1/creator_personas?select=slug,name,description,tags,metadata&enabled=eq.true
GET /rest/v1/box_products?select=slug,name,price_usd_cents,idea_count,metadata&enabled=eq.true
```

`categories` listesi `instagram_tum_kategoriler_birlesik.md` ve The PennyMatters Instagram category tablosundan uretilen birlesik katalogdur. UI kategori secimini `family`, `metadata.sources` ve `metadata.display_groups` ile filtreleyebilir; generator ve delivery tarafinda daima `slug` kullanilir.

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

## Internal Training Corpus

Viral corpus tablolari public app API yuzeyi degildir. Edge Function, admin worker veya offline eval araci service role ile okur:

```sql
select * from public.viral_pattern_rules where enabled = true;
select * from public.generator_eval_cases where enabled = true;
select * from public.training_profile_for_scope('beauty', 'instagram_reels', 12);
select * from public.category_layer_policy_for_scope('beauty', 'instagram_reels', 'premium_viral_box_1000');
```

`viral_training_examples` icindeki 2016-2026 viral ornekleri `pattern_only`, `negative_example` veya `eval_only` amaciyla tutulur. Generator bu tablolardan isim, kisi, marka, meme sozleri veya birebir format kopyalamaz; sadece `reusable_pattern`, `safety_risks` ve `viral_pattern_rules` icindeki mekanizmalari internal planlama sinyali olarak kullanir. `VTP-*` pattern id'leri influencer kartinda gosterilmez.

Compiled profile kontrati:

```sql
select namespace, version, config
from public.admin_configs
where namespace = 'training.compiled_profile'
  and enabled = true;
```

`training_profile_for_scope` sonucu generator'a `pattern_id`, `pattern_name`, `pattern_family`, `signal_weight`, `example_count` ve internal `quality_vector` verir. Bunlar fikir kartina yazilmaz; yalnizca mekanizma secimi, risk siniri ve kategori/platform uyumu icin kullanilir.
Exact kategori profili yoksa fonksiyon `quality_vector.scope = global_platform_fallback` ile genel platform profilinden sonuc dondurur; generator bunu long-tail kategoriye creator context ve kategori metadata'siyle yeniden uyarlar.
`category_layer_policy_for_scope` sonucu generator'a kategoriye gore required/optional/premium layer listesini ve pratik etki talimatlarini verir. `policy_slug`, `quality_rules` ve internal metadata creator-facing karta yazilmaz; kart sadece uygulanmis layerlari ve creator'a faydasini anlatan `category_layer_pack` alanini gosterir.

## Admin Media Training API

Bu endpointler `supabase/functions/admin-media-training/index.ts` icindedir ve `ADMIN_API_TOKEN` veya `INTERNAL_API_TOKEN` ister. Amaç ham videoyu kopyalamak degil; upload, Reels URL, caption, transcript ve admin notlarindan soyut Reels mekanizmasi cikarmaktir.

### `POST /admin-media-training`

Media training kaynagi olusturur.

```json
{
  "external_source_id": "media_beauty_luxury_june",
  "title": "Beauty luxury Reels review batch",
  "category_slug": "beauty",
  "persona_slug": "luxury_editor",
  "platform": "instagram_reels",
  "language": "tr"
}
```

### `POST /admin-media-training/:id/assets`

Bir kaynaga upload metadata, Instagram Reels URL veya manual transcript ekler. Upload dosyalari private `training-media` bucket'ina konur; ilk API versiyonu binary upload'u degil, storage path ve metadata kaydini alir.

```json
{
  "assets": [
    {
      "source_type": "upload",
      "storage_path": "training-media/batch/video.mp4",
      "file_hash": "sha256...",
      "caption": "string",
      "transcript": "string",
      "admin_notes": "string",
      "rights_status": "owned",
      "training_use": "pattern_only",
      "frame_metadata": {
        "sampled_frames": ["0s", "1s", "2s", "9s", "payoff", "cta"],
        "opening_visual": "product close-up"
      }
    },
    {
      "source_type": "instagram_reels_url",
      "source_url": "https://www.instagram.com/reel/...",
      "caption": "string",
      "transcript": "string",
      "rights_status": "permissioned",
      "training_use": "pattern_only"
    }
  ]
}
```

Duplicate kontrolu file hash, normalized URL hash ve normalized transcript/caption hash ile yapilir.

### `POST /admin-media-training/:id/analyze`

Frame metadata, caption, transcript ve admin notlarindan `media_training_observations` uretir. Cikarilan alanlar pattern-only tutulur: `hook_pattern`, `first_second_visual`, `scene_rhythm`, `shot_taxonomy`, `caption_mechanism`, `comment_trigger`, `save_trigger`, `creator_presence_mode`, `category_layer_signals`, `derived_pattern_ids`, `copy_risk`, `risk_level` ve `training_weight`.

`rights_status = 'unknown'`, public figure, minor/privacy veya copyrighted clip/audio riski varsa observation promote edilmez; `media_training_review_queue` icine duser.

### `POST /admin-media-training/:id/promote-training`

Approved observation'lari training hattina tasir:

```json
{
  "compile_version": "2026-v4-media-training"
}
```

Promote sonucunda:

- `dataset_training_observations.source_kind` `media_video`, `media_reels_url` veya `media_transcript` olur.
- `viral_training_examples` kaynagi `media_training_v1` olur.
- `trend_signals.source = 'media_training_v1'` yazilir.
- `generator_eval_cases.slug like 'media_eval_%'` leak guard case'leri olusur.
- `compile_viral_training_profile('2026-v4-media-training')` aktif profile'i yeniler.

Creator-facing output'a source URL, dosya adi, exact caption, exact transcript, creator name, public figure name veya birebir sahne yazilmaz.

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
`idea_card` icinde creator'a gizli kalmasi gereken skor, band, inventory veya reuse alanlari bulunursa satir reject edilir.

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
      "content": "{"external_idea_id":"beauty_luxury_editor_000001","title":"..."}\
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
      "idea_card": {
        "idea_summary": {
          "premise": "string",
          "target_emotion": "string",
          "creator_takeaway": "string"
        },
        "why_it_can_work": {
          "share_trigger": "string",
          "save_trigger": "string",
          "trust_trigger": "string"
        },
        "brand_lift_statement": "Bu fikir creator'i ... olarak konumlandirir.",
        "premium_decision_note": "Bu fikrin premium kutuya neden girdigini anlatan kisa stratejik not.",
        "creator_presence_mode": {
          "mode": "Editorial Insider|Calm Expert Editor|Relatable Confidant|High-Status Minimalist",
          "delivery_style": "string",
          "why_it_fits_creator": "string",
          "avoid": "string"
        },
        "atmosphere_direction": {
          "mood": "string",
          "visual_texture": "string",
          "color_language": "string",
          "soundscape": "string"
        },
        "hook_performance_pack": {
          "hook_options": ["string", "string", "string", "string", "string"],
          "luxury_hook": "string",
          "relatable_hook": "string",
          "comedy_hook": "string",
          "first_second_visual_hook": "string",
          "first_line_hook": "string",
          "comment_trigger_hook": "string"
        },
        "video_blueprint": {
          "duration_seconds": 35,
          "opening_visual": "string",
          "scene_arc": "string",
          "payoff_visual": "string"
        },
        "scene_script": [
          {
            "second": "0-3",
            "purpose": "attention|trust|proof|payoff",
            "voiceover": "string",
            "spoken_lines": ["string"],
            "on_screen_text": "string"
          }
        ],
        "shot_list": [
          {
            "second": "0-3",
            "shot": "string",
            "action": "string",
            "overlay": "string"
          }
        ],
        "b_roll_plan": [
          {
            "type": "product_closeup|hand_movement|environment_detail|preparation_moment|reality_moment|safe_alternative",
            "shot": "string",
            "note": "string"
          }
        ],
        "pose_direction": {
          "face": "string",
          "hands": "string",
          "body": "string",
          "expression": "string"
        },
        "micro_behavior_guide": {
          "facial_expression": "string",
          "eye_contact": "string",
          "product_handling": "string",
          "camera_attention": "string",
          "smile_timing": "string",
          "avoid_over_advertising": "string"
        },
        "camera_direction": {
          "framing": "string",
          "movement": "string",
          "lighting": "string"
        },
        "editing_notes": {
          "pacing": "string",
          "transitions": ["string"],
          "sound": "string"
        },
        "editing_timeline": [
          {
            "second": "0-2",
            "beat": "pattern_interrupt|premise|proof_turn|payoff|save_comment_cta",
            "edit": "string"
          }
        ],
        "caption_pack": {
          "caption_options": ["string", "string", "string"],
          "on_screen_text": ["string"],
          "cta": "string"
        },
        "comment_engine": {
          "pinned_comment": "string",
          "audience_question": "string",
          "reply_strategy": "string"
        },
        "story_followup": {
          "poll_question": "string",
          "poll_options": ["string", "string"],
          "followup_frame": "string"
        },
        "variant_pack": {
          "reels": "string",
          "story": "string",
          "carousel": "string",
          "youtube_shorts": "string",
          "short_15s": "string"
        },
        "brand_safety": {
          "disclosure_text": "string",
          "claim_boundary": "string",
          "do_not_say": ["string"],
          "evidence_note": "string",
          "safer_alternative_phrase": "string"
        },
        "production_notes": {
          "props": ["string"],
          "wardrobe": "string",
          "location": "string",
          "safety": "string"
        },
        "production_plan": {
          "shoot_time_minutes": 45,
          "equipment": ["string"],
          "solo_creator_friendly": true,
          "location_options": ["home", "car", "hotel", "studio"],
          "production_versions": {
            "low": "string",
            "mid": "string",
            "high": "string"
          }
        },
        "personalization_slots": {
          "product_name": "{product_name}",
          "daily_context": "{daily_context}",
          "audience_pain": "{audience_pain}",
          "signature_phrase": "{signature_phrase}"
        },
        "strategic_value": {
          "brand_equity": "string",
          "audience_aftertaste": "string",
          "partnership_signal": "string"
        },
        "category_layer_pack": {
          "applied_layers": [
            "brand_lift_layer",
            "creator_style_adapter",
            "scene_energy_curve_layer",
            "risk_reputation_layer",
            "platform_conversion_layer",
            "proof_without_boring_layer",
            "luxury_signal_layer",
            "sponsor_softness_layer"
          ],
          "category_fit_note": "Bu kategori icin hangi layerlarin neden secildigini anlatan kisa not.",
          "premium_execution_note": "Layer kombinasyonunun fikri neden daha pahali ve uygulanabilir hissettirdigini anlatan kisa not.",
          "practical_effects": {
            "brand_lift_layer": "Bu fikir creator'i hangi marka algisina tasir?",
            "creator_style_adapter": "Fikir creator tonuna nasil uyarlandi?",
            "scene_energy_curve_layer": "Video temposu pratikte nasil guclendi?",
            "risk_reputation_layer": "Itibar, claim veya sponsor riski nasil kontrol edildi?",
            "platform_conversion_layer": "Fikir platform varyantlarina nasil donusur?"
          }
        }
      },
      "safety_notes": []
    }
  ]
}
```

`idea_card` cekilebilir ve premium hissi veren bir uygulama karti olmalidir. Importer su alanlari zorunlu sayar: `idea_summary`, `why_it_can_work`, `brand_lift_statement`, `premium_decision_note`, `creator_presence_mode`, `atmosphere_direction`, `hook_performance_pack`, `video_blueprint`, `scene_script`, `shot_list`, `b_roll_plan`, `pose_direction`, `micro_behavior_guide`, `camera_direction`, `editing_notes`, `editing_timeline`, `caption_pack`, `comment_engine`, `story_followup`, `variant_pack`, `brand_safety`, `production_notes`, `production_plan`, `personalization_slots`, `strategic_value`, `category_layer_pack`.
`category_layer_pack.applied_layers` secilen kategori policy'sindeki tum `required_layers` degerlerini icermeli ve `practical_effects` her required layer icin creator'a gorunen pratik fayda cumlesi vermelidir.

### `POST /admin/generation-batches/:id/score`

Batch icindeki valid fikirleri skorlar, `idea_scores` tablosuna yazar ve Quality Gate v2.1 kaydini `idea_quality_checks` tablosunda olusturur. Skorlar ve kalite kararlari internal kalir.

Buyuk batch'lerde chunk kullan:

```json
{
  "limit": 100,
  "offset": 0
}
```

Quality Gate v2.1 sunlari hesaplar:

- `semantic_duplicate_score`
- `embedding_duplicate_score`
- `lexical_signature`
- `safety_classifier`
- `claim_evidence_status`
- `premium_completeness_score`
- `creator_fit_score`
- `platform_fit_score`
- `brand_safety_score`
- `performance_calibrated_score`
- `editorial_quality_score`
- category layer policy coverage, missing required layers and practical effect coverage
- `second_opinion_required`
- `second_opinion_reasons`
- `decision`: `approve`, `refine`, `reject`, `human_review_required`

Riskli sponsor, saglik/body, finans veya minor/privacy iddialari varsa sistem `idea_claim_evidence` satirlari olusturur. Evidence durumu internal kalir; creator UI'da gosterilmez. `idea_performance_feedback` sonraki donemlerde yayinlanan fikirlerin sonuc metrikleriyle scoring'i kalibre etmek icin kullanilir.

### `POST /admin/generation-batches/:id/publish-inventory`

Skor tabanini, editorial kalite tabanini ve Quality Gate v2 `approve` kararini gecen fikirleri `idea_inventory` stok havuzuna alir.

```json
{
  "quality_floor": 55,
  "editorial_quality_floor": 78,
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
Ayni `purchase_id` tekrar gelirse teslim idempotent calisir; daha once delivered kayit varsa yeni fikir tuketmeden mevcut delivery id doner.

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

RLS satir seviyesini korur; kolon seviyesinde de `assigned_band`, `idea_inventory`, `allocation` ve benzeri internal alanlara authenticated grant verilmez.

## Creator Video Manual Review

Creator videosu training datasina yazilmaz. Bu akis sadece satin alinmis kartin uygulanip uygulanmadigini adminin manuel kontrol etmesi icindir.

Creator endpoints:

```http
POST /functions/v1/creator-video-reviews
POST /functions/v1/creator-video-reviews/:reviewId/attempts/:attemptId/submit
POST /functions/v1/creator-video-reviews/:reviewId/attempts
GET /functions/v1/creator-video-reviews
GET /functions/v1/creator-video-reviews/:reviewId
```

Admin endpoints `x-admin-token` ister:

```http
GET /functions/v1/creator-video-reviews/admin?status=under_review
GET /functions/v1/creator-video-reviews/admin/creator-video-reviews/:reviewId
POST /functions/v1/creator-video-reviews/admin/creator-video-reviews/:reviewId/attempts/:attemptId/manual-review
```

Creator detay response'u video status, attempt history, admin feedback, checklist sonucunu ve `card_sections` alanini dondurur. `card_sections` uygulamada accordion/tab olarak render edilir:

```json
{
  "key": "scene_flow",
  "title": "Sahne Akisi",
  "short_summary": "string",
  "how_to_do_it": "string",
  "what_good_looks_like": "string",
  "common_mistakes": ["string"],
  "example_execution": "string",
  "source_payload": {},
  "checklist_items": []
}
```

Admin detay response'u ayni kart sekmelerine ek olarak `admin_review_guide` ve `checklist_template` dondurur. Admin her checklist maddesini `pass`, `partial`, `missing` veya `not_applicable` isaretler ve creator'a gorunen feedback yazar.

Manual review body:

```json
{
  "final_decision": "minor_revisions",
  "overall_feedback": "Ilk saniyedeki hook daha netlestirilmeli.",
  "admin_private_notes": "creator'a gosterilmez",
  "checks": [
    {
      "check_key": "hook_first_second_visual",
      "status": "missing",
      "evidence_summary": "Ilk saniyede gorsel hook net degil.",
      "revision_advice": "Final goruntuden karar masasina daha sert bir cut ekle.",
      "admin_private_note": "creator'a gosterilmez"
    }
  ]
}
```

Status lifecycle: `pending_upload` -> `under_review` -> `revision_requested` veya `ready_to_post`; ciddi brand safety durumunda `blocked`. Eksik varsa creator ayni review thread altinda yeni attempt yukler; eski attempt ve feedback gecmisi korunur. `POST /:reviewId/analyze` manual review modunda `410` doner.