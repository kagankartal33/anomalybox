"""
training_knowledge.py
=====================
SEO CONTENT PIPELINE ONLY.

Offline training-profile loader for public resource SEO articles
(`content/resources/*.md`).

Sources (pattern_only — never surface-copy book text):
  1. supabase/seeds/seo_content_rules.sql  → SCR curated rules
  2. ViralBox-training-archive/dataset/seo_content/prepared/2026_seo_observations.jsonl
  3. ViralBox-training-archive/dataset/seo_content/prepared/seo_observations.jsonl (concepts only)

NOT used here (viral idea-card pipeline owns these):
  - viral_training_* tables / VTP taxonomy
  - book_train high-value cinema/story craft
  - comedy master systems / influencer persona dumps
  - generate-ideas-system / idea_card schema

See: docs/architecture/content-pipelines-separation.md
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
SEO_RULES_SQL = ROOT / "supabase" / "seeds" / "seo_content_rules.sql"
SEO_PREPARED = ARCHIVE / "dataset" / "seo_content" / "prepared"

# Modern search-quality rules are intentionally shared across SEO lanes. They
# describe information gain, source grounding, entity context, authorship,
# freshness, multimodal context, and Core Web Vitals. They never import viral
# card craft or training data.
SEO_2026_RULE_IDS = [f"SCR-{number:03d}" for number in range(53, 86)]
SEO_QUALITY_REQUIREMENTS = [
    "direct_answer_in_first_100_words",
    "source_and_claim_ledger",
    "originality_and_information_gain",
    "visible_faq_or_question_context",
    "verified_author_and_dates",
    "descriptive_alt_text_and_image_context",
    "explicit_image_dimensions_for_lcp_cls",
    "decision_matrix_tradeoffs",
    "fillable_script_brief_skeleton",
    "zero_click_aeo_capsule",
    "anti_ai_cliche_guardrail",
]

# Lane → SEO layers only (no cinema/viral craft layers)
LANE_PROFILE = {
    "ugc": {
        "seo_layers": ["content_writing", "content_strategy", "on_page_seo"],
        "priority_rules": ["SCR-016", "SCR-022", "SCR-026", "SCR-028", "SCR-051", "SCR-052", "SCR-076", "SCR-082"],
    },
    "beauty": {
        "seo_layers": ["content_writing", "answer_engine_optimization", "on_page_seo"],
        "priority_rules": ["SCR-051", "SCR-052", "SCR-013", "SCR-045", "SCR-046", "SCR-007", "SCR-074", "SCR-078"],
    },
    "fashion": {
        "seo_layers": ["content_writing", "content_strategy"],
        "priority_rules": ["SCR-013", "SCR-016", "SCR-051", "SCR-052", "SCR-028", "SCR-073", "SCR-074"],
    },
    "fitness": {
        "seo_layers": ["content_writing", "content_strategy", "answer_engine_optimization"],
        "priority_rules": ["SCR-007", "SCR-045", "SCR-046", "SCR-052", "SCR-014", "SCR-073", "SCR-075"],
    },
    "food": {
        "seo_layers": ["content_writing", "on_page_seo"],
        "priority_rules": ["SCR-013", "SCR-051", "SCR-052", "SCR-045", "SCR-074", "SCR-079"],
    },
    "travel": {
        "seo_layers": ["content_writing", "content_strategy", "answer_engine_optimization"],
        "priority_rules": ["SCR-051", "SCR-016", "SCR-052", "SCR-046", "SCR-007", "SCR-073", "SCR-077"],
    },
    "faceless": {
        "seo_layers": ["content_writing", "answer_engine_optimization"],
        "priority_rules": ["SCR-051", "SCR-013", "SCR-045", "SCR-052", "SCR-074", "SCR-079"],
    },
    "b2b": {
        "seo_layers": ["content_strategy", "content_writing", "answer_engine_optimization"],
        "priority_rules": ["SCR-016", "SCR-022", "SCR-024", "SCR-026", "SCR-028", "SCR-051", "SCR-052", "SCR-073", "SCR-075"],
    },
    "lighting": {
        "seo_layers": ["content_writing", "on_page_seo"],
        "priority_rules": ["SCR-007", "SCR-013", "SCR-045", "SCR-051", "SCR-052", "SCR-074", "SCR-078"],
    },
    "aeo": {
        "seo_layers": ["answer_engine_optimization", "content_strategy", "on_page_seo", "keyword_research"],
        "priority_rules": ["SCR-051", "SCR-045", "SCR-046", "SCR-047", "SCR-048", "SCR-007", "SCR-052", "SCR-001", "SCR-071", "SCR-072", "SCR-075", "SCR-083"],
    },
    "product": {
        "seo_layers": ["content_strategy", "content_writing", "answer_engine_optimization"],
        "priority_rules": ["SCR-028", "SCR-016", "SCR-026", "SCR-051", "SCR-017", "SCR-073", "SCR-077"],
    },
    "visual": {
        "seo_layers": ["content_writing", "content_strategy"],
        "priority_rules": ["SCR-013", "SCR-051", "SCR-052", "SCR-045", "SCR-074", "SCR-078"],
    },
    "burnout": {
        "seo_layers": ["content_strategy", "content_writing"],
        "priority_rules": ["SCR-016", "SCR-027", "SCR-013", "SCR-051", "SCR-052", "SCR-077", "SCR-081"],
    },
    "strategy": {
        "seo_layers": ["content_strategy", "content_writing", "answer_engine_optimization", "on_page_seo"],
        "priority_rules": ["SCR-021", "SCR-022", "SCR-016", "SCR-051", "SCR-052", "SCR-007", "SCR-028", "SCR-073", "SCR-075", "SCR-080"],
    },
}

FORBIDDEN_CLICHES = [
    "in today's digital world",
    "in today's digital landscape",
    "delve into",
    "tapestry of",
    "testament to",
    "furthermore",
    "moreover",
    "in conclusion",
    "let's dive deep",
    "dive into",
    "game changer",
    "game-changing",
    "unlock the power",
    "unlocking the potential",
    "seamlessly",
    "leverage",
    "cutting-edge",
    "revolutionize",
    "state-of-the-art",
    "paradigm shift",
    "beacon of",
    "treasure trove",
    "synergy",
    "spearhead",
    "holistic approach",
    "vital role",
    "pivotal role",
    "crucial element",
    "indispensable tool",
    "unleash",
    "harness",
    "foster",
    "realm of",
    "world of",
    "ever-evolving",
    "rapidly changing",
    "fast-paced world",
    "demystify",
    "elevate your",
    "take it to the next level",
    "silver bullet",
    "panacea",
    "it goes without saying",
    "at the end of the day",
    "gameplan",
    "cornerstone",
    "bedrock",
    "linchpin",
    "myriad of",
    "plethora of",
    "multifaceted",
    "intertwined",
    "beacon",
    "embark on",
    "journey of",
]



@dataclass
class SeoRule:
    id: str
    name: str
    layer: str
    text: str
    priority: int


@dataclass
class Principle:
    layer: str
    source_class: str  # rule | aeo_2026 | seo_concept
    concept: str
    operator_text: str
    weight: float = 0.5
    rule_id: str | None = None


@dataclass
class TrainingProfile:
    """SEO article profile only — no viral craft cues."""

    lane: str
    rules: list[SeoRule] = field(default_factory=list)
    principles: list[Principle] = field(default_factory=list)
    craft_cues: list[str] = field(default_factory=list)  # always empty (API compat)
    forbidden_cliches: list[str] = field(default_factory=lambda: list(FORBIDDEN_CLICHES))
    applied_rule_ids: list[str] = field(default_factory=list)
    quality_requirements: list[str] = field(default_factory=lambda: list(SEO_QUALITY_REQUIREMENTS))
    sources_loaded: dict[str, bool] = field(default_factory=dict)
    pipeline: str = "seo_content"


_RULE_CACHE: list[SeoRule] | None = None
_PRINCIPLE_CACHE: list[Principle] | None = None


def _stable_idx(seed: str, n: int) -> int:
    if n <= 0:
        return 0
    h = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % n


def _stable_pick(items: list, seed: str, k: int) -> list:
    if not items or k <= 0:
        return []
    scored = []
    for i, item in enumerate(items):
        h = hashlib.sha256(f"{seed}:{i}".encode()).hexdigest()
        scored.append((h, item))
    scored.sort(key=lambda x: x[0])
    return [it for _, it in scored[:k]]


def parse_seo_rules_from_sql(path: Path = SEO_RULES_SQL) -> list[SeoRule]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\('(SCR-\d+)',\s*'((?:\\'|[^'])*)',\s*'((?:\\'|[^'])*)',\s*\n\s*'((?:\\'|[^'])*)'",
        re.MULTILINE,
    )
    pri_pattern = re.compile(
        r"\('(SCR-\d+)'[\s\S]*?(\d+)\),\s*(?:\n|--|\()",
        re.MULTILINE,
    )
    priorities: dict[str, int] = {}
    for m in pri_pattern.finditer(text):
        priorities[m.group(1)] = int(m.group(2))

    rules: list[SeoRule] = []
    for m in pattern.finditer(text):
        rid, name, layer, rule_text = m.groups()
        rule_text = rule_text.replace("''", "'")
        name = name.replace("''", "'")
        rules.append(
            SeoRule(
                id=rid,
                name=name,
                layer=layer,
                text=rule_text,
                priority=priorities.get(rid, 50),
            )
        )
    return rules


def _clean_principle_text(raw: str, max_len: int = 280) -> str | None:
    if not raw:
        return None
    t = re.sub(r"\s+", " ", raw).strip()
    bad_markers = [
        "early release",
        "copyright",
        "all rights reserved",
        "table of contents",
        "isbn",
        "oreilly",
        "raw and unedited",
        "vtp-",
        "idea_card",
        "mannequin challenge",
    ]
    low = t.lower()
    if any(b in low for b in bad_markers):
        return None
    if len(t) < 40:
        return None
    if len(t) > max_len:
        t = t[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return t


def load_2026_principles(limit_per_layer: int = 40) -> list[Principle]:
    path = SEO_PREPARED / "2026_seo_observations.jsonl"
    if not path.exists():
        return []
    by_layer: dict[str, list[Principle]] = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            # Reject viral-card harvests if they were wrongly placed under seo_content
            cat = (o.get("category_slug") or "").lower()
            if cat in {
                "comedy_and_humor",
                "viral_algorithm",
                "influencer_personas",
                "viral_trends",
                "creator_registry",
            }:
                continue
            layer = o.get("seo_layer") or "content_strategy"
            ts = o.get("text_signals") or {}
            abstract = ts.get("abstract_text") if isinstance(ts, dict) else ""
            cleaned = _clean_principle_text(abstract or "", max_len=320)
            if not cleaned:
                continue
            concepts = o.get("derived_concepts") or []
            if isinstance(concepts, str):
                try:
                    concepts = json.loads(concepts.replace("'", '"'))
                except Exception:
                    concepts = [concepts]
            concept = ", ".join(concepts[:3]) if concepts else layer
            weight = float(o.get("training_weight") or 0.5)
            prin = Principle(
                layer=layer,
                source_class="aeo_2026",
                concept=concept,
                operator_text=cleaned,
                weight=weight,
            )
            by_layer.setdefault(layer, []).append(prin)

    out: list[Principle] = []
    for layer, items in by_layer.items():
        items.sort(key=lambda p: p.weight, reverse=True)
        out.extend(items[:limit_per_layer])
    return out


def load_concept_only_principles(limit: int = 80) -> list[Principle]:
    path = SEO_PREPARED / "seo_observations.jsonl"
    if not path.exists():
        return []
    seen: set[str] = set()
    out: list[Principle] = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            if len(out) >= limit:
                break
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if o.get("training_use") not in (None, "pattern_only", "analysis_only"):
                continue
            cat = (o.get("category_slug") or "").lower()
            if cat in {
                "comedy_and_humor",
                "viral_algorithm",
                "influencer_personas",
                "viral_trends",
                "creator_registry",
            }:
                continue
            concepts = o.get("derived_concepts") or []
            if isinstance(concepts, str):
                try:
                    concepts = json.loads(concepts.replace("'", '"'))
                except Exception:
                    concepts = re.findall(r"[A-Za-z][A-Za-z\\- ]{2,}", concepts)[:5]
            if not concepts:
                continue
            key = "|".join(sorted(str(c).lower() for c in concepts[:4]))
            if key in seen:
                continue
            seen.add(key)
            layer = o.get("seo_layer") or "content_strategy"
            concept = ", ".join(str(c) for c in concepts[:4])
            out.append(
                Principle(
                    layer=layer,
                    source_class="seo_concept",
                    concept=concept,
                    operator_text=f"Cover related entities/terms in plain language: {concept}.",
                    weight=float(o.get("training_weight") or 0.4),
                )
            )
    return out


def get_all_rules() -> list[SeoRule]:
    global _RULE_CACHE
    if _RULE_CACHE is None:
        _RULE_CACHE = parse_seo_rules_from_sql()
    return _RULE_CACHE


def get_all_principles() -> list[Principle]:
    global _PRINCIPLE_CACHE
    if _PRINCIPLE_CACHE is None:
        _PRINCIPLE_CACHE = load_2026_principles() + load_concept_only_principles()
    return _PRINCIPLE_CACHE


def profile_for(
    *,
    slug: str,
    title: str,
    sections: list[str],
    lane: str,
    rule_limit: int = 12,
    principle_limit: int = 5,
    craft_limit: int = 0,  # ignored — SEO pipeline has no viral craft
) -> TrainingProfile:
    lane_cfg = LANE_PROFILE.get(lane, LANE_PROFILE["strategy"])
    rules = get_all_rules()
    principles = get_all_principles()

    by_id = {r.id: r for r in rules}
    selected: list[SeoRule] = []
    priority_ids = list(dict.fromkeys([*lane_cfg["priority_rules"], *SEO_2026_RULE_IDS]))
    for rid in priority_ids:
        if rid in by_id and by_id[rid] not in selected:
            selected.append(by_id[rid])

    layer_rules = [r for r in rules if r.layer in lane_cfg["seo_layers"] and r not in selected]
    layer_rules.sort(key=lambda r: r.priority, reverse=True)
    for r in layer_rules:
        if len(selected) >= rule_limit:
            break
        selected.append(r)

    if len(selected) >= 3 and layer_rules:
        swap = layer_rules[_stable_idx(slug + ":rule", len(layer_rules))]
        if swap not in selected:
            selected[-1] = swap

    selected = selected[:rule_limit]

    cand_prin = [
        p
        for p in principles
        if p.layer in lane_cfg["seo_layers"] or p.layer == "answer_engine_optimization"
    ]
    if not cand_prin:
        cand_prin = principles
    cand_prin = sorted(cand_prin, key=lambda p: p.weight, reverse=True)
    head = cand_prin[: max(principle_limit * 3, principle_limit)]
    picked_prin = _stable_pick(head, f"{slug}:prin", principle_limit)

    return TrainingProfile(
        lane=lane,
        rules=selected,
        principles=picked_prin,
        craft_cues=[],  # viral craft never attached to SEO articles
        applied_rule_ids=[r.id for r in selected],
        quality_requirements=list(SEO_QUALITY_REQUIREMENTS),
        sources_loaded={
            "seo_content_rules_sql": bool(rules),
            "seo_2026_rules_complete": all(rid in by_id for rid in SEO_2026_RULE_IDS),
            "seo_2026_observations": (SEO_PREPARED / "2026_seo_observations.jsonl").exists(),
            "seo_observations_concepts": (SEO_PREPARED / "seo_observations.jsonl").exists(),
            "book_high_value_craft": False,  # intentionally excluded from SEO pipeline
            "viral_training": False,
        },
        pipeline="seo_content",
    )


def rule_operator_bullets(profile: TrainingProfile, max_items: int = 6) -> list[str]:
    """Public-safe SEO operator bullets (no SCR ids, no viral jargon)."""
    bullets = []
    for r in profile.rules[:max_items]:
        text = r.text.strip()
        if ". " in text:
            text = text.split(". ")[0] + "."
        if len(text) > 180:
            text = text[:177] + "…"
        bullets.append(text)
    for p in profile.principles[:2]:
        bullets.append(p.operator_text)
    seen = set()
    out = []
    for b in bullets:
        k = b.lower()[:80]
        if k in seen:
            continue
        seen.add(k)
        out.append(b)
    return out[:max_items]


def training_status_report() -> dict:
    rules = get_all_rules()
    principles = get_all_principles()
    return {
        "pipeline": "seo_content",
        "seo_rules_count": len(rules),
        "seo_2026_rule_count": sum(1 for r in rules if r.id in SEO_2026_RULE_IDS),
        "seo_rule_layers": sorted({r.layer for r in rules}),
        "principles_count": len(principles),
        "craft_cue_count": 0,
        "viral_training_attached": False,
        "archive_present": ARCHIVE.exists(),
        "paths": {
            "seo_rules_sql": str(SEO_RULES_SQL),
            "seo_prepared": str(SEO_PREPARED),
        },
        "files": {
            "seo_rules_sql": SEO_RULES_SQL.exists(),
            "2026_seo_observations": (SEO_PREPARED / "2026_seo_observations.jsonl").exists(),
            "seo_observations": (SEO_PREPARED / "seo_observations.jsonl").exists(),
            "high_value_merged_excluded": True,
        },
    }


if __name__ == "__main__":
    import pprint

    pprint.pp(training_status_report())
    sample = profile_for(
        slug="visual-signature-guide",
        title="Visual Signature Guide",
        sections=["camera height", "color grade"],
        lane="visual",
    )
    print("pipeline", sample.pipeline)
    print("applied", sample.applied_rule_ids)
    print("craft_cues", sample.craft_cues)
    print("sources", sample.sources_loaded)
    for b in rule_operator_bullets(sample):
        print("-", b[:120])
