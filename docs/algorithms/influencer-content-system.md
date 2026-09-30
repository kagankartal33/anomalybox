# Influencer Content System

ViralBox'un ana kullanicisi Instagram'daki high-profile influencer ve creator ekipleridir. Generator baska bir unlu/influencer tarzini taklit etmez; creator'a uygun fikir uretmek icin kategori, persona, izinli creator DNA ve platform-fit sinyallerini kullanir.

## Creator DNA

```text
trust_role
signature_tension
recurring_rituals
visual_grammar
audience_contract
humor_boundary
commercial_boundary
privacy_boundary
production_capacity
brand_safety_boundary
```

## Content Style Layers

| Kod | Layer | Ne uretir? |
|---|---|---|
| T01 | Signature Ritual | Creator'in kendi tekrar eden format mantigina uygun ozgun fikir |
| T02 | Behind-the-Scenes Truth | Parlak sonucun arkasindaki emek, surtunme ve gerceklik |
| T03 | Product Proof / Honest Use | Sponsor/urun icin durust kullanim ve kanit akisi |
| T04 | Bureaucratic Everyday Comedy | Gunu form, onay, sira ve prosedur komedisine cevirir |
| T05 | Community Prompt / Comment Engine | Yorum, DM ve story anketinden guvenli fikir cikarir |
| T06 | Before-After Without Harm | Fiziksel vaat yerine karar/baglam donusumu gosterir |
| T07 | Decision Support / Saveable Utility | Kaydedilebilir karar agaci, checklist ve karsilastirma uretir |
| T08 | Aspirational-to-Practical Translation | Estetik/luks icerigi gercek hayata cevrilebilir yapar |
| T09 | Mini-Series Universe | Tek fikri tekrar edilebilir seri IP'sine donusturur |
| T10 | Correction / Trust Repair | Yanlis anlasilma veya eksik bilgiyi sakin duzeltir |
| T11 | Commercial Integration | Sponsorlu icerigi acik, guvenli ve donusum odakli yapar |
| T12 | High-Profile Reputation Guard | Gorunurluk, mahremiyet ve itibar riskini yonetir |

## Persona Tipleri

| Persona | En iyi calistigi alan |
|---|---|
| `luxury_editor` | Beauty, fashion, travel, luxury |
| `relatable_lifestyle` | Lifestyle, food, family, daily reality |
| `expert_guide` | Education, wellness-safe, thought leadership |
| `beauty_tester` | Beauty proof, routine, product testing |
| `travel_curator` | Travel itinerary, place truth, premium/practical contrast |
| `comedy_observer` | Safe everyday comedy and recognition loops |
| `product_reviewer` | Commerce, affiliate, proof-led recommendation |
| `creator_teacher` | Creator education, systems, frameworks |

## Batch Generation Model

Generator iki modda calisir:

1. `admin_direct`: Admin panel "Fikir uret" der; Edge Function/worker fikirleri dogrudan database'e import eder.
2. `jsonl_import`: Generator `manifest.json` ve `ideas_*.jsonl` dosyalari uretir; admin import ekrani veya CLI importer bunlari database'e yukler.

Her fikir su gate'lerden gecer:

- JSON schema
- category/persona fit
- safety
- originality
- creator-fit
- platform-fit
- score pipeline

Valid fikirler once `idea_candidates`, `idea_scores`, `idea_cards` tablolarina yazilir. Kalite tabanini gecenler `idea_inventory` stok havuzuna alinir.

## Paid Box Allocation

Stok fikirleri internal `low`, `mid`, `high` bandlerine ayrilir. Bu bandler influencer'a gosterilmez.

| Kutu | Fiyat | Teslim |
|---|---:|---|
| `viral_box_500` | `$500` | 2 fikir: `low:1`, `high:1` |
| `premium_viral_box_1000` | `$1000` | 5 fikir: `low:2`, `mid:1`, `high:2` |

Influencer satin alma sonrasi sadece kendi `idea_box_deliveries` ve `idea_cards` kayitlarini gorur. `idea_scores`, `idea_inventory`, `score_band`, `internal_rank_score` ve reuse alanlari sakli kalir.

## Zorunlu Guvenlik

- Sponsorlu icerikte disclosure alani gerekir.
- Saglik, cilt, finans, hukuki ve travel iddialari sinirlandirilir ve kanit ihtiyaci belirtilir.
- Cocuk, partner, ozel mesaj, takipci kimligi ve mahrem alanlar korunur.
- Generator kisi taklidi yapmaz; persona yerine prensip ve format mantigi cikarir.
- Yuksek profilli creator'larda itibar, context collapse ve parasocial boundary kontrol edilir.