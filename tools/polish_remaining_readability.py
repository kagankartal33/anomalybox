import re
from pathlib import Path
from audit_content_readability import flesch

root = Path(__file__).resolve().parent.parent

# 1. ai-slop-vs-human-authenticity-for-creators.md
p_ai = root / "content" / "resources" / "ai-slop-vs-human-authenticity-for-creators.md"
if p_ai.exists():
    text = p_ai.read_text(encoding="utf-8")
    text = text.replace("against synthetic. Generic, and mass-produced content", "against synthetic, generic, and mass-produced content")
    text = text.replace("Audiences on Instagram. YouTube, and TikTok", "Audiences on Instagram, YouTube, and TikTok")
    text = text.replace('(*"In today\'s fast-paced digital world"*). hollow listicles with no lived feel. And synthetic video avatars that lack human soul and nuance.', 'corporate jargon, hollow listicles with no lived feel, and synthetic avatars that lack human soul.')
    text = text.replace("According to research across creator communities. Over 89% of working creators use AI assistance. Yet 0% of successful professional creators publish raw. Unedited AI output.", "Across creator groups, over 89% of creators use AI help. Yet top creators never publish raw, unedited AI output.")
    text = text.replace("The market edge is no longer who can generate the most content with AI. It is who can maintain an unmistakably human. Voice-preserved, and verifiable creative identity while using AI strictly for structural support.", "The real edge is not making the most content with AI. It is keeping an honest, distinct human voice while using AI only for structure.")
    text = text.replace("This guide outlines the exact anti-voice boundaries. And truth frameworks required to protect your creative name in the AI era.", "This guide gives you the exact rules and frameworks to protect your creative voice in the AI era.")
    text = text.replace("Starting an article or video.With Broad philosophical generalizations", "Starting a video with broad philosophical ideas")
    text = text.replace("Over-using balanced. Formulaic bullet points", "Over-using balanced, formulaic bullet points")
    text = text.replace("admit limitations. Edge cases, or who the advice is *not* for.", "admit limitations, edge cases, or who the advice is not for.")
    text = text.replace("provocative. Specific debate question.", "provocative, specific debate question.")
    text = text.replace("colloquial rhythm. Regional idioms, or self-deprecating admissions.", "colloquial rhythm, regional idioms, or honest admissions.")
    p_ai.write_text(text, encoding="utf-8")
    print("ai-slop score:", flesch(text))

# 2. social-media-burnout-creator.md
p_burn = root / "content" / "seo-package" / "social-media-burnout-creator.md"
if p_burn.exists():
    t = p_burn.read_text(encoding="utf-8")
    t = t.replace("Publishing can combine creative labour, public evaluation, administration, client revisions and constant platform change. A workflow may reduce avoidable pressure, but persistent exhaustion or mental-health concerns require qualified support rather than an SEO article.",
                  "Publishing combines creative work, audience feedback, client revisions, and constant platform change. A solid workflow reduces pressure. But severe exhaustion requires qualified support rather than an online article.")
    t = t.replace("stop treating daily reach as the test of whether recovery is allowed. Record workload instead: hours, context switching, revision rounds, late-night work, messages and the amount of recovery needed after a post.",
                  "Stop treating daily reach as a test of whether rest is allowed. Record workload instead: hours, task switches, revision rounds, late work, and recovery time needed after a post.")
    p_burn.write_text(t, encoding="utf-8")
    print("social-media-burnout score:", flesch(t))

# 3. creator-fatigue.md
p_cf = root / "content" / "seo-package" / "creator-fatigue.md"
if p_cf.exists():
    t = p_cf.read_text(encoding="utf-8")
    t = t.replace("publishing fatigue is often structural. When production requires daily decision-making across scripting, shooting, editing, and distribution, the operational load drains creative output.",
                  "Publishing fatigue is structural. Daily decisions across scripting, shooting, and editing create heavy operational strain.")
    p_cf.write_text(t, encoding="utf-8")
    print("creator-fatigue score:", flesch(t))

# 4. creator-decision-fatigue-report.md
p_cdfr = root / "content" / "seo-package" / "creator-decision-fatigue-report.md"
if p_cdfr.exists():
    t = p_cdfr.read_text(encoding="utf-8")
    t = t.replace("creative paralysis stems from unbounded variables: choosing topics, camera angles, color grades, and audio tracks simultaneously without locked boundaries.",
                  "Creative paralysis comes from too many open variables: picking topics, angles, colors, and audio tracks all at once without fixed rules.")
    p_cdfr.write_text(t, encoding="utf-8")
    print("creator-decision-fatigue-report score:", flesch(t))

# 5. instagram-burnout.md
p_ib = root / "content" / "seo-package" / "instagram-burnout.md"
if p_ib.exists():
    t = p_ib.read_text(encoding="utf-8")
    t = t.replace("the pressure of algorithmic volatility and daily story expectations leads directly to creator exhaustion.",
                  "Algorithmic changes and daily story demands lead straight to creator exhaustion.")
    p_ib.write_text(t, encoding="utf-8")
    print("instagram-burnout score:", flesch(t))

# 6. sustainable-content-strategy.md
p_scs = root / "content" / "seo-package" / "sustainable-content-strategy.md"
if p_scs.exists():
    t = p_scs.read_text(encoding="utf-8")
    t = t.replace("a sustainable content system prioritizes operational endurance over short-term publishing frequency spikes.",
                  "A good content system values long-term endurance over short-term posting spikes.")
    p_scs.write_text(t, encoding="utf-8")
    print("sustainable-content-strategy score:", flesch(t))
