# API Contracts

Bu dosya frontend, Edge Functions ve Postgres arasındaki ilk sözleşmeyi tanımlar.

## `generate-ideas`

Input:

```json
{
  "creator_profile_id": "uuid",
  "brand_id": "uuid|null",
  "audience_profile_id": "uuid|null",
  "platform": "instagram_reels",
  "format": "reels_30_45",
  "language": "tr",
  "locale": "TR",
  "brief": "string",
  "target_metric": ["shares", "saves"],
  "count": 10
}
```

Output:

```json
{
  "ideas": [
    {
      "idea_id": "uuid",
      "title": "string",
      "one_sentence_premise": "string",
      "mechanism_ids": ["VIA-101", "VIA-120"],
      "vps": 82,
      "feasibility_score": 74,
      "comedy_remix_fit": 78,
      "status": "ready"
    }
  ]
}
```

## `score-idea`

Input:

```json
{
  "idea_id": "uuid",
  "config_version": "1.1.0-comedy-remix"
}
```

Output:

```json
{
  "idea_id": "uuid",
  "viral_potential_score": 0,
  "score_breakdown": {},
  "decision": "PASS|REFINE|HUMAN_REVIEW_REQUIRED|BLOCK"
}
```

## Frontend Okuma Sırası

1. `idea_candidates`
2. latest `idea_scores`
3. `human_awareness_assessments`
4. `idea_cards`

Frontend hiçbir zaman `service_role` anahtarı kullanmaz. Kullanıcı işlemleri publishable/anon key + authenticated session ile yapılır.