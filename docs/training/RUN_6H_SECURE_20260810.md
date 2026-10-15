# Secure 6h training run — 2026-08-10

**Status:** COMPLETE (with notes)  
**Run dir:** `C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\runs\6h_secure_20260810_064235`  
**Compile version:** `2026-v10-6h-secure` (**active**)  
**GPU:** NVIDIA GeForce RTX 5060 Laptop 8 GB — **used**

---

## Safety posture

| Control | Applied |
|---------|---------|
| Viral ≠ SEO | No SEO paths; new LoRA is viral-only |
| HF surface copy | Observations are **abstract hashes + flags** (`pattern_only_no_surface`) |
| Restricted rows | Dropped at prepare (nsfw / self-harm / sexual violence lexicons) |
| Removed Reddit bodies | Dropped |
| PII light strip | emails / phones / @handles |
| High copy_risk | Tagged high (generation must not copy surface) |
| Template ban lint | green |
| LoRA data | 3200 synthetic secure SFT cards only (no Reddit/YT text) |

---

## Track A — Corpus

### Hugging Face prepare
- Output: `dataset/huggingface/prepared_6h_secure/hf_social_training_v2_prepared.jsonl`
- **183,240** abstract observations from:
  - Reddit jokes / questions / confessions
  - TIFU
  - YouTube popular comments
- Policy: `pattern_only_no_surface_copy`
- Restricted selected: **0** (hard drop)

### DB train (HF)
- `source_slug`: `hf_social_6h_secure_v1`
- Observations applied; source training examples capped path reported **3600** from this source batch metrics
- Total `viral_training_examples`: **57,596**
- Eval cases source: **200**
- Trend signals source: **10,000**

### Compile
- Rebuilt `viral_training_compile` as **2026-v10-6h-secure**
- Features rebuilt: **57,596**
- Affinity rows: **1,431**
- `empty_patterns`: **0** → hygiene **PASS**
- Active compilation: **yes**

### Profile smoke
- `training_profile_for_scope('beauty','instagram_reels',8)` → **exact_category** hits (VTP-006, 036, 026, 027, 039, 001, 003, 018)
- Comedy slug falls back to **global_platform_fallback** (use `entertainment_comedy` for exact comedy affinity)

### Book craft re-apply
- **Failed** on duplicate key `viral_training_example_features_pkey` (compile race / partial re-insert)
- Prior book high-value signal already in example pool; final compile includes full 57,596 examples
- **Non-blocking** for this run

---

## Track B — GPU LoRA (secure)

| Field | Value |
|-------|--------|
| Base | `Qwen/Qwen2.5-1.5B-Instruct` |
| Quant | 4-bit QLoRA |
| Trainable | 18.5M / 1.56B (1.18%) |
| SFT rows | 3200 synthetic idea cards |
| Steps | 350 |
| Wall time | **25.1 min** |
| Final train_loss | ~0.11 |
| Output | `ViralBox-training-archive/models/lora-idea-card-6h-secure/` |
| Secure eval (SFT cleanliness) | **100%** pass; **KEEP adapter** |
| Production wire | **Not wired** — offline until human gen review |

Artifacts: `adapter_model.safetensors` (~74 MB), tokenizer, `train_meta.json`

---

## Quality baselines (finalist export)

| | Pre/Post (same finalist export after adapt/present fixes) |
|--|--|
| Cards | 35 |
| v2 red-gate pass | **100%** |
| Schema v2 mean | **94** |

(Generation quality uplift from this corpus is measured on **new stock**, not old finalists.)

---

## Commands / tools added

- `tools/build-secure-sft-idea-cards.py`
- `tools/train-lora-idea-card-secure.py`
- `tools/eval-secure-lora-cards.py`
- `tools/audit-viral-training-hygiene.ps1`
- Hardened `tools/prepare-downloaded-hf-training-data.py` (restricted drop, PII strip, removed drop)

---

## Residual risks / next

1. Re-apply book craft with non-destructive feature upsert (fix pkey collision).  
2. Map comedy → `entertainment_comedy` in generator scope.  
3. Human-review 20 generations **with** LoRA before any production generator hook.  
4. Pilot restock 5 categories against new profile.  
5. Craft `scoreCandidate` v2 (hash removal) still pending.

---

## Success checklist

| Gate | Result |
|------|--------|
| Compile `2026-v10-6h-secure` active | **PASS** |
| Hygiene empty patterns = 0 | **PASS** |
| HF pattern-only promote | **PASS** |
| SEO isolation | **PASS** |
| GPU LoRA completed | **PASS** |
| LoRA secure keep | **PASS** (SFT-level; gen review next) |
| Book re-apply | **FAIL soft** (non-blocking) |
| Template lint | **PASS** |
