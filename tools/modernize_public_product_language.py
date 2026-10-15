"""Align public Markdown with digital Creator Vault delivery and brief naming."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = [ROOT / "content" / "seo-package", ROOT / "content" / "resources"]

REPLACEMENTS = (
    ("private AnomalyBox dossiers", "campaign-ready AnomalyBox briefs"),
    ("private AnomalyBox dossier", "campaign-ready AnomalyBox brief"),
    ("AnomalyBox private dossiers", "AnomalyBox campaign-ready briefs"),
    ("AnomalyBox private dossier", "AnomalyBox campaign-ready brief"),
    ("private dossier boxes", "campaign-ready creative briefs"),
    ("private dossiers", "campaign-ready briefs"),
    ("private dossier", "campaign-ready brief"),
    ("dossier options", "creative brief options"),
)


def main() -> int:
    changed = 0
    for directory in CONTENT_DIRS:
        for path in sorted(directory.glob("*.md")):
            original = path.read_text(encoding="utf-8")
            polished = original
            for old, new in REPLACEMENTS:
                polished = polished.replace(old, new)
            if polished != original:
                path.write_text(polished, encoding="utf-8", newline="\n")
                changed += 1
    print(f"modernized public Markdown files: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())