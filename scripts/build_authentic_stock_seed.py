import json
import uuid
import os

# We will read CATEGORIES and expand any missing cards to ensure at least 2 Low, 2 Mid, 2 High per category.
# Total 12 categories x 6-10 cards = ~80-100 completely unique authentic cards.

from generate_authentic_viral_cards import CATEGORIES

# Ensure each category has at least 2 low, 2 mid, 2 high
extra_cards = {
    "travel": [
        {
            "band": "high", "rank": 91, "title": "The Hidden Architectural Corridor: Discovering Secret City Layering",
            "premise": "Guide viewers through hidden public courtyards and covered arcades that tourists walk past every day without noticing.",
            "hook_first_line": "This passageway is completely open to the public, but 99% of people walk right past the entrance.",
            "visual_hook": "Camera pushing through an unassuming heavy wooden archway into a quiet sunlit Renaissance courtyard.",
            "story_beats": ["Unassuming street entrance", "Threshold transition", "Architectural history breakdown", "Map coordinates reference card"],
            "mood": "Atmospheric, cinematic, discovery, ambient street footsteps",
            "brand_lift": "Establishes creator as an insider travel curator with elevated cultural taste."
        },
        {
            "band": "mid", "rank": 84, "title": "Local Transit Mastery: The 3 Metro Shortcuts That Save 1 Hour Daily",
            "premise": "A visual navigation cheat sheet showing how to ride local subway and tram lines like a resident instead of paying 5x for tourist taxis.",
            "hook_first_line": "Do not pay $60 for an airport taxi when the express train takes 18 minutes for $8.",
            "visual_hook": "Fast cut from airport arrival hall to clean modern express train platform in 4K.",
            "story_beats": ["Taxi queue friction comparison", "Buying local contactless card", "Express transit route breakdown", "Screenshot transit guide"],
            "mood": "Smart travel efficiency, dynamic, high utility",
            "brand_lift": "Builds immense audience gratitude for saving money and travel friction."
        },
        {
            "band": "low", "rank": 75, "title": "The Packing Cube Compression Fold for Bulky Winter Sweaters",
            "premise": "The military ranger roll technique that flattens thick knitwear to 1/3 of its volume without creasing the collar.",
            "hook_first_line": "If your winter knitwear takes up your entire suitcase, fold it like this.",
            "visual_hook": "Thick oversized wool sweater rolled into a tight compact cylinder fitting into a small cube.",
            "story_beats": ["Bulky fold problem", "Ranger roll fold technique", "Compression zip closure", "Side-by-side space saving payoff"],
            "mood": "Satisfying organization ASMR, tactile",
            "brand_lift": "Practical packing expertise for frequent travelers."
        }
    ],
    "lifestyle": [
        {
            "band": "high", "rank": 92, "title": "The Curation Over Accumulation Rule: An Interior Living Audit",
            "premise": "Demonstrate that beautiful living spaces are created by what you remove from tables and shelves, not what you buy at decor stores.",
            "hook_first_line": "Clutter isn't just physical; visual clutter is constant background noise for your brain.",
            "visual_hook": "Clearing an overcrowded coffee table down to one stone vessel and a single open art monograph.",
            "story_beats": ["Overcrowded surface audit", "The negative space principle", "Choosing one hero textural piece", "Serene living room reveal"],
            "mood": "Architectural, peaceful, natural daylight",
            "brand_lift": "Positions creator as an editorial interior curator."
        },
        {
            "band": "mid", "rank": 83, "title": "The 15-Minute Sensory Reset for Remote Workers at 3 PM",
            "premise": "A step-by-step afternoon protocol: outdoor natural light exposure, cold water splash, 5-minute movement flow to conquer the afternoon brain slump without coffee.",
            "hook_first_line": "Before you pour your fourth cup of coffee at 3 PM, do this 5-minute nervous system reset.",
            "visual_hook": "Stepping out onto a sunlit balcony, taking a deep breath of fresh air, and drinking cold water with electrolytes.",
            "story_beats": ["The 3 PM slump trap", "Step 1: Direct retinal sunlight exposure", "Step 2: Hydration and cold splash", "Step 3: Hip and spine decompression", "Re-energized focus payoff"],
            "mood": "Energizing, healthy, practical daily wellness",
            "brand_lift": "Promotes sustainable energy and healthy daily rhythms."
        },
        {
            "band": "low", "rank": 74, "title": "The Daily Uniform: Why Wearing One Formula Eliminates Decision Fatigue",
            "premise": "Show a creator's capsule uniform (tailored trousers + high-neck knit + leather loafers) that looks effortlessly sharp every morning in 60 seconds.",
            "hook_first_line": "I haven't spent more than 60 seconds deciding what to wear in 2 years.",
            "visual_hook": "Opening a clean minimalist wardrobe containing 5 identical shirts and 3 pairs of perfectly tailored trousers.",
            "story_beats": ["The decision fatigue of overflowing closets", "The 3-piece daily uniform formula", "Putting on the outfit effortlessly", "Polished mirror check"],
            "mood": "Minimalist luxury, intentional, crisp",
            "brand_lift": "Inspires intentional simplicity and elevated personal style."
        }
    ],
    "creator_education": [
        {
            "band": "high", "rank": 93, "title": "The Visual Hook Geometry: The 0.8-Second Rule",
            "premise": "Break down why static talking-head openers fail, and how motion in the first 0.8 seconds (camera pan, object placement, text pop) increases swipe-stop rate by 40%.",
            "hook_first_line": "Viewers decide whether to swipe past your video before you finish saying your first word.",
            "visual_hook": "Side-by-side comparison: Static standing intro vs dynamic physical movement into frame with text anchor.",
            "story_beats": ["The swipe-away millisecond metric", "The 3 physical motion openers", "Text anchor placement in the upper third", "Analytics retention curve proof"],
            "mood": "Cinematic production masterclass, sharp, data-driven",
            "brand_lift": "Mastery in video retention mechanics and digital storytelling."
        },
        {
            "band": "mid", "rank": 84, "title": "Lighting on a Budget: The 1-Light Softbox Bounce Technique",
            "premise": "Show how bouncing a single $50 key light off a white wall creates soft, expensive, cinematic diffusion instead of harsh direct glare.",
            "hook_first_line": "Stop pointing your ring light directly at your face.",
            "visual_hook": "Turning harsh direct ring light into a soft, diffused cinematic wall bounce with rich facial depth.",
            "story_beats": ["The harsh direct ring light mistake", "Wall bounce physics for large-source diffusion", "Negative fill side shadow for jawline definition", "Cinematic portrait result"],
            "mood": "Studio cinematography, dramatic before/after, practical",
            "brand_lift": "Empowers creators with professional visual production skills."
        },
        {
            "band": "low", "rank": 75, "title": "The Mobile Teleprompter Hack for 1-Take Video Delivery",
            "premise": "Using a voice-scrolling teleprompter app positioned right next to the camera lens so your eyes never look away from the viewer.",
            "hook_first_line": "How to deliver a 60-second script in 1 take without memorizing a single word.",
            "visual_hook": "Behind-the-scenes view of phone screen with scrolling script directly next to lens while subject maintains eye contact.",
            "story_beats": ["Eye-movement giveaway mistake", "Setting script margins to 30% width", "Voice-activated auto-scroll setting", "Flawless delivery example"],
            "mood": "Behind-the-scenes production efficiency",
            "brand_lift": "Saves creators hours in filming and editing."
        }
    ],
    "fitness_wellness_safe": [
        {
            "band": "high", "rank": 92, "title": "The Zone 2 Cardio Longevity Equation: Building Mitochondrial Density",
            "premise": "Explain why constant high-intensity burnout is inferior for fat oxidation and heart health compared to conversational Zone 2 nasal-breathing aerobic training.",
            "hook_first_line": "If you are gasping for air on every single workout, you are training in the metabolic black hole.",
            "visual_hook": "Heart rate zone dashboard showing steady Zone 2 fat oxidation wattage vs lactate spikes.",
            "story_beats": ["The high-intensity exhaustion trap", "The science of mitochondrial efficiency", "The conversational talk test rule", "Weekly 150-minute Zone 2 structure"],
            "mood": "Cardiovascular science, clean biometric data, modern athletic longevity",
            "brand_lift": "High credibility in endurance, longevity, and intelligent training."
        },
        {
            "band": "mid", "rank": 83, "title": "The Foot Mechanics & Ankle Mobility Test for Deep Squats",
            "premise": "Show how stiff ankle dorsiflexion causes lower back rounding in squats, and how 2 minutes of weighted calf stretches fixes depth instantly.",
            "hook_first_line": "Your squat isn't limited by your hips; it’s stuck in your ankle joint.",
            "visual_hook": "Knee-to-wall ankle mobility measurement test showing restricted vs 5-inch mobile ankle travel.",
            "story_beats": ["The butt-wink lower back compensation", "Knee-to-wall diagnostic test", "Elevated heel squat test", "Rock-solid deep squat payoff"],
            "mood": "Biomechanics, practical movement therapy",
            "brand_lift": "Injury-prevention and structural athletic excellence."
        },
        {
            "band": "low", "rank": 74, "title": "The 30-Gram Morning Protein Threshold for Satiety and Muscle Synthesis",
            "premise": "Explain the leucine trigger mechanism: hitting 30g protein at breakfast stabilizes blood glucose and eliminates 11 AM pastry cravings.",
            "hook_first_line": "If you are hungry 2 hours after breakfast, you missed the 30g protein threshold.",
            "visual_hook": "Assembling a clean 32g protein breakfast (Greek yogurt + whey + berries + chia) in 60 seconds.",
            "story_beats": ["The blood sugar spike & crash cycle", "The leucine muscle synthesis trigger", "3 easy 30g breakfast recipes", "Saveable macro chart"],
            "mood": "Nutritional science, clean food prep, high utility",
            "brand_lift": "Delivers practical evidence-based nutrition advice."
        }
    ],
    "commerce_affiliate": [
        {
            "band": "high", "rank": 92, "title": "Cost-Per-Wear Math: Why Cheap Shoes Cost 3x More Over 5 Years",
            "premise": "Break down Goodyear welted resoleable leather shoes ($300 / 10 years / 3 resoles = $40/year) vs glued disposable footwear replaced every 9 months.",
            "hook_first_line": "Buying cheap shoes is the most expensive mistake in your wardrobe.",
            "visual_hook": "Cross-section shoe dissection showing Goodyear welt stitching vs thin glued paperboard in fast-fashion shoes.",
            "story_beats": ["The glued sole peeling failure point", "How Goodyear welting allows 5 resoles", "The 5-year Cost-Per-Wear calculation", "Smart investment buying filter"],
            "mood": "Craftsmanship audit, tactile product dissection, financial intelligence",
            "brand_lift": "Educates audience on conscious consumption and heirloom purchasing."
        },
        {
            "band": "mid", "rank": 83, "title": "The Material Composition Audit: Reading Clothing Tags Before You Buy",
            "premise": "Teach viewers how to spot 95% polyester disguised with marketing terms like 'Cashmere Touch' and 'Silk Feel' in retail stores.",
            "hook_first_line": "Never look at the front of the clothing tag; turn it over to the wash label.",
            "visual_hook": "Flipping garment label revealing '100% Polyester' underneath an expensive gold promotional swing tag.",
            "story_beats": ["Marketing buzzwords exposed", "Natural fiber benchmarks (Cotton, Wool, Linen, Silk)", "Acceptable synthetic blends (5% elastane for stretch)", "Fabric quality cheat sheet"],
            "mood": "Consumer empowerment, sharp eye, retail investigation",
            "brand_lift": "Protects shoppers from deceptive retail fabric labeling."
        },
        {
            "band": "low", "rank": 74, "title": "How to Track Price History and Spot Fake Black Friday 'Discounts'",
            "premise": "A 15-second browser extension demonstration showing price gouging right before sales events to fake 50% discount badges.",
            "hook_first_line": "Before you think you found a 50% off deal, check the 90-day price history graph.",
            "visual_hook": "Screen capture hovering over price chart showing product price increased by 40% two weeks prior to the 'sale'.",
            "story_beats": ["The artificial markup trick", "Using price history tracker tools", "Setting price drop alerts", "Saveable discount verification checklist"],
            "mood": "Fast consumer hack, money-saving utility",
            "brand_lift": "Universal bookmark utility and consumer advocacy trust."
        }
    ],
    "entertainment_comedy": [
        {
            "band": "high", "rank": 93, "title": "The Overly Intense Barista Subculture Parody",
            "premise": "A satirical sketch of a specialty third-wave coffee barista treating a single espresso shot like an organ transplant surgery with precise pipette drops and laser levels.",
            "hook_first_line": "POV: You asked for a splash of milk in your light roast single-origin Ethiopian espresso.",
            "visual_hook": "Barista staring in horror through magnifying loupe as customer reaches for a sugar packet.",
            "story_beats": ["The sacred origin lecture", "The laser-guided tamper alignment", "The existential crisis of milk addition", "The $9.50 total register punch"],
            "mood": "Cinematic satire, deadpan comedic timing, sharp parody",
            "brand_lift": "Drives viral cultural shares and high replay engagement."
        },
        {
            "band": "mid", "rank": 84, "title": "The Fitness Influencer 'Honest Day in the Life' Reality vs Filming",
            "premise": "Expose the absurd logistics of filming 'candid' lifestyle content: setting up the tripod outside, walking back inside to film 'waking up', then walking back to get the camera.",
            "hook_first_line": "What it actually looks like to film an 'effortless' 5 AM morning routine.",
            "visual_hook": "Creator getting out of bed, setting camera on tripod, getting back into bed, pretending to wake up, getting out of bed again to turn camera off.",
            "story_beats": ["The tripod wake-up repetition", "The fake candid coffee pour", "Walking past camera and awkwardly turning around to collect it", "Deadpan self-awareness payoff"],
            "mood": "Meta-comedy, self-deprecating, hilarious behind-the-scenes reality",
            "brand_lift": "Builds high relatability and anti-perfectionist creator charm."
        },
        {
            "band": "low", "rank": 74, "title": "The Panic of the Accidental Video Call Trigger in a Group Chat",
            "premise": "The immediate 0.1-second survival sprint when your finger accidentally brushes the FaceTime button in a 30-person work chat.",
            "hook_first_line": "The fastest reaction time in human history is hanging up an accidental video call.",
            "visual_hook": "Close-up of finger slipping on phone screen, eyes widening in sheer panic, furiously smashing the red end button.",
            "story_beats": ["The accidental screen tap", "The dialing ring chime of doom", "The frantic emergency abort smash", "Checking the chat to see if 'Call Started' message appeared"],
            "mood": "Fast, punchy, universal micro-panic comedy",
            "brand_lift": "Instant viral comment tag loop."
        }
    ],
    "parenting_family": [
        {
            "band": "high", "rank": 92, "title": "The Sensory Overload Decompression Protocol for Parents at 6 PM",
            "premise": "A realistic evening strategy for parents feeling touched-out and sensory-overloaded: 10 minutes of noise-dampening earplugs, warm water hand soak, and partner tag-team.",
            "hook_first_line": "If you find yourself snapping at small noises by 6 PM, your nervous system is in sensory overload.",
            "visual_hook": "Parent putting in discreet acoustic filter earplugs that lower background decibels while keeping kids' voices clear.",
            "story_beats": ["The compounding sensory noise of toys and crying", "Using acoustic damping filters without checking out", "The 5-minute somatic reset transition", "Calm and patient bedtime payoff"],
            "mood": "Honest parental empathy, soothing, practical mental health",
            "brand_lift": "Deep emotional trust and genuine support for modern parents."
        },
        {
            "band": "mid", "rank": 83, "title": "The Realistic Morning Routine vs The Aesthetic Instagram Illusion",
            "premise": "Contrast the staged aesthetic morning with spilled milk, mismatched socks, lost shoes, and the actual sanity-saving systems that keep the family moving.",
            "hook_first_line": "Social media lied to you about what a 'calm' family morning looks like.",
            "visual_hook": "Split screen: Slow-motion pastel aesthetic breakfast vs real toddler throwing toast onto the floor with parent laughing.",
            "story_beats": ["Debunking the pastel perfection myth", "The 3 pre-packing prep hacks done the night before", "Letting go of small aesthetic messes", "Happy, stress-free school departure"],
            "mood": "Warm, authentic, uplifting family reality",
            "brand_lift": "Liberates parents from unrealistic social media perfectionism."
        },
        {
            "band": "low", "rank": 74, "title": "The 10-Second Car Exit Transition Routine for Tantrum-Free Arrivals",
            "premise": "Giving children a 60-second verbal warning before unbuckling car seats: 'In 3 breaths, we are turning off the music and stepping out.'",
            "hook_first_line": "Never unbuckle your child without giving this 10-second transition cue.",
            "visual_hook": "Parent gently counting down 3 fingers before opening the car door smoothly without resistance.",
            "story_beats": ["Why abrupt transitions trigger fight-or-flight in kids", "The 3-breath transition formula", "Letting the child hold the car key fob", "Smooth walking exit payoff"],
            "mood": "Instant parenting hack, peaceful, actionable",
            "brand_lift": "Drives immediate bookmarking and high parental gratitude."
        }
    ]
}

# Merge all cards
for cat_slug, card_list in extra_cards.items():
    if cat_slug in CATEGORIES:
        CATEGORIES[cat_slug]["cards"].extend(card_list)

all_records = []
sql_lines = []
sql_lines.append("-- ===========================================================================")
sql_lines.append("-- ANOMALY BOX: 100% AUTHENTIC NICHE-SPECIFIC VIRAL STOCK SEED (2026)")
sql_lines.append("-- Replaces all generic archetype mad-libs with bespoke, shoot-ready briefs")
sql_lines.append("-- ===========================================================================\n")
sql_lines.append("begin;\n")

# Clear existing legacy archetype inventory safely
sql_lines.append("-- 1. Clean up old stock inventory safely")
sql_lines.append("delete from public.checkout_inventory_reservations;")
sql_lines.append("update public.idea_inventory set status = 'retired' where status = 'available';\n")

for cat_slug, data in CATEGORIES.items():
    cat_name = data.get("name", cat_slug.capitalize())
    cards = data.get("cards", [])
    
    # Ensure category exists
    sql_lines.append(f"""insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('{cat_slug}', '{cat_name}', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;\n""")

    for idx, c in enumerate(cards):
        idea_id = str(uuid.uuid4())
        score_band = c["band"]
        rank = c["rank"]
        title = c["title"].replace("'", "''")
        premise = c["premise"].replace("'", "''")
        first_line = c.get("hook_first_line", title).replace("'", "''")
        visual_hook = c.get("visual_hook", "High contrast opening frame.").replace("'", "''")
        story_beats = c.get("story_beats", ["Hook", "Core Insight", "Proof Demonstration", "Takeaway Action"])
        mood = c.get("mood", "Editorial, authentic, crisp").replace("'", "''")
        brand_lift = c.get("brand_lift", "Establishes authentic creator authority.").replace("'", "''")
        
        card_obj = {
            "title": c["title"],
            "one_sentence_premise": c["premise"],
            "idea_summary": {
                "title": c["title"],
                "premise": c["premise"],
                "target_platform": "instagram_reels",
                "recommended_format": "reels_30_45"
            },
            "video_blueprint": {
                "duration_seconds": 35,
                "scene_arc": " → ".join(story_beats),
                "opening_visual": c.get("visual_hook", "Direct visual demonstration"),
                "visual_texture": mood,
                "pacing": "Rhythmic, confident, zero filler"
            },
            "scene_script": [
                {"beat_number": i + 1, "purpose": beat.split()[0], "visual_action": beat, "spoken_audio": first_line if i == 0 else f"Demonstrate step {i+1} with high clarity and physical evidence."}
                for i, beat in enumerate(story_beats)
            ],
            "hook_performance_pack": {
                "first_line_hook": c.get("hook_first_line", title),
                "first_second_visual_hook": c.get("visual_hook", "Direct visual evidence"),
                "hook_options": [
                    c.get("hook_first_line", title),
                    f"Before you do this in {cat_name}, look at this rule.",
                    f"This is the {cat_name} breakdown I wish I saw 3 years ago.",
                    f"Which mistake are you making in this setup?"
                ]
            },
            "atmosphere_direction": {
                "mood": mood,
                "color_language": "Clean natural daylight, warm undertones, uncluttered composition",
                "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"
            },
            "brand_lift_statement": brand_lift,
            "micro_behavior_guide": {
                "eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof",
                "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile",
                "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"
            },
            "production_requirements": {
                "camera": "Smartphone 4K/24fps or Mirrorless 35mm",
                "lighting": "Soft natural window light or 1 diffused softbox bounce",
                "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect",
                "props": "Real authentic physical objects, no synthetic mockups"
            }
        }

        card_json_str = json.dumps(card_obj, ensure_ascii=False).replace("'", "''")
        hook_options_str = json.dumps(card_obj["hook_performance_pack"]["hook_options"], ensure_ascii=False).replace("'", "''")
        story_beats_str = json.dumps(story_beats, ensure_ascii=False).replace("'", "''")
        inv_metadata_str = json.dumps({
            "production_finalist": True,
            "score_band": score_band,
            "category_slug": cat_slug,
            "authentic_niche_2026": True
        }, ensure_ascii=False).replace("'", "''")

        sql_block = f"""-- [{cat_slug.upper()}] {title} ({score_band.upper()})
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '{idea_id}'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '{title}', '{premise}',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{{"authentic_niche_2026": true}}'::jsonb,
  (select id from public.categories where slug = '{cat_slug}'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '{hook_options_str}'::jsonb, '{story_beats_str}'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '{idea_id}'::uuid, '{title}', '{card_json_str}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '{idea_id}'::uuid,
  (select id from public.categories where slug = '{cat_slug}'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', {rank}, '{score_band}'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{inv_metadata_str}'::jsonb
);
"""
        sql_lines.append(sql_block)

sql_lines.append("\ncommit;\n")

out_sql = "supabase/seeds/authentic_niche_stock_2026.sql"
with open(out_sql, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Generated {out_sql} with {len(sql_lines)-10} authentic cards across all 12 categories!")
