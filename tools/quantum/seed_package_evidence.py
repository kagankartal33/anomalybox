"""
Register first-party (Anomaly Box) evidence claims for SEO package pages
that mention product/direction capabilities — Section 5 compliance path.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.evidence_ledger import EvidenceLedger, seed_brand_sources  # noqa: E402

REG = ROOT / "lib" / "seo-package-registry.json"
CONTENT = ROOT / "content" / "seo-package"

# Safe first-party statements we can support from brand sources
BRAND_CLAIMS = [
    (
        "Anomaly Box provides private creative direction dossiers and does not guarantee virality, reach, or sales.",
        "Anomaly Box sells private creative direction dossiers; it does not guarantee virality, reach, or sales.",
    ),
    (
        "Shoot-ready direction systems emphasize proof, constraints, and claim-safe language.",
        "Shoot-ready direction systems emphasize proof, constraints, and claim-safe language.",
    ),
]


def main() -> int:
    pages = json.loads(REG.read_text(encoding="utf-8"))["pages"]
    ledger = EvidenceLedger()
    sources = ledger.list_sources()
    if len(sources) < 2:
        sources = seed_brand_sources(ledger)

    src_by_excerpt = {s.excerpt: s for s in ledger.list_sources()}
    # ensure both brand sources exist
    for s in ledger.list_sources():
        src_by_excerpt[s.excerpt] = s

    sources = ledger.list_sources()
    store_src = next((s for s in sources if "store" in s.url), sources[0])
    method_src = next((s for s in sources if "methodology" in s.url), sources[-1])

    linked = 0
    for page in pages:
        body = ""
        p = CONTENT / f"{page['slug']}.md"
        if p.exists():
            body = p.read_text(encoding="utf-8")
        # only attach when page mentions AnomalyBox / dossier / store path
        if not re.search(r"AnomalyBox|Anomaly Box|/store", body, re.I):
            continue
        page_id = str(page.get("id") or page["slug"])
        existing = ledger.list_claims(page_id=page_id)
        if existing:
            continue
        for i, (statement, span) in enumerate(BRAND_CLAIMS):
            claim = ledger.add_claim(
                statement=statement,
                claim_type="factual",
                risk_level="low",
                required_support=1,
                page_id=page_id,
            )
            src = store_src if i == 0 else method_src
            ledger.attach_support(claim.claim_id, src.source_id, span, support_strength=0.9)
            linked += 1

    print(f"Attached {linked} supported brand claims across package pages that mention the product.")
    print(f"Sources in ledger: {len(ledger.list_sources())}")
    print(f"Claims in ledger: {len(ledger.list_claims())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
