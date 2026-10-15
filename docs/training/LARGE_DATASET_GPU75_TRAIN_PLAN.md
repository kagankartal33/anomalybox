# Large-Dataset GPU ~75% Training Plan (Quality-Safe)

> Historical plan, superseded by [card-training-v2.md](card-training-v2.md). Data quality, response-only loss and held-out generation tests now take precedence over dataset size or GPU utilization. The old template/512-token commands are retired.

**Hardware:** NVIDIA GeForce RTX 5060 Laptop · **~8 GB** VRAM · CUDA  
**Product:** Viral idea cards only (not SEO)  
**Constraint:** Training quality must **not degrade** vs current `2026-v10-6h-secure`  
**Target:** Very large datasets + **~75% GPU utilization** during GPU phases  

---

## 0) Critical principle (quality first)

| Layer | How “huge data” is used | Quality risk if naive |
|-------|-------------------------|------------------------|
| **A) Corpus / pattern affinity** | Millions of rows → **abstract** pattern_only signals | Low if surface never stored |
| **B) GPU LoRA / SFT** | Only **quality-gated** card JSON (tens of thousands max useful) | **High** if raw Reddit/YT dumped into SFT |

**Rule:**  
- **Huge datasets feed Track A (DB compile).**  
- **GPU does not train on raw jokes/comments.**  
- GPU trains on **clean, short, red-gate-passing idea_card v2** derived *using* Track A patterns — not the raw HF text.

Previous LoRA v1: train loss collapsed but **gen eval failed** (truncated/drift JSON).  
This plan prevents that class of failure.

---

## 1) What “%75 GPU” means on 8 GB

Not “use 75% of the internet.” It means during GPU train:

| Target | Value |
|--------|------:|
| VRAM occupancy | **~5.5–6.5 GB / 8 GB (~70–80%)** |
| GPU busy time | **>90%** of train wall time (few idle gaps) |
| Method | 4-bit QLoRA + max micro-batch that fits + grad accumulation |

### Recommended GPU recipe (start point)

| Setting | Value | Notes |
|---------|-------|--------|
| Base | `Qwen/Qwen2.5-1.5B-Instruct` (default) or smoke-test `Qwen2.5-3B-Instruct` 4-bit | 3B only if VRAM ≤6.5 GB stable |
| Quant | NF4 4-bit + fp16 compute | Required for 75% without OOM |
| LoRA | r=16–32, alpha=32–64, dropout=0.05 | r=32 if VRAM allows |
| `max_seq_len` | **384–512** (not 768+) | Shorter JSON = complete cards, less truncate |
| `per_device_train_batch_size` | 2 if fits else 1 | Raise until ~6 GB |
| `gradient_accumulation_steps` | 8–16 | Keep effective batch **16–32** |
| Optim | paged_adamw_8bit | Saves VRAM |
| Throughput ref | ~4.0–4.5 s/step @ seq 640, batch1×accum8 (prior run) | Seq 512 + batch2 → remeasure |

**Calibration hour (mandatory, ~1 h):**  
1. Load model 4-bit  
2. Increase batch until OOM, step back one  
3. Log `nvidia-smi` memory → aim **75% ±5%**  
4. Fix recipe before long run  

---

## 2) Huge datasets (business-relevant) — inclusion map

### Track A — Corpus (pattern-only; size OK to be huge)

| Dataset | Scale | How used | Cap after **quality filter** |
|---------|------:|----------|------------------------------|
| SocialGrep reddit jokes | 1M | comedy geometry | top score deciles, nsfw=false, not removed → **≤80k abstract** |
| SocialGrep questions | 1M | hooks / comment engines | score filter → **≤60k** |
| SocialGrep confessions | ~1M | relatability (strict safety) | heavy drop → **≤15k** |
| ctr4si/reddit_tifu | large | arc + TLDR | score/ups filter → **≤40k** |
| tskolm YT comments | 187k | reaction language | like-weighted → **≤40k** |
| IG captions (prakhars + optional kkcosmos **text only**) | 14k–30k | caption structure | abstract → **≤10k** |
| IG labeled comments | 83k | safety + comment | **≤20k** |
| tweet_eval | 201k | **safety/eval only** | never generation SFT |
| Book high_value craft JSONL | ~20 MB | analysis_only craft | full package |
| Existing pool | 57,596 examples | baseline | keep; additive |
| YouTube-Commons / TikTok-10M | multi-M | **metadata sample only** or **skip video** | optional ≤20k title/hook abstracts; **no video tensors** |

**Promoted corpus target after filters:** **~150k–250k** `viral_training_examples` (abstract), compile `2026-v11-large-secure`.

### Track B — GPU SFT (quality-bounded; not “as big as possible”)

| Source | Rows | Gate |
|--------|-----:|------|
| Synthetic short v2 cards (multi-category, multi-mechanism) | 40k–80k | ban=0, red-gate pass, complete JSON |
| Human/gold cards (expand) | 200–2k | human approve |
| High-quality adapted finalists that pass v2 gates | ≤5k | after re-sanitize |
| **Forbidden in SFT** | — | Raw HF text, SEO articles, incomplete JSON, banned phrases |

**SFT target:** **50k–80k** short cards (seq ≤512).  
Bigger than this on 1.5B rarely helps; often **hurts** diversity.

---

## 3) Quality non-degradation gates (kill switches)

Every phase must pass or **stop / rollback**:

| Gate | Fail if | Action |
|------|---------|--------|
| Hygiene | empty_pattern_rate > 2% | do not activate compile |
| Restricted rate | > 1.5% of examples | re-filter |
| Deep audit critical | any critical | stop |
| Gen eval (LoRA) | json_parse < 70% or hard_fail > 25% or mean_score < base | **delete adapter**, keep corpus |
| Ban rate in gen | > 5% | delete adapter |
| Field clone rate | > 30% | fix SFT, retrain |
| Stock sample (if restock) | v2 red-gate < 90% on 50 new cards | do not publish |

**Baseline freeze before start:**  
`npm run audit:training-deep` + `audit:idea-card-baseline` → `pre_v11_*.json`

---

## 4) Training architecture

```text
PHASE 0  Calibration GPU 75% + baselines           [~1 h]
PHASE 1  Mega HF prepare (abstract only)           [~4–8 h CPU/disk]
PHASE 2  DB train + compile 2026-v11-large-secure  [~2–4 h]
PHASE 3  Build short quality SFT 50–80k            [~2–4 h CPU]
PHASE 4  GPU QLoRA @ ~75% util                     [see hours below]
PHASE 5  Gen eval + deep audit + report            [~2–3 h]
PHASE 6  Optional: craft scorer + slug map         [~4–8 h eng, not GPU]
```

SEO paths stay **off**. Video tensors **off**.

---

## 5) GPU phase sizing → hours

Prior measurement: **~4.1 s/step**, effective batch **8**, seq **640**.  
With seq **512** + batch **2** × accum **8** (eff **16**), expect ~**3.5–5 s/step** (remeasure).

### Formula
`hours ≈ (num_examples × epochs / effective_batch × sec_per_step) / 3600`

### Scenarios (GPU train only)

| Scenario | SFT size | Epochs | Eff. batch | Steps | sec/step | **GPU train hours** |
|----------|---------:|-------:|-----------:|------:|---------:|--------------------:|
| **A Compact quality** | 40k | 2 | 16 | 5,000 | 4.0 | **~5.5–6.5 h** |
| **B Recommended** | 60k | 2 | 16 | 7,500 | 4.2 | **~8.5–10 h** |
| **C Large** | 80k | 2 | 16 | 10,000 | 4.5 | **~12–14 h** |
| **D Marathon (3B if fits)** | 60k | 2 | 8 | 15,000 | 6.0 | **~24–28 h** |

Plus non-GPU phases (prepare/compile/SFT build/eval): **+10–16 h** wall clock (can overnight CPU while you sleep; GPU only in Phase 4).

### Total wall-clock (recommended plan B)

| Block | Hours |
|-------|------:|
| Phase 0 calibrate + baseline | 1 |
| Phase 1 mega prepare | 6 |
| Phase 2 DB compile | 3 |
| Phase 3 SFT build + gate | 3 |
| Phase 4 GPU train | **9–10** |
| Phase 5 eval + report | 2 |
| **Buffer / re-runs** | 3 |
| **TOTAL** | **~27–30 hours** |

**If only asking “kaç saat GPU train?” → Recommended ~9–10 hours continuous GPU.**  
**Full pipeline end-to-end → ~1.5 day (~27–30 h), of which ~10 h is heavy GPU.**

Aggressive weekend: Phase 1–2 overnight CPU, Phase 4 next day full GPU.

---

## 6) Quality-safe SFT design (why v1 failed)

| v1 mistake | v11 fix |
|------------|---------|
| Long JSON, max_new 700 truncate | **Short card** target: 4 steps, tight fields, train seq 512 |
| Prompt format mismatch risk | **Chat template** identical at train + gen |
| Overfit low diversity templates | Mechanism × category grid, paraphrase slots |
| No mid-train gen check | Every **1k steps**: 5-card gen parse rate; abort if <50% |
| Loss-only success | Success = **gen eval**, not train_loss |

### Short card schema for SFT (token budget)
- title, conceptSummary, viewerTakeaway  
- 4 steps × (purpose, action, spokenLine, shot, times)  
- durationSeconds, requiredItems (≤4)  
- **Omit** huge legacy packs in SFT (caption_pack mega, etc.)

---

## 7) Runbook sketch

```powershell
# 0) Baseline
npm run audit:training-deep
npm run audit:idea-card-baseline

# 1) Huge HF prepare (abstract, secure filters already in prepare script)
# raise caps: max-scan 1M, max-rows-per-source 80000, promote filters score/nsfw

# 2) train-from-dataset → CompileVersion 2026-v11-large-secure

# 3) build short SFT 60k with red-gate filter
# python tools/build-secure-sft-idea-cards.py --count 60000 --short

# 4) Calibrate 75% GPU then long train
# python tools/train-lora-idea-card-secure.py --max-steps 7500 --max-seq 512 --batch 2 ...

# 5) Gen eval (must pass)
# python tools/eval-lora-idea-card-generation.py --n 10 --max-new-tokens 1200
# KEEP only if json_parse>=0.7 and mean_score > base
```

---

## 8) What improves product (vs pure GPU vanity)

| Investment | Product impact |
|------------|----------------|
| Large **filtered** corpus compile | Better mechanism ranking for generators |
| Scope slug map (comedy/fitness) | Correct profiles (hours, not GPU) |
| Craft scorer (no hash) | Better inventory after restock |
| Quality SFT + gen-passing LoRA | Optional offline card drafting |
| Raw mega SFT without gates | **Quality degrades** (v1 proved) |

**Best ROI order for “kalite bozulmasın”:**  
1) Scope map + craft scorer  
2) Large corpus compile v11  
3) GPU 9–10 h quality SFT LoRA with gen kill-switch  

---

## 9) Success criteria (end of large run)

| Metric | Pass |
|--------|------|
| Compile active | `2026-v11-large-secure` |
| Empty patterns | ≤ 1% |
| Restricted rate | ≤ 1.5% |
| Deep audit critical | 0 |
| GPU util during train | 70–80% VRAM (logged) |
| LoRA gen json_parse | ≥ 70% |
| LoRA gen mean_score | ≥ base + 10 **or** ≥ 55 absolute |
| Ban rate gen | ≤ 5% |
| Decision | adapter keep **or** explicit delete |

---

## 10) Direct answers

| Soru | Cevap |
|------|--------|
| Çok büyük dataset? | Evet — **Track A**’da milyon satır tarama; promote **filtrelenmiş abstract** |
| %75 GPU? | Evet — kalibrasyonla **~6 GB / 8 GB**, eff batch 16–32, 4-bit QLoRA |
| Kalite bozulmasın? | Kill-switch gen eval; raw social **asla** LoRA SFT’te; truncate-proof short cards |
| Kaç saat GPU train? | **Önerilen 9–10 saat** (60k×2 epoch). Compact 6h / Large 12–14h / 3B marathon 24h+ |
| Uçtan uca toplam? | **~27–30 saat** wall clock (CPU prepare + GPU + eval) |

---

## 11) Explicit non-goals

- Full fine-tune 7B+ on 8 GB  
- TikTok raw video training  
- SEO LoRA / `train-lora.py` SEO path  
- Unfiltered 1M jokes into generation weights  
- “More hours always better” without gen eval  

---

**Next implementation (when you say go):**  
(1) GPU 75% calibration script + short-SFT builder upgrade  
(2) Raised-cap secure HF prepare → v11 compile  
(3) 9–10 h QLoRA job + automated gen eval gate  
