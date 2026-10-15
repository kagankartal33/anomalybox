# Training sources archived (off app tree)

`Book-Train/` and `dataset/` were used for ViralBox training, then moved out of the app repo so runtime code stays lean.

## Archive root

```
C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\
  Book-Train\
  dataset\
  tmp-generator-flow.log
  tmp-quality-gate.log
  README.md
```

## What was trained

| Package | Compile / slug | Archive path |
|---------|----------------|--------------|
| High-value Book craft | `2026-v9-book-high-value` / `book_high_value_v1` | `dataset\book_train\prepared\high_value_from_book\` |
| Book-Train cinema (earlier) | `2026-v7-book-train-cinema*` | `Book-Train\` + `dataset\book_train\prepared\` |
| HF / other prepared sets | various | `dataset\huggingface\`, `dataset\` root files |

## App tree expectation

ViralBox root should **not** contain:

- `Book-Train/`
- `dataset/`

Training tools remain under `tools/`; pass absolute paths into the archive when re-preparing or re-compiling.

## Related docs

- [book-high-value-import.md](./book-high-value-import.md)
- Archive `README.md` at the path above
