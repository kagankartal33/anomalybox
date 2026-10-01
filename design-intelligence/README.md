# Premium Design Intelligence

This pack is a compact, license-aware reference system for improving ViralBox website and app UI quality.

It does not fine-tune a model, clone datasets, or store third-party HTML/CSS/JS corpora. Scripts query bounded Hugging Face Dataset Viewer pages, keep provenance metadata, and convert selected references into original design principles.

## Refresh Workflow

```powershell
python .\\design-intelligence\\scripts\\discover_webui_candidates.py --max-records 120 --offsets 0 500 1500 3000
python .\\design-intelligence\\scripts\\discover_websight_patterns.py --max-records 60
python .\\design-intelligence\\scripts\\score_reference_candidates.py --approve-limit 40
python .\\design-intelligence\\scripts\\export_approved_references.py --max-downloads 20
python .\\design-intelligence\\scripts\\build_design_playbook.py
```

Use larger limits only when needed. Do not run `snapshot_download`, `git clone`, `git lfs`, or bulk Parquet downloads for this pack.

## Output

- `manifests/candidate_manifest.jsonl`: bounded metadata candidates.
- `manifests/approved_manifest.jsonl`: approved references with scores and provenance.
- `manifests/websight_pattern_notes.jsonl`: compact structure notes from WebSight v0.2, with no raw HTML retained.
- `references/approved/`: selected screenshots only.
- `derived/`: original ViralBox design, marketing, accessibility, responsive, and SEO rules.

## Usage

Before changing ViralBox UI, read:

- `derived/PREMIUM_WEB_DESIGN_PLAYBOOK.md`
- `derived/premium-pattern-library.md`
- `derived/anti-pattern-library.md`
- `derived/seo-marketing-implementation-rules.md`
- `derived/responsive-layout-rules.md`

Never copy a source brand, logo, wording, layout sequence, asset, or code.