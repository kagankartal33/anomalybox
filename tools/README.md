# Tools

## Import Generated Batch

Use this when the generator creates a folder like:

```text
generated_batches/
  batch_2026_06_28_beauty_luxury_editor/
    manifest.json
    ideas_0001.jsonl
    ideas_0002.jsonl
```

Local example:

```powershell
$env:ADMIN_API_TOKEN = "local-admin-token"
.\tools\import-generated-batch.ps1 `
  -BatchFolder .\generated_batches\batch_2026_06_28_beauty_luxury_editor `
  -Publish
```

The script creates the batch, imports JSONL rows, scores valid ideas, and optionally publishes approved ideas into `idea_inventory`.