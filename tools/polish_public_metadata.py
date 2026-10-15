"""Build useful, page-specific descriptions for the curated public library.

This module only reads SEO-package headings and metadata. It never imports
viral-card prompts, datasets, inventory, or training output.
"""
from __future__ import annotations

import hashlib
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


def topic_phrase(value: str) -> str:
    value = sentence_case(value)
    replacements = [
        (r"^a useful content idea has five connected parts$", "a five-part idea check"),
        (r"^\d+ shoot-ready directions to adapt$", "adaptable content directions"),
        (r"^shoot-ready directions to adapt$", "adaptable content directions"),
        (r"^turn one direction into a repeatable series$", "repeatable series planning"),
        (r"^use the five-beat Reel test$", "a five-beat Reel check"),
        (r"^six Reel directions to film$", "filmable Reel directions"),
        (r"^write the hook with the first frame$", "hook and first-frame alignment"),
        (r"^working process$", "the service workflow"),
        (r"^template$", "a ready-to-use template"),
        (r"^shot tracker$", "a shot tracker"),
        (r"^use instructions$", "clear use instructions"),
        (r"^scoring table$", "a scoring table"),
        (r"^worksheet$", "a practical worksheet"),
        (r"^use the ", "the "),
        (r"^how to ", ""),
        (r"^write the ", "the "),
        (r"^build the ", "the "),
        (r"^define ", "defining "),
        (r"^choose ", "choosing "),
        (r"^separate ", "separating "),
        (r"^review ", "reviewing "),
        (r"^turn ", "turning "),
        (r"^adapt ", "adapting "),
        (r"^keep ", "keeping "),
        (r"^make ", "making "),
        (r"^set ", "setting "),
        (r"^create ", "creating "),
        (r"^plan ", "planning "),
        (r"^compare ", "comparing "),
        (r"^map ", "mapping "),
        (r"^lock ", "locking "),
    ]
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value, flags=re.I)
    return value


def article_topics(markdown: str) -> list[str]:
    headings = []
    for match in re.finditer(r"^##\s+(.+?)\s*$", markdown, re.M):
        heading = topic_phrase(match.group(1).replace("**", ""))
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
    variant = int(hashlib.sha256(str(page.get("slug") or title).encode("utf-8")).hexdigest()[:2], 16) % 4

    def compose(selected: list[str], compact: bool = False) -> str:
        details = natural_list(selected)
        if "commercial" in page_type:
            options = [
                f"Learn what to expect from {keyword}, including {details}, scope, and the decisions to confirm before choosing support.",
                f"Compare the scope, process, and key decisions behind {keyword}, with practical detail on {details} before you choose support.",
                f"See where {keyword} fits your workflow by reviewing {details}, service boundaries, and the choices to confirm before purchase.",
                f"Understand how {keyword} approaches {details}, including what is covered and what to confirm before starting the service.",
            ]
            return options[variant]
        if "template" in page_type or "linkable" in page_type:
            suffix = "before approval or production" if compact else "so the result is clearer before approval or production"
            options = [
                f"Use {title} to work through {details} {suffix}.",
                f"{title} helps you review {details} {suffix}.",
                f"Prepare {details} with {title} {suffix}.",
                f"Work through {details} in {title} {suffix}.",
            ]
            return options[variant]
        if "ideas" in page_type or "execution" in page_type:
            suffix = "with a practical route from idea to finished content" if not compact else "before the next shoot"
            options = [
                f"Plan {keyword} with {details} {suffix}.",
                f"Turn {keyword} into filmable concepts through {details} {suffix}.",
                f"Develop {keyword} by deciding {details} {suffix}.",
                f"Use {details} to shape {keyword} {suffix}.",
            ]
            return options[variant]
        if "lane" in page_type or "persona" in page_type:
            suffix = "while balancing audience fit, proof, and production capacity"
            options = [
                f"{title} covers {details} for creators {suffix}.",
                f"Build a workable approach to {keyword} through {details} while balancing audience fit, proof, and production capacity.",
                f"Use {details} to adapt {keyword} to real audience needs, available proof, privacy, and production capacity.",
                f"Plan {keyword} around {details}, with room for audience fit, credible evidence, and the creator's actual capacity.",
            ]
            return options[variant]
        suffix = "with decisions you can apply before filming or publishing" if not compact else "for clearer production decisions"
        options = [
            f"A practical guide to {keyword}, covering {details} {suffix}.",
            f"{title} explains {details} {suffix}.",
            f"Work through {details} to make {keyword} more specific and usable before filming or publishing.",
            f"Use this guide to connect {details} when planning {keyword}, with clear choices for the next production pass.",
        ]
        return options[variant]

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
            description = f"{description.rstrip('.')}.{addition}"
    if len(description) > 158:
        shortened = description[:158]
        boundary = shortened.rfind(" ")
        description = f"{shortened[:boundary].rstrip(' ,;:')} .".replace(" .", ".")
    return description


def full_title(markdown: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", markdown, re.M)
    return re.sub(r"[*_`]+", "", match.group(1)).strip() if match else fallback


def seo_title(title: str) -> str:
    if len(title) <= 60:
        return title
    for separator in (": ", " — ", " – ", " | "):
        first = title.split(separator, 1)[0].strip()
        if 28 <= len(first) <= 60:
            return first
    shortened = title[:61]
    boundary = shortened.rfind(" ")
    return shortened[:boundary].rstrip(" ,;:—–-")


def main() -> int:
    payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
    pages = payload.get("pages", [])
    errors: list[str] = []
    descriptions: set[str] = set()
    for page in pages:
        markdown_path = PACKAGE_CONTENT / f"{page['slug']}.md"
        markdown = markdown_path.read_text(encoding="utf-8")
        page["title"] = full_title(markdown, str(page.get("title") or page["slug"]))
        page["seoTitle"] = seo_title(page["title"])
        page["status"] = "published"
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
    REGISTRY.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"polished metadata descriptions: {len(pages)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
