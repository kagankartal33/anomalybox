"""
Page justification / distinct-value gate (Sections 4, 9).
Operates on the existing seo-package registry + markdown corpus.
"""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field
from pathlib import Path

import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "tools") not in sys.path:
    sys.path.insert(0, str(ROOT / "tools"))

from originality_gate import get_shingles, jaccard_similarity  # noqa: E402

REGISTRY = ROOT / "lib" / "seo-package-registry.json"
CONTENT = ROOT / "content" / "seo-package"


@dataclass
class JustificationResult:
    slug: str
    path: str
    approved: bool
    reasons: list[str] = field(default_factory=list)
    max_jaccard: float = 0.0
    nearest_slug: str | None = None
    word_count: int = 0
    has_intent: bool = False
    has_audience: bool = False
    distinct_value_score: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


def _load_pages() -> list[dict]:
    if not REGISTRY.exists():
        return []
    return json.loads(REGISTRY.read_text(encoding="utf-8")).get("pages", [])


def _read_body(slug: str) -> str:
    path = CONTENT / f"{slug}.md"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def justify_page(
    page: dict,
    corpus_bodies: dict[str, str],
    *,
    jaccard_reject: float = 0.80,
    jaccard_warn: float = 0.70,
    min_words: int = 400,
) -> JustificationResult:
    slug = page["slug"]
    body = corpus_bodies.get(slug, "")
    words = re.findall(r"\b[\w'-]+\b", body)
    reasons: list[str] = []
    approved = True

    has_intent = bool(page.get("searchIntent") or page.get("keyword"))
    has_audience = bool(page.get("audience"))
    if not has_intent:
        approved = False
        reasons.append("missing_user_intent")
    if not has_audience:
        approved = False
        reasons.append("missing_audience")
    if len(words) < min_words:
        approved = False
        reasons.append(f"below_min_words:{len(words)}")

    # required structure signals
    if not re.search(r"^## ", body, re.M):
        approved = False
        reasons.append("missing_section_structure")

    max_j = 0.0
    nearest = None
    shingles = get_shingles(body)
    for other_slug, other_body in corpus_bodies.items():
        if other_slug == slug:
            continue
        j = jaccard_similarity(shingles, get_shingles(other_body))
        if j > max_j:
            max_j = j
            nearest = other_slug
    if max_j >= jaccard_reject:
        approved = False
        reasons.append(f"near_duplicate:{nearest}:{max_j:.3f}")
    elif max_j >= jaccard_warn:
        reasons.append(f"near_duplicate_warn:{nearest}:{max_j:.3f}")

    # distinct value: inverse of max similarity + structure bonuses
    structure_bonus = 0.0
    if re.search(r"Quick answer", body, re.I):
        structure_bonus += 0.05
    if re.search(r"Frequently asked", body, re.I):
        structure_bonus += 0.05
    if re.search(r"Next step", body, re.I):
        structure_bonus += 0.05
    distinct = max(0.0, min(1.0, (1.0 - max_j) * 0.85 + structure_bonus))
    if distinct < 0.18:
        approved = False
        reasons.append(f"low_distinct_value:{distinct:.3f}")
    elif distinct < 0.30:
        reasons.append(f"low_distinct_value_warn:{distinct:.3f}")

    if approved:
        reasons.append("justified")

    return JustificationResult(
        slug=slug,
        path=page.get("path", f"/{page.get('section')}/{slug}"),
        approved=approved,
        reasons=reasons,
        max_jaccard=round(max_j, 4),
        nearest_slug=nearest,
        word_count=len(words),
        has_intent=has_intent,
        has_audience=has_audience,
        distinct_value_score=round(distinct, 4),
    )


def justify_corpus(limit: int | None = None) -> list[JustificationResult]:
    pages = _load_pages()
    if limit:
        pages = pages[:limit]
    bodies = {p["slug"]: _read_body(p["slug"]) for p in pages}
    return [justify_page(p, bodies) for p in pages]
