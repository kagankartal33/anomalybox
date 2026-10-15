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

## Premium Idea Card Layer

`$1000` kutu hissi sadece fikir sayisindan gelmez; her kart creator'in direkt sete gidebilecegi premium strateji karti gibi hissettirmelidir.

| Alan | Ne hissettirir? |
|---|---|
| `brand_lift_statement` | Bu fikrin creator markasina katacagi net algi degeri |
| `premium_decision_note` | Fikrin neden 5 premium slotundan birine girdigini anlatan kisa gerekce |
| `creator_presence_mode` | Kameradaki profesyonel varlik modu: editorial insider, calm expert editor, relatable confidant vb. |
| `atmosphere_direction` | Mood, visual texture, renk dili ve ses atmosferi |
| `strategic_value` | Brand equity, audience aftertaste ve partnership signal |
| `hook_performance_pack` | 5 hook, luxury/relatable/comedy varyantlari, ilk saniye gorsel hook ve comment hook |
| `scene_script` | Voiceover, konusulacak cumleler, on-screen text ve sahne amaci |
| `b_roll_plan` | Product close-up, el hareketi, ortam detayi, hazirlik ani ve guvenli alternatif shot |
| `micro_behavior_guide` | Yuz, goz temasi, urun tutusu, kameraya bakma ve reklam gibi gorunmeme talimatlari |
| `editing_timeline` | Pattern interrupt, premise, proof/turn, payoff ve save/comment CTA akisi |
| `comment_engine` | Pinned comment, yorum sorusu ve cevap stratejisi |
| `story_followup` | Story poll ve devam frame'i |
| `variant_pack` | Reels, Story, Carousel, YouTube Shorts ve 15 saniyelik versiyon |
| `brand_safety` | Disclosure, claim boundary, soyleme listesi, kanit notu ve guvenli alternatif ifade |
| `production_plan` | Cekim suresi, ekipman, solo cekim uygunlugu, lokasyon ve prod seviyeleri |
| `personalization_slots` | `{product_name}`, `{daily_context}`, `{audience_pain}`, `{signature_phrase}` |
| `category_layer_pack` | Kategoriye gore zorunlu/premium layerlar, category_fit_note, premium_execution_note ve her required layer icin pratik etki |

Bu alanlar viral garanti vermez; creator'a daha pahali, daha dusunulmus ve daha uygulanabilir bir fikir teslim edildigi hissini verir.

## Category Layer Policy

`category_layer_policies` her kategori/family/fallback icin hangi mekanizma layerlarinin zorunlu, opsiyonel veya premium bonus oldugunu belirler. Generator bu policy'yi internal okur; kartta sadece `category_layer_pack` ile creator'a pratik etkisini anlatir.

| Kategori tipi | Pratik zorunlu etki |
|---|---|
| Beauty / Commerce | Proof without boring, luxury signal, sponsor softness ve claim/reputation kontrolu |
| Fashion / Luxury | Status shift, audience identity, luxury signal ve yorum motoru |
| Travel / Food | Cultural/localization veya sensory proof, save-worthy utility ve comment trigger |
| Fitness / Parenting | Risk reputation, guvenli claim siniri ve relatability break |
| Education / Thought Leadership | Save-worthy utility, proof, status shift ve viral tension |
| Comedy / Bureaucratic | Absurd procedure, ritual/series, viral tension ve guvenli yorum tetigi |
| Book / Literary / Narrative | Narrative serial, audience identity, ritual series ve source leak korumasi |

## Zorunlu Guvenlik

- Sponsorlu icerikte disclosure alani gerekir.
- Saglik, cilt, finans, hukuki ve travel iddialari sinirlandirilir ve kanit ihtiyaci belirtilir.
- Cocuk, partner, ozel mesaj, takipci kimligi ve mahrem alanlar korunur.
- Generator kisi taklidi yapmaz; persona yerine prensip ve format mantigi cikarir.
- Yuksek profilli creator'larda itibar, context collapse ve parasocial boundary kontrol edilir.
