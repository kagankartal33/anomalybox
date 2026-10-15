# Idea Card Only — Large Dataset Training Plan

> Historical plan, superseded by [card-training-v2.md](card-training-v2.md). Do not execute the 60k template multiplication or 512-token training commands below. Prior dataset/adapter reports are not current model qualification.

**Scope:** Viral **idea cards** only.  
**Out of scope:** SEO / `content/resources`, `seo_content/*`, SEO LoRA, public articles.

**Hardware:** RTX 5060 Laptop ~8 GB · target **~70–80% VRAM** on GPU phases.  
**Quality bar:** Must not degrade vs active `2026-v10-6h-secure` (deep audit + gates).  
**Separation:** Never write SEO paths; never load SEO observations into this run.

---

## 1) Goal

1. **Track A — Corpus:** Scale pattern-only training from large public datasets → compile `2026-v11-idea-card`.  
2. **Track B — GPU:** Quality-gated short idea-card SFT + QLoRA (~75% GPU), **gen-eval kill switch**.  
3. **Track C — Product wiring (non-GPU):** scope slug map + craft scorer so new stock uses the profile correctly.

Creator cards must never receive: raw Reddit/YT/IG text, VTP ids, scores, training provenance.

---

## 2) Two-track model (do not merge)

```text
HUGE PUBLIC DATASETS
        │
        ▼  abstract / pattern_only / safety filters
TRACK A: viral_training_* + compile 2026-v11-idea-card
        │
        │  (signals only)
        ▼
TRACK B: synthetic + gold SHORT idea_card JSON  →  QLoRA on GPU
        │
        ▼
gen eval → KEEP adapter or DELETE
```

| | Track A Corpus | Track B GPU LoRA |
|--|----------------|------------------|
| Data size | Very large (millions scanned) | Bounded (50–80k quality cards) |
| Content | Abstract hashes + VTP flags | Full short card JSON |
| Raw jokes/comments | **Never stored as surface** | **Forbidden** |
| Success metric | Hygiene + profile coverage | JSON parse ≥70%, score ≥ base |

---

## 3) Large datasets for idea cards

### 3.1 Primary (must use) — Hugging Face P0

| Dataset | Scale | Idea-card use | Promote after filter (target) |
|---------|------:|---------------|-------------------------------:|
| [SocialGrep/one-million-reddit-jokes](https://huggingface.co/datasets/SocialGrep/one-million-reddit-jokes) | 1M | Comedy setup/payoff geometry | ≤ 80k abstract |
| [SocialGrep/one-million-reddit-questions](https://huggingface.co/datasets/SocialGrep/one-million-reddit-questions) | 1M | Hook / poll / comment questions | ≤ 60k |
| [SocialGrep/one-million-reddit-confessions](https://huggingface.co/datasets/SocialGrep/one-million-reddit-confessions) | ~1M | Relatable confession structure (strict safety) | ≤ 15k |
| [ctr4si/reddit_tifu](https://huggingface.co/datasets/ctr4si/reddit_tifu) | 100k–1M | Story arc + TLDR/payoff | ≤ 40k |
| [tskolm/youtube_top_popular_videos_comments](https://huggingface.co/datasets/tskolm/youtube_top_popular_videos_comments) | 187k | Comment engine / reaction | ≤ 40k |

**Filters (all P0):** nsfw drop, `[removed]`/`[deleted]` drop, score/engagement floor, restricted lexicon drop, PII strip, `training_use=pattern_only`, `copy_risk=high`, no title/body in stored abstract.

### 3.2 Secondary (should use) — HF P1

| Dataset | Scale | Idea-card use | Promote target |
|---------|------:|---------------|----------------:|
| [prakhars/instagram_captions](https://huggingface.co/datasets/prakhars/instagram_captions) | 14k | Caption structure patterns | ≤ 8k abstract |
| [kkcosmos/instagram-images-with-captions](https://huggingface.co/datasets/kkcosmos/instagram-images-with-captions) | 31k | **Caption text only** (no image train) | ≤ 8k abstract |
| [databoks-irfan/labeled-instagram-comments](https://huggingface.co/datasets/databoks-irfan/labeled-instagram-comments) | 83k | Comment quality/safety | ≤ 20k |
| [cardiffnlp/tweet_eval](https://huggingface.co/datasets/cardiffnlp/tweet_eval) | 201k | hate/offensive/irony/emotion → **eval_only / filter** | ≤ 5k eval_only |
| [underscore2/bluesky_engagement_posts_kto](https://huggingface.co/datasets/underscore2/bluesky_engagement_posts_kto) | 12k | Engagement preference aux | ≤ 5k low weight |
| [bhavyagiri/semantic-memes](https://huggingface.co/datasets/bhavyagiri/semantic-memes) | 5.8k | Meme geometry (no surface paste) | ≤ 3k |

### 3.3 Local / already owned (must re-use)

| Source | Path / note | Use |
|--------|-------------|-----|
| Current secure compile | `2026-v10-6h-secure` pool (~57k examples) | Baseline keep + merge |
| HF prepared 6h | `.../huggingface/prepared_6h_secure/` (~183k abstract lines) | Re-filter into v11 or expand scan |
| Book high-value craft | `.../book_train/prepared/high_value_from_book/` | analysis_only cinema/story craft |
| Real viral seeds | `supabase/seeds/real_viral_examples.sql` | pattern_only documented virals |
| Platform 2026 | `supabase/seeds/current_platform_research_2026.sql` | Reels/originality/commerce mechanisms |
| VTP taxonomy | VTP-001…040 | Affinity IDs |
| Comedy refs | book package `references/` | **prompt/eval only**, not LoRA text |
| Gold / fixtures | `docs/training/fixtures`, archive gold | SFT + human eval |

### 3.4 Optional large (careful)

| Dataset | Scale | Use | Cap |
|---------|------:|-----|-----|
| [l3afai/youtube-thumbnails](https://huggingface.co/datasets/l3afai/youtube-thumbnails) | ~160k | Title/first-frame **metadata** only | ≤ 15k abstract |
| [PleIAs/YouTube-Commons](https://huggingface.co/datasets/PleIAs/YouTube-Commons) | very large | Sample transcripts → speech rhythm abstract | ≤ 20k abstract |
| TikTok-10M class datasets | multi-M | **Metadata only** if ever; **no video** | ≤ 10k or skip |

### 3.5 Never for idea-card train

| Forbidden | Why |
|-----------|-----|
| `dataset/seo_content/*`, SEO books, SCR rules | Wrong pipeline |
| `tools/train-lora.py` SEO path | Contaminates cards |
| Raw joke/confession/comment **bodies in LoRA SFT** | Gen quality collapse + copy risk |
| TikTok/YouTube **video tensors** | VRAM, policy, pipeline off |
| Unfiltered full 1M jokes into generation weights | Toxicity + noise |
| Celebrity/name surface, political rant dumps | Brand safety |

---

## 4) Volume targets (v11)

| Stream | Target |
|--------|--------|
| HF abstract observations prepared | 200k–400k lines scanned/promoted candidates |
| `viral_training_examples` after merge | **120k–200k** (from ~57k baseline) |
| Affinity: all 40 VTP covered | yes |
| Pilot exact scopes | beauty, entertainment_comedy, travel, food, fashion, fitness_wellness_safe |
| GPU SFT short cards | **50k–80k** red-gate clean |
| Eval cases | ≥ 250 idea-card (keep existing 818 where valid) |

---

## 5) GPU recipe (~75% util)

| Setting | Value |
|---------|--------|
| Base | `Qwen/Qwen2.5-1.5B-Instruct` (3B only if calibrate ≤6.5 GB) |
| Quant | 4-bit NF4 QLoRA |
| LoRA | r=16–32, alpha=2×r, dropout=0.05 |
| max_seq | **384–512** (short cards) |
| batch × accum | raise until **~6 GB / 8 GB** (eff batch 16–32) |
| Success | **Gen eval**, not train_loss |

**Calibration:** 1 hour before long job; log `nvidia-smi`.

---

## 6) Schedule & hours

### Phase table

| Phase | Work | Wall time | GPU? |
|------:|------|----------:|:----:|
| 0 | Baseline freeze (deep audit + card baseline) | 1 h | no |
| 1 | GPU 75% calibration | 1 h | yes light |
| 2 | Mega HF download gaps + secure prepare | 6–8 h | no |
| 3 | DB train-from-dataset + compile `2026-v11-idea-card` | 2–4 h | no |
| 4 | Hygiene + deep audit gate | 1 h | no |
| 5 | Build short quality SFT 50–80k | 2–4 h | no |
| 6 | **QLoRA train** | **9–10 h** (rec.) | **yes ~75%** |
| 7 | LoRA gen eval (10 prompts, max_new≥1200) | 2–3 h | yes |
| 8 | Report + keep/delete adapter | 1 h | no |
| | **Total wall-clock** | **~25–33 h** | |
| | **Heavy GPU only (phase 6)** | **~9–10 h** | |

### GPU-only scenarios

| | SFT | Epochs | GPU hours |
|--|-----|-------:|----------:|
| Compact | 40k | 2 | ~6–7 h |
| **Recommended** | **60k** | **2** | **~9–10 h** |
| Large | 80k | 2 | ~12–14 h |

*(Based on prior ~4 s/step on this GPU; remeasure after batch tune.)*

### Parallelism
- Phase 2 overnight CPU while idle.  
- Phase 6 full day/night GPU.  
- Phase 7 must pass before any wire.

---

## 7) Quality kill switches (non-negotiable)

| Gate | Fail action |
|------|-------------|
| empty_pattern_rate > 2% | do not enable compile |
| restricted_rate > 1.5% | re-filter |
| Deep audit **critical** | stop |
| Gen json_parse < 70% | **delete adapter** |
| Gen hard_fail > 25% | **delete adapter** |
| Gen mean_score < base − 5 | **delete adapter** |
| Ban rate gen > 5% | **delete adapter** |
| SEO path write detected | abort run |

Corpus remains; only bad LoRA is discarded (same policy as v1 fail).

---

## 8) Product-side companions (same program, not SEO)

Do in parallel or immediately after compile (low hours, high ROI):

1. **Slug map:** `comedy`→`entertainment_comedy`, `fitness`→`fitness_wellness_safe`  
2. **Craft scorer:** remove hash lottery in `scoreCandidate`  
3. **Pilot restock** only after gates green (beauty, entertainment_comedy, travel, food, fashion)

These are idea-card product; still **not** content training.

---

## 9) Tools to use / extend

| Tool | Role |
|------|------|
| `tools/download-huggingface-datasets.ps1` | P0+P1 raw |
| `tools/prepare-downloaded-hf-training-data.py` | Secure abstract (already hardened) |
| `tools/prepare-and-train-downloaded-hf.ps1` / `train-from-dataset.ps1` | Promote + compile |
| `tools/build-secure-sft-idea-cards.py` | Extend → short cards, 60k |
| `tools/train-lora-idea-card-secure.py` | GPU QLoRA |
| `tools/eval-lora-idea-card-generation.py` | Keep/delete gate |
| `tools/audit-training-deep.ps1` | Corpus health |
| `tools/audit-viral-training-hygiene.ps1` | Empty/restricted |
| **Do not use** | `train-lora.py` (SEO), `train-seo-content.ps1`, resource generators |

**Compile version:** `2026-v11-idea-card`  
**Source slug example:** `hf_idea_card_large_v1`  
**LoRA out:** `ViralBox-training-archive/models/lora-idea-card-v11/`  
**Run dir:** `ViralBox-training-archive/runs/idea_card_v11_YYYYMMDD/`

---

## 10) Deliverables

1. Active compile `2026-v11-idea-card`  
2. Deep audit JSON/MD (pass critical)  
3. SFT manifest + LoRA adapter **or** explicit delete log  
4. Gen eval report (must document keep/delete)  
5. `docs/training/RUN_IDEA_CARD_V11_*.md`  

---

## 11) Success checklist

- [ ] No SEO files written  
- [ ] HF abstracts only (no surface fields in examples)  
- [ ] 40/40 VTP in affinity  
- [ ] beauty / entertainment_comedy / travel / food exact or strong scopes  
- [ ] GPU util logged ~75% during Phase 6  
- [ ] Gen eval pass **or** adapter deleted  
- [ ] Quality ≥ pre-run deep audit on critical metrics  

---

## 12) Direct answers

| Question | Answer |
|----------|--------|
| Content + idea card together? | **No — idea card only** |
| Huge datasets? | Yes — list in §3 (P0/P1 HF + local seeds/book) |
| GPU hours? | **~9–10 h** recommended train |
| Full pipeline hours? | **~25–33 h** wall-clock |
| Quality protected how? | Pattern-only corpus + short SFT + gen kill switch |

---

**When you say go:** implement Phase 0–1 (baseline + GPU calibrate), then mega prepare → v11 compile → 60k short SFT → 9–10 h QLoRA → gen eval.
