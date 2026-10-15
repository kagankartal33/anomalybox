# Idea Card V11 Run — 2026-08-10

**Status:** Track A COMPLETE · Track B QLoRA STARTED / pending gen-eval  
**Run dir:** `C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\runs\idea_card_v11_20260810_193838`  
**Compile version:** `2026-v11-idea-card` (**active**)  
**Pipeline:** idea-card only (no SEO paths)

---

## Separation

| Control | Applied |
|---------|---------|
| Viral ≠ SEO | No `content/resources`, no `seo_content/*`, no SEO LoRA |
| HF surface | Pattern-only abstracts + hashes; no joke/comment bodies in examples |
| Restricted | Hard-dropped at prepare |
| LoRA SFT | Synthetic short cards only (`sft_idea_card_short.jsonl`) |
| Gen wire | Adapter not production-wired until gen-eval PASS |

---

## Phase results

### Phase 0 — Baseline freeze
- Pre baseline + deep audit snapshots in run dir
- SFT short build: **60,000** rows (`sft_idea_card_short.jsonl`)

### Phase 1 — GPU calibration (RTX 5060 Laptop ~8 GB)
| Field | Value |
|-------|--------|
| Model | Qwen/Qwen2.5-1.5B-Instruct 4-bit QLoRA |
| max_seq | 512 |
| Best batch | **1** (batch 2 peaked > VRAM on realistic dummy) |
| grad_accum | **32** (effective 32) |
| Measured util | ~**62%** allocated peak (safe under 75% target) |
| Artifact | `GPU_CALIBRATION_idea_card.json` |

### Phase 2 — Mega HF prepare
| Field | Value |
|-------|--------|
| Out | `dataset/huggingface/prepared_v11_idea_card/` |
| Caps | 80k rows / source · 400k scan |
| **Abstract rows** | **353,633** |
| Restricted selected | **0** |
| Policy | `pattern_only_no_surface_copy` |

### Phase 3 — DB promote + compile
| Field | Value |
|-------|--------|
| Source slug | `hf_idea_card_large_v1` |
| Segment rank fix | `max(1200, max_examples/3)` — was hard-capped at 1200 → only 3600 HF rows |
| Compile version replace fix | quote-bound `'2026-v1'` (bare replace corrupted `2026-v11-*`) |
| **Source training examples** | **120,000** |
| **Total examples** | **177,596** |
| Features v11 | **177,596** |
| Active compile | **2026-v11-idea-card** |

### Phase 4 — Hygiene + deep audit
| Gate | Result |
|------|--------|
| Hygiene empty_pattern_rate | **0** PASS |
| Deep audit critical | **[]** PASS |
| Grade | **C** (soft issues only) |
| restricted_rate | 0.24% |
| VTP affinity coverage | **40/40** |
| Pilot exact scopes | beauty, entertainment_comedy, travel, food, fashion, fitness_wellness_safe |
| Soft issues | raw `comedy`/`fitness` still global fallback (mapped in generator); copy_risk mostly high by HF policy |

### Product companions (same program)
1. **Scope alias** in `admin-generation-batches`: comedy→entertainment_comedy, fitness→fitness_wellness_safe  
2. Shared helper: `lib/training-scope.ts`  
3. **Craft scorer** replaces id/title hash lottery in `scoreCandidate` (`1.2.0-craft-structure`)

---

## Track B — GPU QLoRA (in progress / next)

| Field | Value |
|-------|--------|
| Data | run dir `sft_idea_card_short.jsonl` (60k) |
| Out | `ViralBox-training-archive/models/lora-idea-card-v11/` |
| Recipe | batch=1, accum=32, max_seq=512, epochs=2, max_steps≈3750 |
| Est wall | ~9–14 h (remeasure after first 50 steps) |
| Kill switch | `eval-lora-idea-card-generation.py` — FAIL → delete adapter |

---

## GPU hours (plan vs this machine)

| Scenario | GPU hours |
|----------|----------:|
| Recommended plan | ~9–10 h |
| This calibrate (batch1 × microbatch ~3.5s worst-case dummy) | remeasure live |
| Prior 3.2k / 350-step secure run | **~0.4 h** |

---

## Do not

- Wire LoRA to production without gen-eval PASS  
- Load SEO observations into this compile  
- Use `tools/train-lora.py` SEO path for idea cards  
- Trust train_loss alone  

---

## Next commands

```powershell
# Long QLoRA
$RUN = (Get-Content "$env:TEMP\viralbox_idea_v11_run_dir.txt" -Raw).Trim()
python tools/train-lora-idea-card-secure.py `
  --data "$RUN\sft_idea_card_short.jsonl" `
  --out "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\models\lora-idea-card-v11" `
  --batch 1 --grad-accum 32 --max-seq 512 --epochs 2 --max-steps 3750 --lr 1e-4

# Gen eval kill switch
python tools/eval-lora-idea-card-generation.py `
  --adapter "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\models\lora-idea-card-v11" `
  --out "$RUN\LORA_GEN_EVAL_v11.json"
```
