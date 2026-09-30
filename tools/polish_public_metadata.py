"""Build useful, page-specific descriptions for the curated public library.

This module only reads SEO-package headings and metadata. It never imports
viral-card prompts, datasets, inventory, or training output.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "lib" / "seo-package-registry.json"
PACKAGE_CONTENT = ROOT / "content" / "seo-package"

EXCLUDED_HEADINGS = re.compile(
    r"^(quick answer|frequently asked questions|next step|related guides|editorial use note)$",
    re.I,
)
FORBIDDEN_COPY = re.compile(
    r"publish-ready|field notes?|proof standards|clear steps, examples|"
    r"2026 aeo|maximum ai extraction|not generic motivation|seo package",
    re.I,
)


def sentence_case(value: str) -> str:
    value = re.sub(r"^\d+\s+", "", value.strip())
    value = re.sub(r"\s+", " ", value)
    if value:
        value = value[0].lower() + value[1:]
    replacements = {
        "ugc": "UGC",
        "seo": "SEO",
        "aeo": "AEO",
        "dm": "DM",
        "b-roll": "B-roll",
        "reels": "Reels",
        "instagram": "Instagram",
    }
    for source, target in replacements.items():
        value = re.sub(rf"\b{re.escape(source)}\b", target, value, flags=re.I)
    return value.rstrip(" .:;—–-")


def article_topics(markdown: str) -> list[str]:
    headings = []
    for match in re.finditer(r"^##\s+(.+?)\s*$", markdown, re.M):
        heading = sentence_case(match.group(1).replace("**", ""))
        if not heading or EXCLUDED_HEADINGS.match(heading):
            continue
        if re.search(r"operator|search intent|keyword|article|quality and originality standard", heading, re.I):
            continue
        if heading.lower() not in {item.lower() for item in headings}:
            headings.append(heading)
    return headings[:5]


def natural_list(items: list[str]) -> str:
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def build_description(page: dict, markdown: str) -> str:
    title = re.sub(r"\s+", " ", str(page.get("title") or "Creator guide")).strip()
    keyword = sentence_case(str(page.get("keyword") or title))
    page_type = str(page.get("pageType") or "guide").lower()
    topics = article_topics(markdown) or ["audience fit", "visible proof", "production planning"]

    def compose(selected: list[str], compact: bool = False) -> str:
        details = natural_list(selected)
        if "commercial" in page_type:
            suffix = "with the scope and decisions to confirm before choosing support"
            return f"See how {title} handles {details}, {suffix}."
        if "template" in page_type or "linkable" in page_type:
            suffix = "before approval or production" if compact else "so the result is clearer before approval or production"
            return f"Use {title} to work through {details} {suffix}."
        if "ideas" in page_type or "execution" in page_type:
            suffix = "with a practical route from idea to finished content" if not compact else "before the next shoot"
            return f"Plan {keyword} around {details}, {suffix}."
        if "lane" in page_type or "persona" in page_type:
            suffix = "while balancing audience fit, proof, and production capacity"
            return f"{title} covers {details} for creators {suffix}."
        suffix = "with decisions you can apply before filming or publishing" if not compact else "for clearer production decisions"
        return f"A practical guide to {keyword}, covering {details} {suffix}."

    candidates: list[str] = []
    for count in range(min(3, len(topics)), 0, -1):
        candidates.append(compose(topics[:count]))
        candidates.append(compose(topics[:count], compact=True))
    description = next((item for item in candidates if 110 <= len(item) <= 158), "")
    if not description:
        description = next((item for item in candidates if len(item) <= 158), candidates[-1])
    if len(description) < 110:
        addition = " Includes practical checks for planning, filming, and review."
        if len(description) + len(addition) <= 158:
            description = f"{description.rstrip('.')}.\u200b{addition}".replace(".\u200b ", ". ")
    if len(description) > 158:
        shortened = description[:158]
        boundary = shortened.rfind(" ")
        description = f"{shortened[:boundary].rstrip(' ,;:')} .".replace(" .", ".")
    return description


def main() -> int:
    payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
    pages = payload.get("pages", [])
    errors: list[str] = []
    descriptions: set[str] = set()
    for page in pages:
        markdown_path = PACKAGE_CONTENT / f"{page['slug']}.md"
        markdown = markdown_path.read_text(encoding="utf-8")
        description = build_description(page, markdown)
        page["description"] = description
        if not 110 <= len(description) <= 158:
            errors.append(f"description length {len(description)}: {page['slug']}")
        if FORBIDDEN_COPY.search(description):
            errors.append(f"forbidden copy: {page['slug']}")
        normalized = description.casefold()
        if normalized in descriptions:
            errors.append(f"duplicate description: {page['slug']}")
        descriptions.add(normalized)

    if errors:
        for error in errors:
            print(error)
        return 1
    REGISTRY.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\
    print(f"polished metadata descriptions: {len(pages)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())