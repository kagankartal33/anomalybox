"""
world_class_generator.py
========================
SEO CONTENT PIPELINE ONLY (legacy batch entrypoint).

Thin wrapper around generate_unique_resources so batch_generate_sprint*.py
scripts keep working. Does not load viral idea-card training.

Prefer: python tools/generate_unique_resources.py

See: docs/architecture/content-pipelines-separation.md
"""

from pathlib import Path

from originality_gate import OriginalityGate

OUT_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\world_class_output")


class WorldClassContentPipeline:
    """SEO article generator adapter — not for viral idea cards."""

    def __init__(self):
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        self.gate = OriginalityGate(references=[])
        resources_dir = Path(__file__).resolve().parents[1] / "content" / "resources"
        if resources_dir.exists():
            for path in sorted(resources_dir.glob("*.md")):
                text = path.read_text(encoding="utf-8")
                self.gate.references.append({"id": path.stem, "text": text})
                from originality_gate import get_shingles, sha256_text

                self.gate.ref_hashes[sha256_text(text)] = path.stem
                self.gate.ref_shingles[path.stem] = get_shingles(text)

    def generate(self, topic: str, topic_slug: str):
        print("=" * 65)
        print(f" SEO ARTICLE: '{topic}'")
        print("=" * 65)
        from generate_unique_resources import ResourceMeta, generate_unique_article

        meta = ResourceMeta(
            slug=topic_slug,
            title=topic,
            description=f"SEO resource guide: {topic}.",
            sections=[
                "Search intent and answer block",
                "Structured tactical sections",
                "Implementation checklist",
                "FAQ and next action",
            ],
        )
        article, status, profile = generate_unique_article(meta, self.gate)
        out_file = OUT_DIR / f"{topic_slug}_world_class.md"
        out_file.write_text(article, encoding="utf-8")
        from originality_gate import get_shingles, sha256_text

        self.gate.references.append({"id": topic_slug, "text": article})
        self.gate.ref_hashes[sha256_text(article)] = topic_slug
        self.gate.ref_shingles[topic_slug] = get_shingles(article)
        print(
            f"Status: {status} | pipeline=seo | rules={','.join(profile.applied_rule_ids[:5])} | Saved: {out_file.name}"
        )
        return article if status in ("PASS", "REVIEW_REQUIRED") else None


if __name__ == "__main__":
    pipeline = WorldClassContentPipeline()
    pipeline.generate("Visual Signature Guide for Instagram Creators", "visual-signature-guide")
