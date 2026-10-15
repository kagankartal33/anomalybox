# Book → ViralBox high-value training import

## Source project

`C:\Users\Kagan\OneDrive\Desktop\Book`

## Curated package location

Training sources were archived after compile. Package lives at:

`C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\book_train\prepared\high_value_from_book\`

See [TRAINING_SOURCES_ARCHIVED.md](./TRAINING_SOURCES_ARCHIVED.md).

## Included (high value only)

| Output | Content | Policy |
|--------|---------|--------|
| `cinema_craft_v1.jsonl` | Cinema / shot / edit / scene craft from Book | analysis_only |
| `story_craft_v1.jsonl` | Story Genius, Save the Cat, On Writing (+ selected craft) | analysis_only |
| `codex_v14_craft_v1.jsonl` | Bestseller toolkit abstract craft | analysis_only |
| `high_value_merged_v1.jsonl` | Deduped merge of the above | analysis_only |
| `references/comedy_systems/` | Ultimate Comedy Master systems | prompt/reference only |
| `references/codex_comedy_system_package/` | Comedy router package | prompt/reference only |
| `references/BOOK_QUALITY_SCORECARD.md` | Quality scoring ideas | reference only |
| `references/STYLE_MODEL_v2.md` | Style model notes | reference only |

## Explicitly skipped

- `comedy_continue_*.jsonl` (Temporal Bureaucracy deadpan voice)
- `master_sft` / `author_voice` (book product voice)
- Raw commercial novel epubs
- SEO / Amazon / Twitter dumps
- LoRA weights under `Book/models/`

## Quality policy

- System prompts rewritten for **ViralBox creator-card craft**
- `quality_floor_target = 80` on normalized rows
- No creator-facing surface copy of training sources

## Commands

```powershell
# Re-import curated package from Book (writes into archive by default via tools params)
npm run train:import-book-hv

# Compile prepared package from archive into local Supabase training tables
powershell -ExecutionPolicy Bypass -File .\tools\train-from-dataset.ps1 `
  -Mode book_train `
  -DatasetPath "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\book_train\prepared\high_value_from_book" `
  -SourceSlug book_high_value_v1 `
  -CompileVersion 2026-v9-book-high-value `
  -Apply
```

## Notes

- Source files in Book are never deleted.
- `Book-Train/` and `dataset/` no longer live under the ViralBox app root; they are in `ViralBox-training-archive`.
- Comedy master docs are for generator/admin prompt enrichment, not for leaking into creator cards.
