"""
Calibrate QLoRA batch size for ~75% VRAM on idea-card training GPU.

Usage:
  python tools/calibrate-gpu-idea-card.py
  python tools/calibrate-gpu-idea-card.py --model Qwen/Qwen2.5-1.5B-Instruct --target-util 0.75
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import torch


def vram_gb() -> float:
    return torch.cuda.memory_allocated() / (1024**3)


def vram_reserved_gb() -> float:
    return torch.cuda.memory_reserved() / (1024**3)


def total_gb() -> float:
    return torch.cuda.get_device_properties(0).total_memory / (1024**3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--target-util", type=float, default=0.75)
    ap.add_argument("--max-seq", type=int, default=512)
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    if not torch.cuda.is_available():
        raise SystemExit("CUDA required")

    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, TaskType, get_peft_model

    total = total_gb()
    target = total * args.target_util
    print(f"GPU: {torch.cuda.get_device_name(0)} total={total:.2f}GB target~{target:.2f}GB ({args.target_util*100:.0f}%)")

    tok = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        quantization_config=bnb,
        device_map="auto",
        trust_remote_code=True,
    )
    lora = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )
    try:
        model = get_peft_model(model, lora)
    except Exception:
        model = get_peft_model(model, LoraConfig(task_type=TaskType.CAUSAL_LM, r=16, lora_alpha=32, lora_dropout=0.05))
    model.train()

    base_alloc = vram_gb()
    print(f"After load allocated={base_alloc:.2f}GB reserved={vram_reserved_gb():.2f}GB")

    # Longer dummy ≈ full short idea-card JSON response for realistic VRAM.
    dummy = (
        "### Instruction:\nWrite a short idea card JSON for entertainment_comedy Instagram Reels.\n\n"
        "### Response:\n"
        + json.dumps(
            {
                "title": "x" * 40,
                "hook": "y" * 80,
                "beats": ["a" * 60, "b" * 60, "c" * 60, "d" * 60],
                "spoken": ["s" * 50] * 4,
                "cta": "z" * 40,
            }
        )
        * 3
    )
    results = []
    best: dict = {"batch": 1, "util": base_alloc / total}
    # Sweep until OOM or high util; 1.5B QLoRA often needs batch 8–24 for ~75% on 8GB.
    batch_candidates = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32]

    for batch in batch_candidates:
        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats()
        try:
            enc = tok(
                [dummy] * batch,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=args.max_seq,
            )
            enc = {k: v.to(model.device) for k, v in enc.items()}
            enc["labels"] = enc["input_ids"].clone()
            t0 = time.time()
            out = model(**enc)
            loss = out.loss
            loss.backward()
            model.zero_grad(set_to_none=True)
            elapsed = time.time() - t0
            peak = torch.cuda.max_memory_allocated() / (1024**3)
            util = peak / total
            row = {
                "batch": batch,
                "peak_alloc_gb": round(peak, 3),
                "util": round(util, 4),
                "step_sec": round(elapsed, 3),
                "ok": True,
            }
            print(f"batch={batch} peak={peak:.2f}GB util={util*100:.1f}% step={elapsed:.2f}s", flush=True)
            results.append(row)
            # Prefer highest util that stays under target+8% and hard cap 90%.
            if util <= 0.90 and util > best.get("util", 0):
                best = {"batch": batch, "util": util, "peak_alloc_gb": peak, "step_sec": elapsed}
            if util >= args.target_util + 0.05:
                # close enough / slightly over — stop climbing
                break
        except torch.cuda.OutOfMemoryError:
            print(f"batch={batch} OOM", flush=True)
            results.append({"batch": batch, "ok": False, "error": "OOM"})
            torch.cuda.empty_cache()
            break
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                print(f"batch={batch} OOM", flush=True)
                results.append({"batch": batch, "ok": False, "error": "OOM"})
                torch.cuda.empty_cache()
                break
            raise

    # recommended accum to keep eff batch ~16-32
    b = int(best.get("batch", 1))
    target_eff = 32 if b <= 8 else 48
    accum = max(1, target_eff // b)
    # if still under 60% util, note higher batch preferred for trainer
    note = ""
    if float(best.get("util", 0)) < 0.55:
        note = "under_target_util; try larger batch or longer max_seq in trainer"
    recipe = {
        "model": args.model,
        "max_seq": args.max_seq,
        "per_device_train_batch_size": b,
        "gradient_accumulation_steps": accum,
        "effective_batch": b * accum,
        "target_util": args.target_util,
        "measured_util": round(float(best.get("util", 0)), 4),
        "peak_alloc_gb": best.get("peak_alloc_gb"),
        "step_sec_estimate": best.get("step_sec"),
        "lora_r": 16,
        "use_4bit": True,
        "results": results,
        "gpu": torch.cuda.get_device_name(0),
        "total_vram_gb": round(total, 2),
        "note": note or "ok",
        # wall ≈ samples * epochs * microbatch_sec / per_device_batch
        # (grad accum does not reduce total microbatches)
        "est_hours_60k_2epoch": round(
            (60000 * 2 * float(best.get("step_sec") or 1.0) / max(1, b)) / 3600, 2
        ),
        "est_note": "rough; real trainer overhead/packing may differ ±30%",
    }

    out = Path(args.out) if args.out else Path("docs/training/GPU_CALIBRATION_idea_card_latest.json")
    run_hint = Path(r"C:\Users\Kagan\AppData\Local\Temp\viralbox_idea_v11_run_dir.txt")
    if not args.out and run_hint.exists():
        out = Path(run_hint.read_text(encoding="utf-8").strip()) / "GPU_CALIBRATION_idea_card.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(recipe, indent=2), encoding="utf-8")
    print(json.dumps(recipe, indent=2))
    print("Wrote", out)


if __name__ == "__main__":
    main()
