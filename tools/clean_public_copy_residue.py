"""Remove editorial-production language from public SEO-package articles."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "seo-package"

DECISION_SYSTEM = re.compile(
    r"Treat \*\*(.+?)\*\* as a production decision system: name the audience tension, "
    r"the visible proof, the first frame, and the constraint you will not violate\. "
    r"Then film the smallest version that still answers the reader[’']s job\."
)


def decision_replacement(topic: str, slug: str) -> str:
    variants = [
        f"Make **{topic}** filmable by deciding the audience tension, first frame, visible proof, and practical limit before recording. Then produce the smallest complete version that keeps the promise.",
        f"Before filming **{topic}**, settle four things: who it helps, what opens the piece, what the viewer can verify, and what the production can realistically support.",
        f"The practical version of **{topic}** starts with a specific audience need, an opening image, credible evidence, and a production boundary. Resolve those choices before adding scenes.",
        f"For **{topic}**, connect the audience question to one opening frame and one visible form of proof. Keep the scene count within the time, access, and equipment available.",
    ]
    index = int(hashlib.sha256(slug.encode("utf-8")).hexdigest()[:2], 16) % len(variants)
    return variants[index]


def clean_text(text: str, slug: str) -> str:
    text = DECISION_SYSTEM.sub(lambda match: decision_replacement(match.group(1), slug), text)
    text = re.sub(
        r"The final commercial scope, turnaround and pricing must be confirmed on the live store or service page\. "
        r"Do not invent fulfilment guarantees inside this article\.",
        "Confirm current scope, turnaround, and pricing on the live store or service page before purchase.",
        text,
    )
    text = re.sub(
        r"People actively working on \*\*(.+?)\*\* who need a practical system, not generic motivation\.",
        r"Creators using **\1** who want clearer decisions before filming, review, or approval.",
        text,
    )
    replacements = {
        "Empty-product field note": "Finished-product review",
        "A useful field note, demonstration, answer or update": "A useful demonstration, answer, review, or update",
        "Finished-product field notes": "Finished-product reviews",
        "Launch field notes": "Launch decision log",
        "Voiceover field notes": "Voiceover-led explanations",
        "Sensory Field Notes": "Sensory Location Notes",
        "Sensory field notes": "Sensory location notes",
        "field note or mini audit": "practical update or mini audit",
        "Field notebook method": "Observation notebook method",
        "search intent, proof and conversion paths": "audience questions, proof and conversion paths",
        "honest proof standards": "evidence the audience can verify",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def main() -> int:
    changed = 0
    for path in sorted(CONTENT.glob("*.md")):
        original = path.read_text(encoding="utf-8")
        updated = clean_text(original, path.stem)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"public copy files cleaned: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())