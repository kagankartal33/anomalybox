#!/usr/bin/env python3
"""Build derived ViralBox design intelligence documents from approved references."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVED = ROOT / "manifests" / "approved_manifest.jsonl"
DERIVED = ROOT / "derived"


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def write(path: Path, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body.strip() + "\n", encoding="utf-8")


def main() -> int:
    records = load_jsonl(APPROVED)
    archetypes = Counter(record.get("page_archetype", "other") for record in records)
    styles = Counter(style for record in records for style in record.get("visual_style", []))

    write(
        DERIVED / "PREMIUM_WEB_DESIGN_PLAYBOOK.md",
        f"""
# Premium Web Design Playbook

Generated from a compact reference workflow. Approved references: {len(records)}.

Dominant archetypes: {dict(archetypes)}

Dominant styles: {dict(styles)}

## ViralBox Direction

ViralBox should feel like a private creative commerce product for serious influencers: calm, premium, selective, and operational. Avoid noisy AI-dashboard visuals. The product is a paid idea vault, not a generic generator.

## Visual Hierarchy

- Each viewport gets one unmistakable primary message.
- Primary actions should be visually dominant; secondary actions should be quieter.
- Use fewer sections with stronger purpose: hero, proof, how it works, product/store, creator vault, contact.
- For authenticated areas, prioritize scan speed over decorative marketing.

## Typography

- Use no more than two font families.
- Keep display type reserved for true hero or page-level headings.
- Body text must remain readable and high contrast.
- Avoid negative letter spacing and ultra-light copy.

## Layout And Whitespace

- Use a consistent spacing scale and a single max-width container system.
- Prefer full-width bands or unframed layouts; use cards only for repeated items, modals, and framed tools.
- Reserve stable dimensions for boxes, cards, media, buttons, and dashboard tiles.
- Never stack cards inside cards.

## Marketing

- The public site must answer: what ViralBox is, who it is for, why it is valuable, and how to act.
- Explain the box outcome as private premium idea cards and execution guidance.
- Use truth-based proof: methodology, review workflow, category/persona fit, production clarity.
- Do not mention internal score bands, inventory mechanics, or training sources to creators.

## Motion

- Motion should explain state: sealed box hover, reveal confirmation, opened card state.
- Respect reduced motion.
- Avoid decorative motion that slows reading.

## Accessibility

- Use semantic landmarks, native buttons, visible focus, descriptive links, and logical heading order.
- Modals need clear action labels and keyboard-safe controls.
- Do not put click handlers on non-interactive containers when a button or link fits.

## Originality Guardrail

Use references to combine principles only. Never copy a brand, logo, exact wording, exact layout sequence, source image, or code.
""",
    )

    write(
        DERIVED / "premium-pattern-library.md",
        """
# Premium Pattern Library

## Hero

Pattern: Private creator vault hero
Use when: ViralBox needs to feel selective and premium.
Principle: State the outcome in one sentence, show one premium product signal, and use one primary CTA.

## Navigation

Pattern: Short authenticated nav
Use when: Creator is logged in.
Principle: Store, Creator Vault, Profile, Notifications, Admin. Do not overload top navigation.

## Store

Pattern: Decision-first product cards
Use when: Selling $500 and $1000 boxes.
Principle: Show package outcome, category/persona fit, availability, and one checkout action.

## Creator Vault

Pattern: Sealed-to-opened box shelf
Use when: Purchased boxes wait before reveal.
Principle: Closed boxes show only a premium object; opened boxes reveal saved creator cards.

## Card Detail

Pattern: Accordion execution manual
Use when: Creator reads a delivered idea.
Principle: Split complex execution into scene flow, pose, b-roll, edit, caption, brand lift, and safety.

## Review Dashboard

Pattern: Human compliance workspace
Use when: Admin reviews creator video.
Principle: Put video, original card guidance, checklist, and feedback in one scannable working surface.

## Contact

Pattern: Concierge custom design CTA
Use when: High-status creator wants personalized service.
Principle: Offer private creator strategy without promising guaranteed virality.
""",
    )

    write(
        DERIVED / "anti-pattern-library.md",
        """
# Anti-Pattern Library

- Generic AI SaaS gradient hero with vague claims.
- Dense card grids that make every feature look equally important.
- Fake urgency, fake metrics, fake reviews, or unverifiable viral guarantees.
- Internal inventory, score, band, or training language shown to creators.
- Low-contrast beige/gray copy used for body text.
- Decorative blobs, excessive glassmorphism, or motion that distracts from buying.
- Checkout flows that allow purchase when stock is unavailable.
- Box pages that reveal cards before creator confirmation.
- Admin dashboards that hide the original card guidance from reviewers.
- Mobile layouts that merely shrink desktop instead of recomposing.
""",
    )

    write(
        DERIVED / "seo-marketing-implementation-rules.md",
        """
# SEO And Marketing Implementation Rules

Source standards:

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google structured data intro: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google structured data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google Product structured data: https://developers.google.com/search/docs/appearance/structured-data/product
- Core Web Vitals: https://web.dev/articles/vitals

## Page Rules

- Every production page has one visible H1 and a logical heading order.
- Metadata must match the actual page purpose.
- Use descriptive internal links: "Open Creator Vault", "View ViralBox Store", "Request custom creator strategy".
- Do not use structured data for hidden content, fake reviews, or irrelevant FAQs.
- Public marketing copy should emphasize premium private idea boxes, creator fit, execution guidance, and human review.
- Authenticated creator pages should not expose internal scores, stock bands, training sources, or admin-only logic.

## Performance

- Target LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.
- Reserve dimensions for box visuals, card tiles, video players, and hero media.
- Keep third-party scripts minimal.
- Prefer server-rendered content for indexable marketing pages.

## ViralBox Messaging

Say:

- Premium ViralBox for Instagram creators.
- Private creator cards built for category, persona, and production style.
- Execution-ready scripts, shots, captions, and review feedback.
- Concierge custom strategy for creators who need a bespoke lane.

Avoid:

- Guaranteed viral claims.
- Internal scoring language.
- "AI trained on celebrity names" language.
- "Dataset" or "training" language in creator-facing sales copy.
""",
    )

    write(
        DERIVED / "responsive-layout-rules.md",
        """
# Responsive Layout Rules

- Recompose sections on mobile; do not simply shrink desktop.
- Keep primary CTA visible and easy to tap.
- Use stable sizes for box visuals so hover/reveal states do not shift layout.
- Turn wide dashboard grids into single-column task stacks on mobile.
- Keep admin review pages practical: video first, checklist next, feedback last.
- Test Profile, Store, Creator Vault, Card Detail, Review Upload, and Admin Review separately.
""",
    )

    write(
        DERIVED / "screenshot-to-code-instruction-patterns.md",
        """
# Screenshot-To-Code Instruction Patterns

Use screenshot references only to describe original implementation goals:

- Identify hierarchy, spacing, CTA structure, responsive behavior, and accessibility constraints.
- Do not ask for copied code, copied exact geometry, brand assets, or source text.
- Convert visual observations into implementation constraints such as container width, heading scale, rhythm, and state behavior.
""",
    )

    print(f"Built derived design playbook files from {len(records)} approved references.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())