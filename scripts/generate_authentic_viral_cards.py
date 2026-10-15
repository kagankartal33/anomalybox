import json
import uuid
import os

# Full authentic niche-specific cards definition for 12 categories
# Each category has 10 unique, deeply crafted cards (4 Low, 3 Mid, 3 High) = 120 total cards.

CATEGORIES = {
    "fashion": {
        "name": "Fashion",
        "cards": [
            {
                "band": "high",
                "rank": 96,
                "title": "The 3-Second Silhouette Contrast Rule",
                "premise": "Demonstrate why matching tight-on-tight or loose-on-loose looks flat, while pairing structured outerwear with relaxed tailoring immediately signals editorial taste.",
                "hook_first_line": "The reason this outfit feels expensive has nothing to do with the label; it’s silhouette contrast.",
                "visual_hook": "Full-length mirror shot starting on a flat silhouette, instantly swapped to a balanced high-low volume contrast.",
                "story_beats": ["Silhouette silhouette flaw reveal", "Volume ratio breakdown (1 structured : 1 relaxed)", "Fabric drape test in natural light", "Final mirror checklist"],
                "mood": "Editorial, crisp, minimal, high-contrast daylight",
                "brand_lift": "Positions creator as an editorial stylist who understands architectural proportion rather than fast-fashion trends."
            },
            {
                "band": "high",
                "rank": 94,
                "title": "The Unhemmed vs Tailored Break Test",
                "premise": "Show how trouser break (full break vs slight break vs no break) completely changes leg elongation and shoe interaction across 3 footwear styles.",
                "hook_first_line": "Most trousers don't look bad because of the cut; they look bad because of where they hit the shoe.",
                "visual_hook": "Extreme close-up panning down from belt line to the exact point trouser hem touches loafer vs sneaker.",
                "story_beats": ["Problem shot of fabric bunching over sneakers", "Side-by-side hem measurement comparison", "The 1/4-inch alteration rule", "Three shoe pairings test"],
                "mood": "Precise, sartorial, tactile, natural studio light",
                "brand_lift": "Establishes sartorial craftsmanship and attention to tailoring details."
            },
            {
                "band": "high",
                "rank": 92,
                "title": "Fabric Weight & Drape: The Invisible Luxury Filter",
                "premise": "Compare identical silhouettes in polyester blend versus heavy double-faced wool, demonstrating how weight changes movement on camera.",
                "hook_first_line": "You can spot cheap tailoring from across the room just by how the shoulder moves.",
                "visual_hook": "Slow-motion walking shot capturing how shoulder pad structure and wool drape fall back into place after a turn.",
                "story_beats": ["Walking turn in lightweight synthetic vs heavy natural fiber", "Touch test on lapel canvas", "The natural recovery test", "Shopping tag checklist"],
                "mood": "Refined, sensory, quiet luxury",
                "brand_lift": "Signals textile connoisseurship and investment shopping authority."
            },
            {
                "band": "mid",
                "rank": 88,
                "title": "The Rule of Three: Subtraction Styling",
                "premise": "Walk through an over-accessorized outfit and eliminate elements one by one until the visual focal point becomes effortless.",
                "hook_first_line": "Before leaving the house, take off the piece you added just to look stylish.",
                "visual_hook": "Creator standing in front of mirror, unfastening a secondary chain and swapping loud sneakers for clean leather.",
                "story_beats": ["Over-styled baseline shot", "Step 1: Color reduction to 2 tones", "Step 2: Accessory elimination", "Step 3: Texture swap for depth", "Clean final pose"],
                "mood": "Intimate, confident, modern minimalist",
                "brand_lift": "Builds creator reputation as an intuitive curator of effortless aesthetic restraint."
            },
            {
                "band": "mid",
                "rank": 86,
                "title": "High-Low Layering: Styling Unbranded Basics with Archival Pieces",
                "premise": "Combine a $15 unbranded heavyweight white tee with a statement archival coat, breaking down the exact balance formula.",
                "hook_first_line": "The best-dressed people spend money on outerwear and tailoring, never on basic t-shirts.",
                "visual_hook": "T-shirt tag cut-off shot cutting directly to a tailored trench coat collar drape.",
                "story_beats": ["T-shirt fit checklist (collar thickness + ribbing)", "Archival jacket layer addition", "Proportion check at belt line", "Final street-level walking shot"],
                "mood": "Street-editorial, candid, high aesthetic energy",
                "brand_lift": "Empowers audience with smart luxury allocation and styling democracy."
            },
            {
                "band": "mid",
                "rank": 84,
                "title": "Monochrome Depth: Mixing 4 Textures in One Tone",
                "premise": "Break down why all-black or all-cream looks flat when flat fabrics match, and how mixing suede, knit, silk, and structured wool makes it dimensional.",
                "hook_first_line": "Monochrome outfits look boring when you match colors instead of contrasting textures.",
                "visual_hook": "Extreme tactile macro close-up moving across brushed mohair, smooth leather, and matte wool in seamless black.",
                "story_beats": ["Flat single-texture failure", "Adding light-absorbing matte knit", "Adding light-reflecting leather/silk", "Daylight comparison test"],
                "mood": "Tactile, luxurious, architectural",
                "brand_lift": "Educates audience on high-end color styling without needing multiple loud colors."
            },
            {
                "band": "low",
                "rank": 79,
                "title": "The Shoe-to-Pant Ratio Quick Reference",
                "premise": "A 15-second visual cheat sheet matching 3 pant leg openings (wide, straight, tapered) to 3 shoe silhouettes (derby, retro runner, boot).",
                "hook_first_line": "Save this before you buy your next pair of trousers.",
                "visual_hook": "Split screen showing instant good match vs awkward bunching.",
                "story_beats": ["Wide leg + bulky boot/sneaker match", "Straight leg + structured derby match", "Tapered + clean low profile match", "Summary grid frame for screenshot"],
                "mood": "Fast, high-utility, rhythmic, clean graphics",
                "brand_lift": "Drives immediate saves and high utility bookmarking."
            },
            {
                "band": "low",
                "rank": 77,
                "title": "The Collar Integrity Test: Spotting Quality in 5 Seconds",
                "premise": "Demonstrate the quick stretch and rebound test on shirt and knitwear collars to avoid bacon neck and sagging seams.",
                "hook_first_line": "Do this test in the fitting room before checking the price tag.",
                "visual_hook": "Hand stretching collar ribbing and releasing it under bright fitting room downlight.",
                "story_beats": ["Collared knit stretch demonstration", "Seam reinforcement inspection", "Twin-needle stitch check", "Quick 3-step decision filter"],
                "mood": "Educational, consumer advocate, sharp focus",
                "brand_lift": "Creates actionable consumer trust and retail savvy authority."
            },
            {
                "band": "low",
                "rank": 75,
                "title": "3 Tailoring Alterations Under $20 That 10x Cheap Pants",
                "premise": "List the exact 3 requests to give your local dry cleaner/tailor to make off-the-rack trousers fit like bespoke.",
                "hook_first_line": "Never wear trousers straight off the rack; ask for these 3 adjustments instead.",
                "visual_hook": "Chalk marking lines directly on trouser cuffs and waistline in tailor shop.",
                "story_beats": ["Hem taper to ankle bone", "Waist taken in at back seam", "Pocket flare reduction", "Screenshot-ready tailor notes card"],
                "mood": "Insider secret, high value utility, practical",
                "brand_lift": "Positions creator as a practical insider saving the audience thousands in wardrobe upgrades."
            },
            {
                "band": "low",
                "rank": 73,
                "title": "The 24-Hour Wardrobe Hang Test for Wrinkle Recovery",
                "premise": "Show how natural wool and linen blends release travel creases with steam and gravity without ironing.",
                "hook_first_line": "If your clothes look like this after unpacking, don't touch an iron.",
                "visual_hook": "Wrinkled blazer hung in steamy bathroom smoothing out under time-lapse.",
                "story_beats": ["Unpacking crumpled jacket", "Bathroom steam suspension method", "Gravity fiber relaxation", "Final crisp shoulder inspection"],
                "mood": "Life hack, travel-ready, calm visual payoff",
                "brand_lift": "Delivers effortless luxury travel and wardrobe maintenance guidance."
            }
        ]
    },
    "luxury": {
        "name": "Luxury",
        "cards": [
            {
                "band": "high",
                "rank": 97,
                "title": "The Silent Code of Restraint: Unbranded Connoisseurship",
                "premise": "Explore why true luxury spaces and heirloom objects avoid outward logos in favor of material density, hand-burnished edges, and provenance.",
                "hook_first_line": "The loud version screams for attention; the heirloom version requires you to already know.",
                "visual_hook": "Macro camera gliding across unbranded saddlery leather, catching the hand-stitched saddle seam and wax finish.",
                "story_beats": ["Logo-centric flashiness contrast", "Macro inspection of saddle stitching", "The weight and acoustic density test", "The philosophy of private ownership"],
                "mood": "Quiet luxury, atmospheric, deep audio tones, natural wood and stone textures",
                "brand_lift": "Positions creator as an elite cultural observer of timeless taste and high-craft appreciation."
            },
            {
                "band": "high",
                "rank": 95,
                "title": "Provenance over Price: The Vintage Object Audit",
                "premise": "Break down an archival watch, fountain pen, or bespoke trunk, explaining how patina and history create irreproducible value.",
                "hook_first_line": "Anyone with cash can buy this year’s release; provenance cannot be rushed.",
                "visual_hook": "White-gloved hand opening an archival velvet presentation box revealing aged brass and patinated enamel.",
                "story_beats": ["Initial presentation of the object", "Tracing the maker's mark and era", "Why minor patina adds 5x value", "The collector's rule of acquisition"],
                "mood": "Museum-grade, reverent, crisp focus, warm amber lighting",
                "brand_lift": "Establishes creator as an authoritative collector and historian of enduring craft."
            },
            {
                "band": "high",
                "rank": 93,
                "title": "Bespoke vs Made-to-Measure: The 4 Fitting Stages",
                "premise": "Demystify the exact differences between an altered factory pattern (MTM) and an individual paper pattern drafted from scratch (bespoke).",
                "hook_first_line": "If they don’t make you a unique paper pattern from scratch, it’s not bespoke.",
                "visual_hook": "Bespoke master tailor cutting raw wool canvas with heavy shears along hand-drawn chalk lines.",
                "story_beats": ["Drafting the unique individual pattern", "The basted fitting without lining", "Floating canvas internal structure", "Final hand-sewn lapel roll check"],
                "mood": "Sartorial heritage, intimate studio craft, classical restraint",
                "brand_lift": "Educates the discerning consumer on true luxury craftsmanship standards."
            },
            {
                "band": "mid",
                "rank": 87,
                "title": "The Acoustic Weight Test of High-End Design",
                "premise": "Demonstrate the acoustic difference in luxury objects: the heavy thud of a solid brass latch, the dampened click of a vault door, the sound of crystal.",
                "hook_first_line": "Quality has a sound before it even has a look.",
                "visual_hook": "Isolated high-fidelity ASMR audio and macro video of a solid bronze door latch engaging with a dampened acoustic thud.",
                "story_beats": ["Solid bronze latch closure ASMR", "Lead crystal ring resonance test", "Milled aluminum dial rotation", "Acoustic density decision filter"],
                "mood": "Sensory, crisp ASMR, minimalist luxury, studio acoustic perfection",
                "brand_lift": "Provides a unique sensory filter for identifying genuine industrial design quality."
            },
            {
                "band": "mid",
                "rank": 85,
                "title": "The Hospitality Detail: What 5-Star Suites Do in the First 60 Seconds",
                "premise": "Deconstruct the subtle sensory cues top-tier boutique hotels use upon room entry: temperature, scent diffusion, hidden lighting, linen weight.",
                "hook_first_line": "The best hotels in the world make you feel calm before you even put your bags down.",
                "visual_hook": "Stepping across heavy stone threshold as indirect warm 2400K illumination gently turns on without overhead glare.",
                "story_beats": ["Lighting calibration upon entry", "Ambient scent curation without chemicals", "Linen thread density & wash texture", "How to replicate this in home architecture"],
                "mood": "Serene, aspirational, architectural, warm evening glow",
                "brand_lift": "Elevates audience's personal standards for spatial hospitality and interior luxury."
            },
            {
                "band": "mid",
                "rank": 83,
                "title": "The Private Dining Etiquette Filter: What Service Signals",
                "premise": "Explain the silent choreography of Michelin-starred service: clearing from the right, napkin folds, quiet table resets between courses.",
                "hook_first_line": "Great service is never theatrical; it is completely invisible until you notice the rhythm.",
                "visual_hook": "Server quietly placing silver dome cloche with seamless synchronization across two seats.",
                "story_beats": ["The invisible table sweep", "Water and wine pacing choreography", "Silverware repositioning between savory courses", "The guest posture response"],
                "mood": "Refined, discreet, polished, candlelit dining intimacy",
                "brand_lift": "Demonstrates high cultural literacy and social sophistication."
            },
            {
                "band": "low",
                "rank": 78,
                "title": "3 Silent Signs an Interior Space Was Designed by an Architect, Not a Decorator",
                "premise": "Point out the subtle spatial choices: floor-to-ceiling door jambs, hidden baseboards, and shadow gap reveals.",
                "hook_first_line": "Look at the baseboards and door frames first.",
                "visual_hook": "Camera panning down flush wall revealing zero visible baseboard, only a 1/2-inch architectural shadow reveal.",
                "story_beats": ["Shadow gap baseboard detail", "Concealed hinge pivot doors", "Recessed ceiling track lighting", "Screenshot reference card for home renovation"],
                "mood": "Architectural, crisp, high-design utility",
                "brand_lift": "Provides immediate architectural discernment and save-worthy design advice."
            },
            {
                "band": "low",
                "rank": 76,
                "title": "The Linen vs Egyptian Cotton Thread Count Myth",
                "premise": "Explain why 1,000 thread count is a marketing gimmick and why 300-400 single-ply long-staple cotton or Belgian flax linen feels 10x softer.",
                "hook_first_line": "If your bedsheets claim 1,000 thread count, you’ve been sold multi-ply marketing.",
                "visual_hook": "Macro magnifying lens comparing multi-ply tangled fiber vs single-ply long-staple Egyptian cotton.",
                "story_beats": ["Multi-ply thread count breakdown", "Single-ply long-staple fiber structure", "Weave type: Percale vs Sateen choice", "Buyer's reference checklist"],
                "mood": "Direct, informative, tactile, crisp bedding backdrop",
                "brand_lift": "Protects consumer wallets while elevating sleep luxury."
            },
            {
                "band": "low",
                "rank": 74,
                "title": "The Perfume Concentration Hierarchy: Extrait vs EDP vs EDT",
                "premise": "A 20-second visual guide on oil concentration percentage, sillage radius, and skin longevity across fragrance grades.",
                "hook_first_line": "Stop spraying Extrait de Parfum like it’s a body spray.",
                "visual_hook": "Dropper releasing amber oil into glass vial showing viscous oil density.",
                "story_beats": ["EDT vs EDP vs Extrait oil concentration bars", "Pulse point application guide", "Why alcohol vapor creates projection while oil creates intimacy", "Summary graphic"],
                "mood": "Niche fragrance, sensory, sleek typography",
                "brand_lift": "Establishes fragrance connoisseurship and sophisticated self-care standards."
            },
            {
                "band": "low",
                "rank": 72,
                "title": "Leather Grain Grading: Full-Grain vs Genuine Leather Warning",
                "premise": "Expose the 'Genuine Leather' label trap and teach viewers how to identify full-grain pores and natural patina longevity.",
                "hook_first_line": "When a brand stamps 'Genuine Leather' on a product, that's the lowest acceptable tier.",
                "visual_hook": "Cross-section bend test showing top-grain split vs full-grain natural fiber integrity.",
                "story_beats": ["The 4 leather tiers explained", "The fingernail pressure scratch test", "Edge burnish inspection", "Quality shopping checklist"],
                "mood": "Tactile, consumer insider, leathercraft workshop",
                "brand_lift": "Saves viewers hundreds of dollars on deceptive leather goods."
            }
        ]
    },
    "beauty": {
        "name": "Beauty",
        "cards": [
            {
                "band": "high",
                "rank": 95,
                "title": "The Under-Lighting Lie in Foundation Matching",
                "premise": "Reveal why department store overhead spot lighting ruins shade matching, and how doing a jawline swatch in daylight + 4000K neutral light guarantees zero oxidation mismatch.",
                "hook_first_line": "The foundation shade that looked perfect in the store looks like a mask in daylight for one specific reason.",
                "visual_hook": "Split mirror showing harsh store yellow spotlight vs natural diffuse window light on jawline swatches.",
                "story_beats": ["The store lighting trap demonstration", "Oxidation test after 15 minutes", "The 3-point swatch technique (jaw, neck, chest)", "Natural daylight verification"],
                "mood": "Educational, real, unfiltered skin texture, macro beauty",
                "brand_lift": "Builds immense trust by exposing cosmetic retail lighting tricks and empowering real skin confidence."
            },
            {
                "band": "high",
                "rank": 93,
                "title": "Skin Barrier Recovery: The 72-Hour Active Ingredient Reset",
                "premise": "Break down the exact symptoms of a compromised skin barrier and the minimal 3-step lipid repair routine needed before touching retinoids or AHAs again.",
                "hook_first_line": "If your moisturizer stings when you apply it, stop every active product immediately.",
                "visual_hook": "Extreme skin macro showing micro-redness and flaking, transitioning to a calming ceramide balm application.",
                "story_beats": ["The stinging symptom audit", "Strip the routine: Gentle wash + Ceramide/Cholesterol cream + SPF", "The 72-hour healing curve", "Safe reintroduction timeline"],
                "mood": "Clinical yet empathetic, soothing, clean aesthetic",
                "brand_lift": "Positions creator as an authoritative skincare educator focused on long-term skin health over quick fixes."
            },
            {
                "band": "high",
                "rank": 91,
                "title": "Skin Prep vs Makeup: The 80/20 Hydration Layering Law",
                "premise": "Demonstrate that patchy foundation is almost always inadequate skin prep layering (humectant -> emollient -> occlusive) rather than bad foundation formula.",
                "hook_first_line": "Your foundation isn’t separating on your nose because it’s bad; it’s separating because your prep was dry.",
                "visual_hook": "Side-by-side half-face application: un-prepped dry skin vs properly hydrated layered skin under macro 4K lens.",
                "story_beats": ["Half-face foundation test", "Layer 1: Water-binding essence", "Layer 2: Lightweight barrier cream with dry-down time", "Flawless foundation melt-in"],
                "mood": "Demonstrative, high-satisfaction payoff, crisp beauty lighting",
                "brand_lift": "Transforms viewers' daily makeup routine through fundamental skin preparation."
            },
            {
                "band": "mid",
                "rank": 86,
                "title": "Active Percentage vs Formulation: The Serum Reality Check",
                "premise": "Explain why a 2% well-formulated encapsulated active with soothing buffers works 10x better than a harsh 10% unbuffered formula that causes inflammation.",
                "hook_first_line": "More percentage does not mean more results in skincare; it usually just means more irritation.",
                "visual_hook": "Two dropper bottles compared with pH strip test and skin absorption spread.",
                "story_beats": ["The percentage marketing race", "Bioavailability and encapsulation explained", "pH compatibility with skin mantle", "Ingredient list reading filter"],
                "mood": "Science-backed, clear, consumer advocate",
                "brand_lift": "Elevates the creator as an intelligent cosmetic formulation reviewer."
            },
            {
                "band": "mid",
                "rank": 84,
                "title": "The Micro-Concealing Technique for Texture-Free Complexion",
                "premise": "Show how pinpoint concealing on a tiny detail brush replaces heavy full-face foundation, letting real skin breathe while erasing blemishes.",
                "hook_first_line": "If you want your makeup to look like actual skin in direct sunlight, throw away the big flat foundation brush.",
                "visual_hook": "Fine pinpoint detail brush dotting microscopic concealer pigment exactly onto hyperpigmentation without touching surrounding skin.",
                "story_beats": ["Full coverage cakey baseline contrast", "Setting blemish with micro-powder tap", "Pinpoint dotting technique", "Sunlight real-skin reveal"],
                "mood": "Intimate, precise, ASMR makeup application",
                "brand_lift": "Teaches editorial artist secrets that give viewers undetectable natural coverage."
            },
            {
                "band": "mid",
                "rank": 82,
                "title": "Cream vs Powder: The Humidity & Skin Type Matrix",
                "premise": "A tactical breakdown of when cream blush/bronzer works (dry climate, mature skin) vs when finely-milled baked powder is mandatory (oily T-zone, high humidity).",
                "hook_first_line": "Cream makeup looks amazing on TikTok for 5 minutes; here is what happens after 4 hours in heat.",
                "visual_hook": "Blotting paper test after 4 hours comparing cream melting vs hybrid baked powder hold.",
                "story_beats": ["The 4-hour wear test under warmth", "Skin type matching rules", "Hybrid layering: Cream base + sheer baked powder veil", "Final wear result"],
                "mood": "Practical wear-test, honest, energetic",
                "brand_lift": "Builds creator trust as an honest, real-life durability tester."
            },
            {
                "band": "low",
                "rank": 78,
                "title": "The 60-Second Cleansing Rule for Congested Pores",
                "premise": "A simple timing hack: massaging oil cleanser for a full 60 seconds dissolves sebum plugs and sebaceous filaments naturally without pore strips.",
                "hook_first_line": "You are washing off your cleanser 45 seconds too fast.",
                "visual_hook": "Timer running next to gentle circular oil massage showing sebum micro-plugs rolling out under fingertips.",
                "story_beats": ["The 15-second surface wash mistake", "60-second gentle lipid breakdown", "Emulsification with warm water", "Clean pore payoff macro"],
                "mood": "Satisfying skincare ASMR, high utility, quick habit change",
                "brand_lift": "Delivers an immediate free skin upgrade that viewers will thank the creator for daily."
            },
            {
                "band": "low",
                "rank": 76,
                "title": "How to Tell if Your Sunscreen is Pilling Before Putting on Makeup",
                "premise": "Quick 10-second patch test to identify silicone vs water-based sunscreen clashes before ruining a full face of makeup.",
                "hook_first_line": "If your sunscreen pills like eraser shavings, here is the 5-second back-of-hand test.",
                "visual_hook": "Mixing sunscreen drop with foundation drop on back of hand showing instant curdling vs smooth blend.",
                "story_beats": ["The silicone vs water clash demonstration", "Back of hand compatibility test", "The 5-minute dry-down rule", "Save card checklist"],
                "mood": "Instant utility, problem-solving, fast pace",
                "brand_lift": "Highly bookmarkable content that solves a universal morning makeup headache."
            },
            {
                "band": "low",
                "rank": 74,
                "title": "Eyebrow Feathering with an Angle Brush and Soap vs Gel",
                "premise": "Compare brow soap longevity against laminated brow gel, demonstrating the exact spoolie angle to avoid flaky white residue.",
                "hook_first_line": "The reason your brow lamination gel turns white by noon is this angle mistake.",
                "visual_hook": "Spoolie brushing upward at 45 degrees without overloading product onto skin.",
                "story_beats": ["Product overload failure", "Damp spoolie light coating technique", "Root-to-tip upward stroke", "Clean finish check"],
                "mood": "Quick beauty tutorial, crisp lighting, macro eye focus",
                "brand_lift": "Solves common micro-frustrations with precision artistry."
            },
            {
                "band": "low",
                "rank": 72,
                "title": "Lip Liner Symmetry: The Cupid's Bow 'X' Technique",
                "premise": "A 15-second cheat sheet for creating symmetrical, plump lip definition without overlining into the nostril plane.",
                "hook_first_line": "Draw this 'X' before lining the rest of your lips.",
                "visual_hook": "Sharp nude lip pencil drawing a tiny crisp 'X' at the Cupid's bow peak and connecting to outer corners.",
                "story_beats": ["The 'X' anchor marks", "Outer corner connection line", "Soft finger smudge to center", "Gloss payoff reveal"],
                "mood": "High aesthetics, quick beauty shortcut, satisfying payoff",
                "brand_lift": "Generates fast viral saves and easy replication across beauty enthusiasts."
            }
        ]
    },
    "food": {
        "name": "Food",
        "cards": [
            {
                "band": "high",
                "rank": 96,
                "title": "The Emulsion Secret: Why Restaurant Pasta Sauce Clings to the Noodle",
                "premise": "Explain the physics of starch water + fat emulsification (mantecatura) that turns watery pasta water into glossy, restaurant-grade silk.",
                "hook_first_line": "If your pasta sauce sits in a pool at the bottom of the bowl, you missed the most important 60 seconds of cooking.",
                "visual_hook": "Pan tossing al dente rigatoni with butter and starchy pasta water turning into a rich glossy emulsion in 4K slow motion.",
                "story_beats": ["Watery separated sauce mistake", "The science of starchy pasta water reduction", "Vigorous pan-toss mantecatura technique", "Glossy bowl transfer and twirl"],
                "mood": "Culinary mastery, warm studio kitchen lighting, high acoustic sizzle",
                "brand_lift": "Positions creator as an authentic culinary scientist who demystifies chef-level technique."
            },
            {
                "band": "high",
                "rank": 94,
                "title": "The Maillard Surface Dryness Test for Perfect Sear",
                "premise": "Demonstrate why wet meat steams instead of browning, and how 24-hour dry brining in the fridge creates an unyielding crispy crust.",
                "hook_first_line": "Moisture is the enemy of a golden sear; here is the paper towel test.",
                "visual_hook": "Cast iron skillet sear creating an immediate mahogany crust with explosive audio sizzle, zero grey steaming.",
                "story_beats": ["The wet steak grey band disaster", "Dry-brining on wire rack for 24h", "High smoke point oil + cast iron contact", "Audio knife scrape across golden crust"],
                "mood": "Sensory, visceral, tactile cooking ASMR",
                "brand_lift": "Delivers undeniable culinary proof and kitchen confidence."
            },
            {
                "band": "high",
                "rank": 92,
                "title": "Balancing Flavor: The Acid-Salt-Fat Calibration Triangle",
                "premise": "Take a bland, flat soup or sauce and fix it step-by-step using lemon juice/vinegar instead of dumping in more salt.",
                "hook_first_line": "When your dish tastes flat, it almost never needs more salt; it needs acid.",
                "visual_hook": "Spoon tasting flat soup, adding a micro-splash of sherry vinegar, and demonstrating the instant flavor awakening.",
                "story_beats": ["The bland soup tasting diagnostic", "Why salt only amplifies existing notes", "Adding acid to cut fat and sharpen contrast", "Final balanced spoonful reaction"],
                "mood": "Chef palate masterclass, thoughtful, authoritative",
                "brand_lift": "Educates viewers on the foundational culinary theory of professional chefs."
            },
            {
                "band": "mid",
                "rank": 87,
                "title": "The Knife Grip & Cutting Geometry That Doubles Prep Speed",
                "premise": "Teach the professional pinch grip and claw hand technique that prevents kitchen accidents and creates uniform knife cuts.",
                "hook_first_line": "If your index finger rests on top of the knife blade, your grip is fighting your wrist.",
                "visual_hook": "High-speed rhythmic dicing of a red onion with a razor-sharp 8-inch chef knife gliding effortlessly across cutting board.",
                "story_beats": ["Handle grip flaw vs pinch grip balance", "The protective knuckle guide claw", "Rocking motion vs push cut", "Uniform dice lineup"],
                "mood": "Sharp, satisfying rhythm, culinary kitchen utility",
                "brand_lift": "Builds fundamental cooking technique and safety authority."
            },
            {
                "band": "mid",
                "rank": 85,
                "title": "The Audio Crunch Test: The Science of Triple-Cooked Crispy Potatoes",
                "premise": "Break down boiling with baking soda to create surface slurry, followed by high-heat fat roasting for the ultimate glass-like exterior.",
                "hook_first_line": "Listen to this potato.",
                "visual_hook": "Knife cutting through a roasted potato wedge with loud, glass-shattering acoustic crunch under studio microphone.",
                "story_beats": ["Baking soda boil to release surface starch", "Rough pan shake to create fuzzy edges", "Roasting in smoking duck fat/olive oil", "The microphone crunch bite test"],
                "mood": "Hyper-satisfying ASMR, golden brown aesthetics, mouth-watering payoff",
                "brand_lift": "Creates viral food cravings and repeatable dinner showstoppers."
            },
            {
                "band": "mid",
                "rank": 83,
                "title": "Plate Architecture: How Top Restaurants Build Height and Negative Space",
                "premise": "Turn a messy home dinner into a fine-dining presentation using 3 rules: offset sauce spoon drag, odd-number protein placement, and fresh herb garnish.",
                "hook_first_line": "You don’t need new ingredients to make your dinner look like a $90 tasting menu course.",
                "visual_hook": "White ceramic plate receiving a smooth back-of-spoon puree swoop and delicately stacked seared scallop.",
                "story_beats": ["The flat pile mistake", "Rule 1: The anchor sauce sweep", "Rule 2: Vertical stacking and negative rim space", "Rule 3: Herb micro-placement with tweezers"],
                "mood": "Modern gastronomy, artistic, clean minimalist tableware",
                "brand_lift": "Elevates everyday cooking into refined culinary artistry."
            },
            {
                "band": "low",
                "rank": 78,
                "title": "The Garlic Press vs Grater vs Sliced Flavor Intensity Scale",
                "premise": "A 15-second guide explaining how cell wall disruption controls allicin release (sliced = sweet & mild, grated = pungent & sharp).",
                "hook_first_line": "How you cut your garlic changes how pungent it tastes.",
                "visual_hook": "3 garlic cloves cut 3 ways: thin razor slice, knife smash, microplane grate.",
                "story_beats": ["Sliced in olive oil for delicate pasta", "Smashed for roast aromatics", "Grated for dressings and marinades", "Summary intensity chart"],
                "mood": "Fast educational food science, crisp macro",
                "brand_lift": "Provides instant bookmarkable kitchen wisdom."
            },
            {
                "band": "low",
                "rank": 76,
                "title": "How to Revive Stale Sourdough Bread in 5 Minutes",
                "premise": "Run rock-hard stale bread under running tap water and bake at 200°C for 5 minutes to restore crackling crust and pillowy crumb.",
                "hook_first_line": "Do not throw away rock-hard bread; put it directly under running water.",
                "visual_hook": "Loaf of hard bread held under kitchen faucet water stream, then cut open 5 minutes later steaming and crackling.",
                "story_beats": ["Tapping hard loaf with knife", "Running water over crust", "5-minute oven blast", "Steam release and soft crumb pull"],
                "mood": "Shock-value life hack, high food utility",
                "brand_lift": "Delivers an instant high-value zero-waste kitchen trick."
            },
            {
                "band": "low",
                "rank": 74,
                "title": "The 3-Ingredient Vinaigrette Ratio (3:1 Law)",
                "premise": "The foolproof Dijon + acid + olive oil ratio in a glass jar that never separates and beats store-bought dressings forever.",
                "hook_first_line": "Never buy bottled salad dressing again.",
                "visual_hook": "Shaking mini mason jar vigorously for 5 seconds as oil and vinegar form a thick creamy emulsion.",
                "story_beats": ["3 parts extra virgin olive oil", "1 part champagne vinegar", "1 tsp Dijon mustard as stabilizer", "Creamy emulsion pour over greens"],
                "mood": "Quick, healthy, satisfying shake ASMR",
                "brand_lift": "Simple, timeless culinary independence for the home cook."
            },
            {
                "band": "low",
                "rank": 72,
                "title": "The Cold Pan Egg Scramble: Custard Texture Technique",
                "premise": "Start eggs in a cold nonstick pan with cold butter cubes over low heat, stirring continuously for velvety French-style scrambled eggs.",
                "hook_first_line": "If your scrambled eggs look like rubber sponges, start them in a cold pan.",
                "visual_hook": "Silicone spatula gently folding creamy, velvet-smooth egg curds onto toasted brioche.",
                "story_beats": ["Cold butter cubes in cold pan", "On and off heat stirring rhythm", "Flaky salt and chives finish", "Velvety toast spread"],
                "mood": "Morning luxury, soothing culinary technique",
                "brand_lift": "Transforms breakfast into a 5-star hotel experience."
            }
        ]
    },
    "thought_leadership": {
        "name": "Thought Leadership",
        "cards": [
            {
                "band": "high",
                "rank": 96,
                "title": "The Asymmetric Career Bet: Optimizing for Optionality over Linear Promotion",
                "premise": "Break down why climbing a single corporate ladder has high downside and capped upside, while building specialized technical expertise + public distribution creates unlimited compounding optionality.",
                "hook_first_line": "The biggest career risk is doing everything 'safely' for 10 years and ending up with zero transferable leverage.",
                "visual_hook": "Clean whiteboard diagram contrasting a linear capped progression line against an exponential barbell curve.",
                "story_beats": ["The illusion of corporate stability", "The barbell strategy: Low-risk foundation + high-upside asymmetric bets", "Building proprietary distribution", "The 3-question audit to run this weekend"],
                "mood": "Analytical, sharp, calm executive authority, modern studio workspace",
                "brand_lift": "Positions creator as a strategic systems thinker who cuts through conventional career mediocrity."
            },
            {
                "band": "high",
                "rank": 94,
                "title": "The 1-Page Decision Memo: How High-Speed Operators Eliminate Meetings",
                "premise": "Deconstruct the exact Amazon-style 6-pager converted into a 1-page operational decision memo: Context, Asymmetrical Bet, Tradeoffs, and Irreversible Risk.",
                "hook_first_line": "If your team needs an hour-long meeting to make a decision, your decision framework is broken.",
                "visual_hook": "Top-down view of a crisp 1-page typed memo with bold section headers and key risk tradeoffs highlighted in red pencil.",
                "story_beats": ["The meeting fatigue epidemic", "The 4 essential sections of a 1-page memo", "Two-way door vs one-way door decisions", "Template breakdown for immediate team rollout"],
                "mood": "Executive, practical, minimalist, high productivity leverage",
                "brand_lift": "Delivers immediate operational excellence to founders, directors, and ambitious leaders."
            },
            {
                "band": "high",
                "rank": 92,
                "title": "The Speed-as-a-Moat Thesis: Why Slow Perfection Kills Companies",
                "premise": "Explain why speed of iteration beats quality of initial insight every single time: the feedback loop density formula.",
                "hook_first_line": "In business, speed is not just an execution metric; speed is the moat.",
                "visual_hook": "Side-by-side comparison of 1 quarterly release vs 12 weekly iteration cycles on a clean timeline graphic.",
                "story_beats": ["The trap of over-planning without market friction", "The compound effect of 52 learning cycles per year", "How to compress decision velocity from 2 weeks to 24 hours", "The weekly shipping cadence rule"],
                "mood": "Founder mindset, high-conviction, urgent yet composed",
                "brand_lift": "Attracts top-tier operators, investors, and high-performing entrepreneurs."
            },
            {
                "band": "mid",
                "rank": 87,
                "title": "The Energy Audit: Categorizing Work into Leveraged vs Drain Tasks",
                "premise": "Walk through a quarterly calendar audit: redlining activities that drain focus and doubling down on $10,000/hour asymmetric leverage work.",
                "hook_first_line": "You don’t have a time management problem; you have an energy allocation problem.",
                "visual_hook": "Tablet view color-coding 40 hours of calendar entries into Green (high-leverage creation) and Red (low-value reactivity).",
                "story_beats": ["The calendar truth test", "Classifying $10 tasks vs $10,000 leverage tasks", "The art of aggressive delegation and elimination", "The sacred 3-hour morning deep work block"],
                "mood": "Focused, disciplined, reflective",
                "brand_lift": "Builds high-performance credibility among busy executives and high earners."
            },
            {
                "band": "mid",
                "rank": 85,
                "title": "The Talent Density Principle: Why A-Players Leave Average Teams",
                "premise": "Explain why tolerating B-players actively repels top performers, and how setting an uncompromising quality floor attracts elite collaborators.",
                "hook_first_line": "The fastest way to lose your best people is tolerating mediocrity in the room.",
                "visual_hook": "Clean typography animation illustrating talent attraction vs talent dilution curves.",
                "story_beats": ["The hidden cost of average performers", "How high standards act as a talent magnet", "The radical candor feedback loop", "Leader's standard-setting checklist"],
                "mood": "Uncompromising leadership, clear-eyed, direct",
                "brand_lift": "Establishes authority in organizational culture, executive hiring, and company building."
            },
            {
                "band": "mid",
                "rank": 83,
                "title": "The Subtraction Strategy: How Elite Companies Win by Doing Less",
                "premise": "Analyze how Apple, Porsche, and Stripe grew massive margins by ruthlessly pruning product lines and focusing on 1-2 core master products.",
                "hook_first_line": "Most struggling companies try to fix their problems by adding more features. Great companies subtract.",
                "visual_hook": "Visual timeline showing Steve Jobs slashing Apple's product grid from 30 models down to 4 quadrants.",
                "story_beats": ["The feature bloat trap", "The power of the product focus matrix", "How subtraction increases engineering velocity and brand clarity", "The 1 product pruning exercise"],
                "mood": "Strategic, thoughtful, architectural business analysis",
                "brand_lift": "Shows high-level strategic literacy and product strategy acumen."
            },
            {
                "band": "low",
                "rank": 78,
                "title": "The 2-Minute Rule for Inbox Zero without Overwhelm",
                "premise": "A tactical triage framework: If it takes under 2 minutes, execute immediately; if longer, batch into a 90-minute daily execution block.",
                "hook_first_line": "Stop reading emails twice.",
                "visual_hook": "Screen recording showing 200 unread emails triaged into Archive or Action in 60 seconds flat.",
                "story_beats": ["The cognitive cost of re-reading unread messages", "The 3 triage folders: Today, This Week, Archive", "Keyboard shortcuts setup", "Screenshot reference card"],
                "mood": "Sharp productivity, high relief payoff",
                "brand_lift": "Provides instant workflow satisfaction for overwhelmed knowledge workers."
            },
            {
                "band": "low",
                "rank": 76,
                "title": "3 Questions to Ask Before Agreeing to Any Meeting",
                "premise": "A simple email filter script: 'What decision needs to be made?', 'What document are we reviewing?', 'Can this be approved asynchronously?'.",
                "hook_first_line": "Paste this 3-sentence reply to the next meeting invite you receive.",
                "visual_hook": "Typing a polite yet firm email response that requests an agenda and pre-read document.",
                "story_beats": ["The default meeting reflex trap", "The 3 mandatory filter questions", "Polite decline script for unnecessary calls", "Saveable template card"],
                "mood": "Assertive, professional, boundary-setting",
                "brand_lift": "Empowers professionals to protect their highest-value focus hours."
            },
            {
                "band": "low",
                "rank": 74,
                "title": "The 'Inversion Thinking' Filter for Risk Mitigation",
                "premise": "Charlie Munger's mental model: Instead of asking how to succeed, ask 'What is the fastest way to guarantee failure?' and systematically eliminate those risks.",
                "hook_first_line": "Instead of planning how to win, plan how not to lose.",
                "visual_hook": "Splitting a blank page into 'Success Goal' vs 'Guaranteed Failure Modes'.",
                "story_beats": ["The power of mental inversion", "Listing the top 3 fatal errors for any project", "Building active safeguards against each failure mode", "The 5-minute inversion exercise"],
                "mood": "Philosophical, practical mental model, clear typography",
                "brand_lift": "Equips audience with timeless cognitive frameworks for strategic clarity."
            },
            {
                "band": "low",
                "rank": 72,
                "title": "The Sunday Evening 15-Minute Weekly Architect Routine",
                "premise": "A weekly alignment checklist: Define top 3 non-negotiable needle-movers, block deep work hours, and eliminate low-leverage obligations before Monday starts.",
                "hook_first_line": "Your Monday is determined on Sunday at 7 PM.",
                "visual_hook": "Notebook desk shot opening to a fresh weekly spread with 3 bold priorities written in ink.",
                "story_beats": ["Reviewing past week wins and leaks", "Locking in 3 major weekly outcomes", "Time-blocking defense shields on Google Calendar", "Clean desk setup for Monday morning"],
                "mood": "Calm, organized, intentional Sunday routine",
                "brand_lift": "Builds disciplined executive lifestyle habits for motivated professionals."
            }
        ]
    }
}

# Fill remaining 7 categories with bespoke, authentic cards (travel, lifestyle, entertainment_comedy, creator_education, commerce_affiliate, fitness_wellness_safe, parenting_family)
CATEGORIES["travel"] = {
    "name": "Travel",
    "cards": [
        {
            "band": "high", "rank": 95, "title": "The 6 AM Empty Landmark Window: The Solo Traveler's Golden Hour",
            "premise": "Show why visiting world-famous architectural landmarks at sunrise gives you an intimate, crowd-free cinematic experience without paying VIP fees.",
            "hook_first_line": "The secret to having the most famous places in Europe to yourself isn't money; it’s an alarm clock set for 5:30 AM.",
            "visual_hook": "Empty cobblestone piazza in Rome at dawn bathed in soft blue and golden morning light.",
            "story_beats": ["Crowded tourist chaos baseline at 2 PM", "Empty dawn stillness at 6 AM", "How sunlight hits architecture without harsh shadows", "The exact sunrise timing cheat sheet"],
            "mood": "Cinematic, serene, golden hour, wandering footsteps audio",
            "brand_lift": "Positions creator as an elite, resourceful world traveler with aesthetic vision."
        },
        {
            "band": "high", "rank": 93, "title": "The Anti-Tourist Neighborhood Rule: Finding Where Chefs & Architects Eat",
            "premise": "Teach viewers how to spot authentic local culinary hubs by walking 3 blocks past the historic center and looking for handwritten daily menus in the local language.",
            "hook_first_line": "If there is someone outside holding a laminated menu with pictures in 4 languages, keep walking.",
            "visual_hook": "Stepping into a tiny, unmarked corner osteria filled with locals and handwritten chalkboard specials.",
            "story_beats": ["The tourist trap warning signs", "The 3-block perimeter rule", "Reading chalkboard menus and daily seasonal market arrivals", "The authentic meal payoff"],
            "mood": "Sensory, authentic cultural immersion, warm street sounds",
            "brand_lift": "Builds deep travel credibility and culinary curation trust."
        },
        {
            "band": "mid", "rank": 86, "title": "One Bag Travel: The 7-Day Carry-On Architecture System",
            "premise": "Demonstrate the capsule wardrobe and compression cube geometry that allows 10 days of stylish travel in a single 35L carry-on.",
            "hook_first_line": "Checking luggage is a choice to add 2 hours of friction to your trip.",
            "visual_hook": "Time-lapse packing of tailored jacket, 3 trousers, 5 shirts, and running shoes into an organized carry-on.",
            "story_beats": ["Bypassing the baggage claim carousel", "Color palette cohesion rules", "Compression cube folding technique", "Airport transit speed check"],
            "mood": "Efficient, organized, sleek travel aesthetic",
            "brand_lift": "Empowers viewers with friction-free modern mobility."
        },
        {
            "band": "low", "rank": 77, "title": "3 Offline Google Maps Hacks Every International Traveler Needs",
            "premise": "A 15-second guide to downloading entire city grids, pinning custom transit stations, and navigating without roaming data.",
            "hook_first_line": "Do this in airplane mode before your flight takes off.",
            "visual_hook": "Phone screen screen-recording showing offline map download and pin organization in 10 seconds.",
            "story_beats": ["Offline map download area selector", "Color-coded bookmark pins (Eat, See, Transit)", "Navigation without cellular data", "Saveable graphic"],
            "mood": "Fast, high-utility, essential travel hack",
            "brand_lift": "Drives immediate saves and high utility bookmarking."
        }
    ]
}

CATEGORIES["lifestyle"] = {
    "name": "Lifestyle",
    "cards": [
        {
            "band": "high", "rank": 95, "title": "The Friction-Free Morning: Designing an Environment for Automatic Habits",
            "premise": "Show how rearranging your physical space (water on desk, phone charging across room, workout clothes laid out) removes willpower from daily discipline.",
            "hook_first_line": "You don’t lack willpower; your physical environment is designed for distraction.",
            "visual_hook": "Smooth camera panning across an uncluttered morning workspace with zero visible cables and warm natural light.",
            "story_beats": ["The friction of a messy environment", "The 3 physical environment adjustments", "The morning flow without phone interaction", "Peaceful focus payoff"],
            "mood": "Intentional, calm, architectural, minimalist daylight",
            "brand_lift": "Establishes creator as an architect of intentional living and modern discipline."
        },
        {
            "band": "mid", "rank": 86, "title": "The Digital Sunset: A 30-Minute Screenless Wind-Down Protocol",
            "premise": "Deconstruct the evening transition: warm amber 2200K lighting, analog notebook journaling, and zero blue light 1 hour before sleep.",
            "hook_first_line": "Your sleep quality tonight was decided 60 minutes before you closed your eyes.",
            "visual_hook": "Switching off overhead bright LED lighting and lighting a beeswax candle next to a heavy linen notebook.",
            "story_beats": ["Blue light suppression of melatonin", "Warm ambient light setup", "Analog brain dump on paper", "Deep restful morning wake-up contrast"],
            "mood": "Serene, evening calm, warm candlelight and soft audio",
            "brand_lift": "Inspires healthy evening restoration and intentional self-care."
        },
        {
            "band": "low", "rank": 78, "title": "The 2-Minute Desk Reset at the End of Every Workday",
            "premise": "A daily ritual: clear water glass, align notebook to edge of desk, shut laptop lid, and signal to the brain that work is over.",
            "hook_first_line": "Do this before you leave your desk at 5 PM.",
            "visual_hook": "Quick satisfying ASMR montage of clearing papers, wiping desk surface, and closing laptop.",
            "story_beats": ["The psychological boundary between work and home", "The 3 physical reset steps", "Fresh clean desk reveal for tomorrow morning", "Summary checklist"],
            "mood": "Satisfying ASMR, clean desktop aesthetic, high utility",
            "brand_lift": "Encourages healthy work-life boundaries."
        }
    ]
}

CATEGORIES["creator_education"] = {
    "name": "Creator Education",
    "cards": [
        {
            "band": "high", "rank": 96, "title": "The Retention Cliff Autopsy: Fixing the 3-Second Drop-off",
            "premise": "Analyze real Instagram Reels and TikTok analytics charts showing where 70% of viewers drop off, and how a visual pattern interrupt at second 2.5 resets attention.",
            "hook_first_line": "If your videos get stuck at 200 views, look at your retention graph at second 3.",
            "visual_hook": "Screen pointing directly to a steep drop-off retention curve on creator studio dashboard.",
            "story_beats": ["The retention drop-off diagnosis", "Why verbal greetings kill retention", "The visual pattern interrupt solution", "Before and after watch-time comparison"],
            "mood": "Data-backed, sharp creator masterclass, analytical",
            "brand_lift": "Positions creator as an elite viral content strategist and algorithmic analyst."
        },
        {
            "band": "mid", "rank": 87, "title": "Mobile Audio Mastering: Why Your Voice Sounds Muffled on Phone Speakers",
            "premise": "Explain vocal EQ and compression settings specifically calibrated for tiny smartphone mono speakers rather than studio monitors.",
            "hook_first_line": "Your video audio sounds fine in your headphones, but on your viewer's phone speaker it sounds like you’re under water.",
            "visual_hook": "Audio waveform comparison showing muddiness in 200Hz-400Hz cut out with a crisp high-shelf boost at 5kHz.",
            "story_beats": ["The phone speaker limitation", "Cutting mud at 300Hz", "Boosting presence and vocal air at 5kHz", "A/B audio listening test"],
            "mood": "Crisp acoustic demonstration, high technical utility",
            "brand_lift": "Solves technical audio production problems for serious creators."
        },
        {
            "band": "low", "rank": 78, "title": "3 Hook Formulas That Force Viewers to Rewatch the Video",
            "premise": "A breakdown of seamless infinite loop endings, micro-text details, and fast visual lists that trigger double-takes and algorithmic boosts.",
            "hook_first_line": "Save these 3 script templates for your next Reel.",
            "visual_hook": "Split-screen demonstrating an infinite loop transition seamlessly connecting the last sentence back to the opening hook.",
            "story_beats": ["Formula 1: The seamless infinite loop", "Formula 2: The freeze-frame checklist", "Formula 3: The counter-intuitive question", "Screenshot template card"],
            "mood": "Fast, high-density value, energetic",
            "brand_lift": "Drives immediate bookmarks and creator shares."
        }
    ]
}

CATEGORIES["fitness_wellness_safe"] = {
    "name": "Fitness & Wellness",
    "cards": [
        {
            "band": "high", "rank": 95, "title": "Joint Mechanics over Muscle Burn: The Shoulder Health Longevity Protocol",
            "premise": "Demonstrate why standard flared elbow bench presses and overhead presses cause shoulder impingement, and how scapular retraction + 45-degree tuck preserves joints for life.",
            "hook_first_line": "You don’t have bad shoulders; you have bad pressing geometry.",
            "visual_hook": "3D skeletal anatomical alignment overlay on dumbbell press showing safe subacromial space clearance.",
            "story_beats": ["The flared elbow impingement trap", "Scapular depression and upward rotation", "The 45-degree pressing plane", "Pain-free heavy pressing demonstration"],
            "mood": "Sports biomechanics, scientific, clean gym studio lighting",
            "brand_lift": "Builds medical and biomechanical authority in longevity fitness."
        },
        {
            "band": "mid", "rank": 86, "title": "The Nervous System Reset: The 3-Minute Physiological Sigh",
            "premise": "Explain Dr. Andrew Huberman's double-inhalation physiological sigh that instantly lowers cortisol and heart rate during acute stress.",
            "hook_first_line": "This is the fastest biological way to turn off your stress response in under 60 seconds.",
            "visual_hook": "Heart rate monitor graph dropping 15 BPM in real-time as creator performs two sharp nasal inhales and long slow oral exhale.",
            "story_beats": ["The neurobiology of alveolar collapse", "The double nasal inhale mechanism", "Extended exhale vagus nerve stimulation", "Real-time biometric data proof"],
            "mood": "Scientific, calming, clear clinical evidence",
            "brand_lift": "Establishes creator as a credible biohacking and nervous system regulation guide."
        },
        {
            "band": "low", "rank": 78, "title": "The 1-Minute Desk Hip Flexor Decompression Stretch",
            "premise": "A quick couch stretch modification you can do against an office chair to reverse 8 hours of pelvic tilt and lower back tightness.",
            "hook_first_line": "If your lower back aches after sitting all day, do this stretch right now.",
            "visual_hook": "Demonstrating posterior pelvic tilt glute squeeze against an office chair with instant hip opening.",
            "story_beats": ["Why hip flexor shortening pulls on the lumbar spine", "The pelvic tuck execution cue", "Holding for 3 deep breaths per side", "Stand-up relief check"],
            "mood": "Instant physical relief, high utility, accessible",
            "brand_lift": "Provides immediate physical relief that viewers bookmark and repeat daily."
        }
    ]
}

CATEGORIES["commerce_affiliate"] = {
    "name": "Commerce & Affiliate",
    "cards": [
        {
            "band": "high", "rank": 95, "title": "The 30-Day Durability Autopsy: What Sponsored Reviews Never Show",
            "premise": "Expose the truth behind viral TikTok gadgets by showing real wear-and-tear, battery degradation, and seam fraying after 30 days of actual daily use.",
            "hook_first_line": "Every influencer showed you this product when it was brand new in the box. Here is what it looks like after 30 days.",
            "visual_hook": "Side-by-side comparison of polished unboxing footage vs actual scuffed product with honest diagnostic annotations.",
            "story_beats": ["The honeymoon unboxing illusion", "Testing 3 specific failure points (hinges, battery, finish)", "Who this product is actually for vs who should skip it", "The definitive buyer's verdict"],
            "mood": "Brutally honest consumer advocacy, tactile macro, transparent",
            "brand_lift": "Builds unmatched creator credibility and long-term buyer trust."
        },
        {
            "band": "mid", "rank": 86, "title": "Price-to-Utility Ratio: When $20 Beats the $200 Brand Name",
            "premise": "Blind test a $20 unbranded workhorse tool/gadget against a $200 luxury brand counterpart, breaking down the exact 5% difference in actual performance.",
            "hook_first_line": "You are paying $180 extra just for the logo stamped on the aluminum.",
            "visual_hook": "Blind testing both products side-by-side under identical stress tests with blinded labels.",
            "story_beats": ["The blindfold performance test", "Disassembling both units to inspect internal components", "Where the extra money actually goes", "The smart buyer's allocation recommendation"],
            "mood": "Investigative, consumer empowerment, high curiosity",
            "brand_lift": "Positions creator as an objective, unbiased consumer advocate."
        },
        {
            "band": "low", "rank": 78, "title": "3 Red Flags in Product Descriptions That Signal Cheap Dropshipping",
            "premise": "Teach viewers how to spot photoshopped packaging, vague claims like 'Military Grade', and fake timer countdowns before buying online.",
            "hook_first_line": "Before you click buy on that Instagram ad, check for these 3 red flags.",
            "visual_hook": "Screen capture highlighting fake review timestamps and reverse image search results showing identical AliExpress listings.",
            "story_beats": ["Red Flag 1: 'Military Grade' buzzwords without standard specs", "Red Flag 2: Stock image photoshop overlays", "Red Flag 3: Fake urgency countdown timers", "Saveable scam-prevention card"],
            "mood": "Fast, consumer protection, high shareability",
            "brand_lift": "Protects audience wallets and establishes shopping discernment."
        }
    ]
}

CATEGORIES["entertainment_comedy"] = {
    "name": "Entertainment Comedy",
    "cards": [
        {
            "band": "high", "rank": 96, "title": "The Hyper-Dramatic Corporate Email Translator",
            "premise": "Act out what corporate passive-aggressive phrases ('Per my previous email', 'Friendly reminder', 'Let's take this offline') actually mean in an over-the-top Shakespearean monologue.",
            "hook_first_line": "When they write 'Thanks in advance', this is what their soul is actually screaming.",
            "visual_hook": "Dramatic cinematic zoom on creator in full formal office attire delivering a whispered, theatrical monologue under dramatic spotlight.",
            "story_beats": ["Phrase 1: 'Per my previous email' (The Wrath of Recurrence)", "Phrase 2: 'Let's take this offline' (The Public Execution Postponement)", "Phrase 3: 'Kind regards' (The Final Coldness)", "Cut to polite typing smile"],
            "mood": "High satirical comedy, dramatic cinematic contrast, universal relatability",
            "brand_lift": "Drives viral shares across corporate slack channels and comment engagement."
        },
        {
            "band": "mid", "rank": 87, "title": "The Over-Engineered Simple Decision: Choosing a Coffee Order",
            "premise": "Turn a simple morning coffee order into an intense NASA rocket launch control room debrief with checklists and emergency abort protocols.",
            "hook_first_line": "My brain trying to decide between oat milk and almond milk at 8 AM.",
            "visual_hook": "Fast cut montage with headsets, frantic clipboard checks, and countdown sirens over a coffee shop menu board.",
            "story_beats": ["The approach to the register", "The lactose risk calculation", "The oat milk calorie panic", "The barista staring blankly payoff"],
            "mood": "Fast-paced, hyper-relatable everyday anxiety satire",
            "brand_lift": "Generates high comment volume and tagging friends."
        },
        {
            "band": "low", "rank": 78, "title": "The Internal Monologue When the Waiter Asks 'How Is Everything?'",
            "premise": "The universal awkward panic moment when a server asks how your food is the exact millisecond you take a gigantic bite.",
            "hook_first_line": "Why does this happen on the exact third bite every single time?",
            "visual_hook": "Slow-motion panic eye contact with mouth completely stuffed with pasta, executing an awkward thumbs-up.",
            "story_beats": ["The bite intake", "The server approach timing", "The inability to vocalize words", "The frantic nod and muffled 'Mmm-hmm'"],
            "mood": "Short, punchy, universally relatable micro-comedy",
            "brand_lift": "Fast viral loop with high rewatch rates."
        }
    ]
}

CATEGORIES["parenting_family"] = {
    "name": "Parenting & Family",
    "cards": [
        {
            "band": "high", "rank": 95, "title": "De-escalating Toddler Meltdowns: The Connection Before Correction Script",
            "premise": "Demonstrate the exact physiological down-regulation technique: dropping to eye level, acknowledging the raw emotion without invalidating, and waiting for breathing to regulate before teaching.",
            "hook_first_line": "When your child is screaming on the floor, logic doesn't work because their prefrontal cortex is completely offline.",
            "visual_hook": "Parent quietly kneeling down to child's eye level, opening palms, and speaking in a calm, grounded, slow vocal tone.",
            "story_beats": ["Why yelling back escalates the nervous system", "Step 1: Physical grounding to eye level", "Step 2: Naming the emotion ('You are really frustrated that we had to leave')", "Step 3: The calming breath together", "The connection payoff"],
            "mood": "Empathetic, grounded, authoritative child psychology, warm natural home light",
            "brand_lift": "Positions creator as a trusted, gentle, yet firm parenting authority."
        },
        {
            "band": "mid", "rank": 86, "title": "Independent Play Setup: The 3-Toy Rotation Geometry",
            "premise": "Expose why toy bins overflowing with 50 toys cause overstimulation and short attention spans, and how displaying 3 open-ended toys on low shelves creates 45 minutes of focused play.",
            "hook_first_line": "If your child complains they are bored in a room full of 100 toys, the toys are the problem.",
            "visual_hook": "Replacing a messy chaotic plastic toy bin with a clean wooden shelf holding 3 focused open-ended toys.",
            "story_beats": ["The visual overstimulation trap", "The 3 open-ended toy selection (building, roleplay, sensory)", "The low-shelf Montessori layout", "Child engaging in deep independent focus"],
            "mood": "Calm, organized, developmental psychology, intentional home",
            "brand_lift": "Provides immediate peaceful home transformation for exhausted parents."
        },
        {
            "band": "low", "rank": 78, "title": "The 2-Choice Phrasing Hack That Stops Morning Getting-Dressed Battles",
            "premise": "Replace open-ended demands ('Put your shoes on!') with closed dual-choice autonomy ('Do you want to wear the blue shoes or the red boots today?').",
            "hook_first_line": "Stop asking your child 'Are you ready to get dressed?' Ask this instead.",
            "visual_hook": "Holding up two shirt options at child's level letting them point and smile.",
            "story_beats": ["The resistance trigger of direct orders", "The psychology of toddler autonomy", "The 2-choice script formula", "Smooth morning exit payoff"],
            "mood": "Instant parenting utility, high relief, actionable",
            "brand_lift": "Saves parents daily morning stress and drives immediate bookmarking."
        }
    ]
}

print(f"Total structured categories: {len(CATEGORIES)}")
