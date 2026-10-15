"""Response-only card QLoRA. Never uses SEO data or silently truncates targets.

Requires a current, ready dataset from build-card-training.ts. All artifacts stay
local. No GPU/model download is started by --audit-data; model training still
requires explicit invocation and an independently qualified inference profile.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
from pathlib import Path

from card_sft_data import load_verified_dataset, encode_response_only, pad_response_batch, configure_training_cache, training_time_limit_callback


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", required=True, help="Verified dataset DIRECTORY containing manifest.json")
    parser.add_argument("--out", help="New adapter directory; existing adapters are never overwritten")
    parser.add_argument("--model", default="Qwen/Qwen2.5-1.5B-Instruct")
    parser.add_argument("--revision", help="Pinned 40-character base-model commit (required for training)")
    parser.add_argument("--max-minutes", type=float, default=70)
    parser.add_argument("--max-steps", type=int, default=-1)
    parser.add_argument("--max-seq", type=int, default=4096)
    parser.add_argument("--batch", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--epochs", type=float, default=1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--audit-data", action="store_true", help="Verify hashes and split boundaries without importing ML libraries")
    parser.add_argument("--preflight-only", action="store_true", help="Also tokenize with the cached tokenizer; no GPU or model weights")
    parser.add_argument("--allow-download", action="store_true", help="Explicitly allow fetching the pinned base model")
    parser.add_argument("--cache-dir", default=str(Path(__file__).resolve().parents[1] / ".cache" / "card-training"), help="Process-local compiler cache, independent of external-drive environment settings")
    parser.add_argument("--fp16", action="store_true", help="Explicit non-quantized LoRA; never silently fallback after QLoRA failure")
    args = parser.parse_args()
    if args.max_minutes <= 0 or args.max_seq < 1 or args.batch < 1 or args.grad_accum < 1 or args.lr <= 0 or args.epochs <= 0 or (args.max_steps != -1 and args.max_steps < 1):
        parser.error("Training limits must be positive")
    data_path = Path(args.data).resolve()
    manifest, splits = load_verified_dataset(data_path)
    if args.audit_data:
        print(json.dumps({"data_integrity_passed": True, "split_counts": manifest["split_counts"], "model_qualified": False}, indent=2))
        return
    import re
    if not args.revision or not re.fullmatch(r"[a-f0-9]{40}", args.revision):
        parser.error("--revision must pin a full base-model commit")
    if not args.preflight_only and not args.out:
        parser.error("--out NEW_DIRECTORY is required for training")

    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")
    configure_training_cache(Path(args.cache_dir))
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model, revision=args.revision, trust_remote_code=False, local_files_only=not args.allow_download)
    if tokenizer.pad_token_id is None:
        if tokenizer.eos_token_id is None:
            raise ValueError("Tokenizer requires a pad or EOS token")
        tokenizer.pad_token = tokenizer.eos_token

    # Validate every full target before allocating model weights. Do not skip or
    # truncate long cards: doing so silently biases the curriculum toward short ones.
    encoded = {name: [encode_response_only(row, tokenizer, args.max_seq) for row in rows] for name, rows in splits.items()}
    lengths = {name: max(len(row["input_ids"]) for row in rows) for name, rows in encoded.items()}
    if args.preflight_only:
        print(json.dumps({"tokenization_passed": True, "maximum_tokens": lengths, "model_qualified": False}, indent=2))
        return
    import torch
    if not torch.cuda.is_available():
        raise ValueError("CUDA required for card QLoRA training")
    from transformers import AutoModelForCausalLM, BitsAndBytesConfig, Trainer, TrainingArguments, TrainerCallback, set_seed
    from peft import LoraConfig, TaskType, get_peft_model, prepare_model_for_kbit_training
    set_seed(args.seed)
    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=False, exist_ok=False)

    model_kwargs = {"revision": args.revision, "trust_remote_code": False, "local_files_only": not args.allow_download, "device_map": {"": torch.cuda.current_device()}}
    if args.fp16:
        model_kwargs["torch_dtype"] = torch.float16
    else:
        model_kwargs["quantization_config"] = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16, bnb_4bit_use_double_quant=True, bnb_4bit_quant_type="nf4")
    model = AutoModelForCausalLM.from_pretrained(args.model, **model_kwargs)
    model.config.use_cache = False
    if not args.fp16:
        model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)
    else:
        model.enable_input_require_grads()
    model = get_peft_model(model, LoraConfig(task_type=TaskType.CAUSAL_LM, r=16, lora_alpha=32, lora_dropout=0.05, target_modules="all-linear"))

    class ResponseCollator:
        def __call__(self, features):
            batch = pad_response_batch(features, tokenizer.pad_token_id)
            return {key: torch.tensor(value, dtype=torch.long) for key, value in batch.items()}

    timer = training_time_limit_callback(TrainerCallback, args.max_minutes)
    training_args = TrainingArguments(
        output_dir=str(out_dir / "checkpoints"),
        per_device_train_batch_size=args.batch, per_device_eval_batch_size=1,
        gradient_accumulation_steps=args.grad_accum, learning_rate=args.lr,
        num_train_epochs=args.epochs, max_steps=args.max_steps, seed=args.seed, data_seed=args.seed,
        logging_steps=10, eval_strategy="epoch", save_strategy="epoch", save_total_limit=2,
        load_best_model_at_end=True, metric_for_best_model="eval_loss", greater_is_better=False,
        fp16=True, bf16=False, gradient_checkpointing=True,
        optim="adamw_torch" if args.fp16 else "paged_adamw_8bit", report_to=[],
        remove_unused_columns=False, dataloader_pin_memory=True,
    )
    trainer = Trainer(model=model, args=training_args, train_dataset=encoded["train"], eval_dataset=encoded["validation"], data_collator=ResponseCollator(), callbacks=[timer])
    started = time.monotonic()
    trainer.train()
    validation_metrics = trainer.evaluate()
    # Frozen test targets are integrity/tokenization checked but are never used
    # for gradient updates, early stopping or checkpoint selection.
    model.save_pretrained(out_dir)
    tokenizer.save_pretrained(out_dir)
    meta = {
        "model": args.model, "revision": args.revision, "quantized": not args.fp16,
        "seed": args.seed, "max_seq": args.max_seq, "maximum_tokens": lengths,
        "steps": trainer.state.global_step, "time_limit_reached": timer.stopped,
        "minutes": round((time.monotonic() - started) / 60, 2),
        "dataset_manifest_hash": hashlib.sha256((data_path / "manifest.json").read_bytes()).hexdigest(),
        "prompt_version": manifest["prompt_version"], "curriculum_version": manifest["curriculum_version"],
        "loss": "assistant_tokens_only", "padding_labels": -100, "truncation": False,
        "validation_metrics": validation_metrics, "pipeline": "idea_card_only",
        "model_qualified": False, "next_gate": "independent generation qualification on frozen briefs",
    }
    (out_dir / "train_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
