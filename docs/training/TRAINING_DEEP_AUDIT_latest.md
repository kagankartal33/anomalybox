# Training deep audit

- Generated: 2026-08-10T15:24:56.2722569Z
- Compile: **2026-v10-6h-secure**
- Grade: **C**
- Pass: **True**

## Core metrics

| Metric | Value |
|---|---:|
| active_compilations | 1 |
| affinity | 30064 |
| avg_generator_value | 0.7049 |
| avg_patterns | 6.06 |
| avg_premium_fit | 0.7143 |
| compiled_profile_enabled | 1 |
| copy_high | 55837 |
| copy_low | 46 |
| copy_medium | 1713 |
| distinct_patterns_affinity | 40 |
| empty_patterns | 0 |
| eval_cases | 818 |
| examples | 57596 |
| features | 57596 |
| low_risk | 53207 |
| medium_risk | 3969 |
| pattern_rules | 40 |
| real_viral_seed | 1000 |
| restricted | 420 |
| use_eval_only | 1902 |
| use_negative | 393 |
| use_pattern_only | 55301 |

## Rates

| Rate | Value |
|---|---:|
| empty_pattern_rate | 0 |
| restricted_rate | 0.007292 |
| copy_high_rate | 0.96946 |
| pattern_only_rate | 0.960153 |

## Scope profile

| Scope | Rows | Scope type |
|---|---:|---|
| beauty | 12 | exact_category |
| entertainment_comedy | 12 | exact_category |
| comedy | 12 | global_platform_fallback |
| travel | 12 | exact_category |
| food | 12 | exact_category |
| fashion | 12 | exact_category |
| fitness | 12 | global_platform_fallback |
| fitness_wellness_safe | 12 | exact_category |

## Issues

- comedy_slug_uses_global_fallback_use_entertainment_comedy
- fitness_slug_uses_global_fallback_use_fitness_wellness_safe
- copy_risk_nearly_constant_high_not_discriminative

## Top categories

- lifestyle: affinity=106 avg_w=0.6995 sum_ex=58877
- entertainment_comedy: affinity=109 avg_w=0.6349 sum_ex=58160
- creator_education: affinity=139 avg_w=0.6926 sum_ex=53865
- product_reviews: affinity=9 avg_w=0.8044 sum_ex=34726
- fashion: affinity=82 avg_w=0.7576 sum_ex=25181
- commerce_affiliate: affinity=108 avg_w=0.7166 sum_ex=25025
- beauty: affinity=65 avg_w=0.7555 sum_ex=17749
- travel: affinity=66 avg_w=0.7301 sum_ex=8870
- celebrity_fan_lore: affinity=53 avg_w=0.712 sum_ex=8649
- food: affinity=62 avg_w=0.7322 sum_ex=8240
- comedy_worldbuilding: affinity=36 avg_w=0.6353 sum_ex=6084
- book_launch_content: affinity=33 avg_w=0.6272 sum_ex=5438
- bureaucratic_comedy: affinity=41 avg_w=0.6246 sum_ex=5276
- literary_lifestyle: affinity=22 avg_w=0.6104 sum_ex=3735
- fitness_wellness_safe: affinity=44 avg_w=0.6885 sum_ex=3198

JSON: `docs\training\TRAINING_DEEP_AUDIT_latest.json`
