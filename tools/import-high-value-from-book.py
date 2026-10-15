#!/usr/bin/env python3
"""Import only high-value training assets from Desktop/Book into ViralBox.

SELECT:
  - viralbox_cinema_craft_train.jsonl  -> abstract cinema/video craft
  - bookstotrain/*_craft.jsonl         -> abstract story craft (selected manuals first)
  - codex_v14/*_craft*.jsonl           -> abstract structure craft (voice rewritten)
  - BookComedyAlgo + codex_comedy_system_package -> reference docs (not raw SFT prose)

SKIP:
  - comedy_continue_*.jsonl (Temporal Bureaucracy deadpan voice)
  - master_sft / author_voice (book product voice)
  - raw epubs, KDP packages, SEO/Amazon dumps
  - LoRA model weights

Does not delete Book sources. Writes under the training archive:
ViralBox-training-archive/dataset/book_train/prepared/high_value_from_book/.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = Path(r"C:\Users\Kagan\OneDrive\Desktop\Book")
ARCHIVE = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
OUT_ROOT = ARCHIVE / "dataset" / "book_train" / "prepared" / "high_value_from_book"

VIRALBOX_SYSTEM = (
    "You are a premium creator-card craft coach for short-form video (Instagram Reels). "
    "Teach abstract structure only: hook, scene beats, camera specificity, edit rhythm, payoff, "
    "and brand-safe execution. Never reproduce protected book prose. Never imitate living authors. "
    "Never expose training sources, scores, or internal systems. Output must stay analysis_only craft guidance."
)

# Prefer craft manuals over commercial fiction abstracts.
PRIORITY_CRAFT_SLUGS = [
    "story_genius",
    "save_the_cat",
    "on_writing",
    "lessonsinchemistry",  # still abstract craft rows only
    "moby_dick",
    "the_secret_of_secrets",
]

COMEDY_MD_ALLOW = [
    "Ultimate_Comedy_Master_System_POLISHED_NO_DUPLICATES.md",
    "Ultimate_Comedy_Master_System_ZERO_LOSS_MERGED.md",
    "Master_Humor_Pacing_Blueprint_System_v1.1.md",
    "Ultimate_JokeAlgo_for_Books_Comedians_Cartoonists_Enhanced.md",
    "comedy_styles_and_sketch_writing_master_guide(19).md",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()


def clean(value: Any, limit: int = 4000) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text[:limit].strip()


def rewrite_messages(messages: list[dict[str, Any]] | None) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    if not messages:
        return [{"role": "system", "content": VIRALBOX_SYSTEM}]
    for msg in messages:
        role = str(msg.get("role") or "user")
        content = clean(msg.get("content"), 6000)
        if not content:
            continue
        if role == "system":
            # Drop Temporal Bureaucracy / book-specific coach voice.
            content = VIRALBOX_SYSTEM
        # Strip protected-novel reproduction risks lightly.
        content = re.sub(r"Temporal Bureaucracy[^\n.]{0,80}", "premium creator-card craft", content, flags=re.I)
        content = re.sub(r"\bTB\b", "creator-card", content)
        out.append({"role": role, "content": content})
    if not any(m["role"] == "system" for m in out):
        out.insert(0, {"role": "system", "content": VIRALBOX_SYSTEM})
    return out


def normalize_cinema_row(raw: dict[str, Any], source_file: str) -> dict[str, Any] | None:
    abstract = clean(raw.get("abstract_text") or "")
    if len(abstract) < 40:
        return None
    pattern_ids = raw.get("pattern_ids") if isinstance(raw.get("pattern_ids"), list) else []
    craft_features = raw.get("craft_features") if isinstance(raw.get("craft_features"), list) else []
    layer = clean(craft_features[0] if craft_features else "premium_video_blueprint", 80)
    category = {
        "cinematography_visual_language": "creator_education",
        "film_grammar_scene_logic": "creator_education",
        "editing_rhythm_payoff": "entertainment_comedy",
        "sound_design_emotion": "creator_education",
        "screenplay_story_engine": "entertainment_comedy",
        "premium_video_blueprint": "lifestyle",
    }.get(layer, "creator_education")
    content_hash = sha(abstract)
    return {
        "content_hash": content_hash,
        "source_ref": f"book_hv_cinema:{Path(source_file).name}",
        "source_kind": "jsonl_import",
        "extraction_method": "high_value_from_book",
        "chunk_id": clean(raw.get("id") or content_hash[:24], 180),
        "platform": "instagram_reels",
        "category_slug": category,
        "locale": "en",
        "language": "en",
        "source_family": "book_high_value_cinema",
        "source_intent": "premium_video_craft_pattern",
        "book_train_layer": layer,
        "abstract_text": abstract,
        "pattern_ids": pattern_ids or ["VTP-013", "VTP-020", "VTP-014"],
        "craft_features": craft_features,
        "policy": "analysis_only",
        "quality_floor_target": 80,
        "messages": rewrite_messages(raw.get("messages") if isinstance(raw.get("messages"), list) else None),
        "imported_at": utc_now(),
    }


def normalize_craft_row(raw: dict[str, Any], source_file: str, family: str) -> dict[str, Any] | None:
    abstract = clean(
        raw.get("abstract_lesson")
        or raw.get("abstract_text")
        or (raw.get("messages") or [{}])[-1].get("content")
        or "",
        3500,
    )
    if len(abstract) < 30:
        return None
    # Reject rows that still look like raw novel paste.
    if re.search(r"\b(chapter\s+\d+|once upon a time)\b", abstract, re.I) and len(abstract) > 900:
        return None
    content_hash = sha(f"{family}:{abstract}")
    slug = clean(raw.get("slug") or Path(source_file).stem, 120)
    return {
        "content_hash": content_hash,
        "source_ref": f"book_hv_craft:{Path(source_file).name}",
        "source_kind": "jsonl_import",
        "extraction_method": "high_value_from_book",
        "chunk_id": clean(raw.get("id") or content_hash[:24], 180),
        "platform": "instagram_reels",
        "category_slug": "creator_education",
        "locale": "en",
        "language": "en",
        "source_family": family,
        "source_intent": "abstract_story_craft",
        "book_train_layer": "screenplay_story_engine",
        "abstract_text": abstract,
        "pattern_ids": raw.get("pattern_ids") if isinstance(raw.get("pattern_ids"), list) else ["VTP-014", "VTP-003", "VTP-020"],
        "policy": "analysis_only",
        "quality_floor_target": 80,
        "source_slug": slug,
        "messages": rewrite_messages(raw.get("messages") if isinstance(raw.get("messages"), list) else None),
        "imported_at": utc_now(),
    }


def iter_jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open(encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(row, dict):
                yield row


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def copy_tree_selected(src: Path, dest: Path) -> int:
    if not src.exists():
        return 0
    count = 0
    for path in src.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(src)
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        count += 1
    return count


def prioritize_craft_files(files: list[Path]) -> list[Path]:
    def rank(path: Path) -> tuple[int, str]:
        name = path.name.lower()
        for i, key in enumerate(PRIORITY_CRAFT_SLUGS):
            if key in name:
                return (i, name)
        return (100 + len(name), name)

    return sorted(files, key=rank)


def main() -> int:
    parser = argparse.ArgumentParser(description="Import high-value Book training sets into ViralBox")
    parser.add_argument("--book-root", default=str(DEFAULT_BOOK))
    parser.add_argument("--out-dir", default=str(OUT_ROOT))
    parser.add_argument("--max-cinema-rows", type=int, default=5000)
    parser.add_argument("--max-craft-rows", type=int, default=2500)
    parser.add_argument("--max-codex-rows", type=int, default=1500)
    parser.add_argument("--apply", action="store_true", help="Write files (default dry-run summary only)")
    args = parser.parse_args()

    book = Path(args.book_root)
    out = Path(args.out_dir)
    final = book / "final_training_data"

    plan = {
        "book_root": str(book),
        "out_dir": str(out),
        "apply": bool(args.apply),
        "sources": {},
        "totals": {},
        "skipped": [
            "comedy_continue_*.jsonl (Temporal Bureaucracy voice)",
            "master_sft / author_voice",
            "raw commercial novel epubs",
            "SEO/Amazon/Twitter dumps",
            "LoRA model weights under models/",
        ],
    }

    cinema_src = final / "viralbox_cinema_craft_train.jsonl"
    craft_dir = final / "bookstotrain"
    codex_craft = final / "codex_v14" / "codex_v14_full_craft_train.jsonl"
    if not codex_craft.exists():
        codex_craft = final / "codex_v14" / "codex_v14_craft_train.jsonl"
    comedy_algo = book / "BookComedyAlgo"
    comedy_pkg = book / "codex_comedy_system_package"

    cinema_rows: list[dict[str, Any]] = []
    if cinema_src.exists():
        for row in iter_jsonl(cinema_src):
            norm = normalize_cinema_row(row, cinema_src.name)
            if norm:
                cinema_rows.append(norm)
            if len(cinema_rows) >= args.max_cinema_rows:
                break
    plan["sources"]["cinema"] = {"path": str(cinema_src), "rows": len(cinema_rows), "exists": cinema_src.exists()}

    craft_rows: list[dict[str, Any]] = []
    craft_files = prioritize_craft_files(list(craft_dir.glob("*_craft.jsonl"))) if craft_dir.exists() else []
    for path in craft_files:
        for row in iter_jsonl(path):
            norm = normalize_craft_row(row, path.name, "book_high_value_story_craft")
            if norm:
                craft_rows.append(norm)
            if len(craft_rows) >= args.max_craft_rows:
                break
        if len(craft_rows) >= args.max_craft_rows:
            break
    plan["sources"]["bookstotrain_craft"] = {
        "dir": str(craft_dir),
        "files_seen": [p.name for p in craft_files[:12]],
        "rows": len(craft_rows),
    }

    codex_rows: list[dict[str, Any]] = []
    if codex_craft.exists():
        for row in iter_jsonl(codex_craft):
            # Keep only abstract craft tasks; skip pure TB continuation if labeled.
            task = clean(row.get("task") or row.get("source") or "", 80).lower()
            if "continue" in task and "craft" not in task:
                continue
            norm = normalize_craft_row(row, codex_craft.name, "book_high_value_codex_v14_craft")
            if norm:
                codex_rows.append(norm)
            if len(codex_rows) >= args.max_codex_rows:
                break
    plan["sources"]["codex_v14_craft"] = {"path": str(codex_craft), "rows": len(codex_rows), "exists": codex_craft.exists()}

    # Deduplicate by content_hash across all sets.
    merged: list[dict[str, Any]] = []
    seen: set[str] = set()
    for bucket in (cinema_rows, craft_rows, codex_rows):
        for row in bucket:
            h = row["content_hash"]
            if h in seen:
                continue
            seen.add(h)
            merged.append(row)

    plan["totals"] = {
        "cinema_rows": len(cinema_rows),
        "story_craft_rows": len(craft_rows),
        "codex_v14_rows": len(codex_rows),
        "merged_unique_rows": len(merged),
        "comedy_md_candidates": COMEDY_MD_ALLOW,
    }

    print(json.dumps(plan, indent=2, ensure_ascii=False))

    if not args.apply:
        print("\nDry-run only. Re-run with --apply to write curated files.")
        return 0

    # Write curated outputs.
    out.mkdir(parents=True, exist_ok=True)
    write_jsonl(out / "cinema_craft_v1.jsonl", cinema_rows)
    write_jsonl(out / "story_craft_v1.jsonl", craft_rows)
    write_jsonl(out / "codex_v14_craft_v1.jsonl", codex_rows)
    write_jsonl(out / "high_value_merged_v1.jsonl", merged)

    # Reference docs (not generator copy surface).
    refs = out / "references"
    refs.mkdir(parents=True, exist_ok=True)
    comedy_out = refs / "comedy_systems"
    comedy_out.mkdir(parents=True, exist_ok=True)
    copied_md = 0
    if comedy_algo.exists():
        for name in COMEDY_MD_ALLOW:
            src = comedy_algo / name
            if src.exists():
                shutil.copy2(src, comedy_out / name)
                copied_md += 1
    pkg_copied = 0
    if comedy_pkg.exists():
        pkg_copied = copy_tree_selected(comedy_pkg, refs / "codex_comedy_system_package")

    # Scorecard / style references (quality ideas only)
    for rel in [
        "0.Proje_Planlari_ve_Hikaye_Rehberi/BOOK_QUALITY_SCORECARD.md",
        "0.Proje_Planlari_ve_Hikaye_Rehberi/STYLE_MODEL_v2.md",
    ]:
        src = book / rel
        if src.exists():
            shutil.copy2(src, refs / src.name)

    manifest = {
        **plan,
        "written_at": utc_now(),
        "outputs": {
            "cinema_craft_v1.jsonl": len(cinema_rows),
            "story_craft_v1.jsonl": len(craft_rows),
            "codex_v14_craft_v1.jsonl": len(codex_rows),
            "high_value_merged_v1.jsonl": len(merged),
            "comedy_md_copied": copied_md,
            "comedy_package_files_copied": pkg_copied,
        },
        "usage": {
            "policy": "analysis_only / abstract_craft_only",
            "quality_floor": 80,
            "next_steps": [
                "Optional: tools/train-from-dataset.ps1 -Mode book_train -DatasetPath dataset/book_train/prepared/high_value_from_book -SourceSlug book_high_value_v1 -Apply",
                "Or feed high_value_merged_v1.jsonl into prepare/train pipeline after mapping.",
                "Use references/comedy_systems in generator prompt packs, not creator-facing cards.",
            ],
        },
    }
    (out / "IMPORT_MANIFEST.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    (out / "README.md").write_text(
        "\n".join(
            [
                "# High-value import from Desktop/Book",
                "",
                f"Imported at: {utc_now()}",
                "",
                "## Included",
                f"- cinema_craft_v1.jsonl ({len(cinema_rows)} rows)",
                f"- story_craft_v1.jsonl ({len(craft_rows)} rows)",
                f"- codex_v14_craft_v1.jsonl ({len(codex_rows)} rows)",
                f"- high_value_merged_v1.jsonl ({len(merged)} unique rows)",
                f"- references/comedy_systems ({copied_md} md files)",
                f"- references/codex_comedy_system_package ({pkg_copied} files)",
                "",
                "## Policy",
                "- analysis_only / abstract craft only",
                "- system prompts rewritten for ViralBox creator-card craft",
                "- Temporal Bureaucracy comedy_continue SFT intentionally skipped",
                "- quality_floor_target = 80",
                "",
                "## Train",
                "```powershell",
                "python .\\tools\\import-high-value-from-book.py --apply",
                "powershell -ExecutionPolicy Bypass -File .\\tools\\train-from-dataset.ps1 `",
                "  -Mode book_train `",
                "  -DatasetPath C:\\Users\\Kagan\\OneDrive\\Desktop\\ViralBox-training-archive\\dataset\\book_train\\prepared\\high_value_from_book `",
                "  -SourceSlug book_high_value_v1 `",
                "  -CompileVersion 2026-v9-book-high-value `",
                "  -Apply",
                "```",
                "",
            ]
        ),
        encoding="utf-8",
    )

    print(f"\nWrote curated package to {out}")
    print(json.dumps(manifest["outputs"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
