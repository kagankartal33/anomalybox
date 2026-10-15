"""
generate_real_content_113.py
=============================
DEPRECATED entrypoint.

The old implementation only had ~6 category templates and stamped the same body
across dozens of slugs (title-only swaps). That produced near-duplicate content.

Use instead:
    python tools/generate_unique_resources.py

That generator builds per-slug articles from lib/seo-content.ts metadata and
runs OriginalityGate against the growing corpus.
"""

from __future__ import annotations

from pathlib import Path

RESOURCES_DIR = Path(__file__).resolve().parents[1] / "content" / "resources"


def get_seo_content_architecture(slug: str, title: str) -> dict:
    raise RuntimeError(
        "generate_real_content_113.get_seo_content_architecture is retired. "
        "Run tools/generate_unique_resources.py instead."
    )


def build_seo_article(file_path: Path):
    raise RuntimeError(
        f"Refusing to overwrite {file_path.name} with retired category templates. "
        "Run: python tools/generate_unique_resources.py"
    )


def main():
    print("generate_real_content_113.py is RETIRED (it produced 6 near-identical bodies).")
    print("Redirecting to tools/generate_unique_resources.py ...")
    from generate_unique_resources import main as unique_main

    raise SystemExit(unique_main())


if __name__ == "__main__":
    main()
