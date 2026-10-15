"""
Secure LoRA generation eval for idea cards.

Compares base model vs LoRA adapter on short structured generation prompts.
Scores outputs with banned-phrase / meta / structure heuristics (no SEO path).

Usage:
  python tools/eval-lora-idea-card-generation.py
  python tools/eval-lora-idea-card-generation.py --adapter PATH --out PATH --n 8 --max-new-tokens 700
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import torch

ARCHIVE = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
DEFAULT_ADAPTER = ARCHIVE / "models" / "lora-idea-card-6h-secure"

BANNED = [
    "premium moment",
    "premium frame",
    "beauty moment",
    "fitness moment",
    "food moment",
    "proof detail",
    "carry the energy",
    "hidden decision",
    "stop the scroll",
    "game-changing",
    "elevate the content",
    "authentic impact",
    "let the proof carry",
    "here is the proof detail",
    "content moment",
    "seamless transition",
    "quality gate",
    "score_band",
    "vtp-",
    "training.compiled",
]

META = [
    "the creator should",
    "this video should",
    "the viewer will",
    "the audience will",
    "insert product",
    "insert category",
]


PROMPTS = [
    {
        "id": "beauty_01",
        "category": "beauty",
        "instruction": (
            "Write a shoot-ready short-form idea card as JSON only. "
            "schemaVersion 2, continuous timeline from 0, 4-5 steps, "
            "distinct Action vs Say this, no vague AI phrases, no scores. "
            "Category: beauty. Platform: Instagram Reels. "
            "Idea: keep-or-remove filter for a facial oil routine on a bathroom counter."
        ),
    },
    {
        "id": "comedy_01",
        "category": "comedy",
        "instruction": (
            "Write a shoot-ready short-form idea card as JSON only. "
            "schemaVersion 2, continuous timeline from 0, 4-5 steps, "
            "distinct Action vs Say this, no vague AI phrases, no scores. "
            "Category: comedy. Platform: Instagram Reels. "
            "Idea: bureaucratic form absurdity with a clipboard in a waiting room; safe target is the system not a person."
        ),
    },
    {
        "id": "travel_01",
        "category": "travel",
        "instruction": (
            "Write a shoot-ready short-form idea card as JSON only. "
            "schemaVersion 2, continuous timeline from 0, 4-5 steps, "
            "distinct Action vs Say this, no vague AI phrases, no scores. "
            "Category: travel. Platform: Instagram Reels. "
            "Idea: pack-or-leave filter at a hotel desk for a day bag."
        ),
    },
    {
        "id": "fitness_01",
        "category": "fitness",
        "instruction": (
            "Write a shoot-ready short-form idea card as JSON only. "
            "schemaVersion 2, continuous timeline from 0, 4-5 steps, "
            "distinct Action vs Say this, no vague AI phrases, no scores, no medical claims. "
            "Category: fitness. Platform: Instagram Reels. "
            "Idea: form check before increasing load with a resistance band at home."
        ),
    },
    {
        "id": "food_01",
        "category": "food",
        "instruction": (
            "Write a shoot-ready short-form idea card as JSON only. "
            "schemaVersion 2, continuous timeline from 0, 4-5 steps, "
            "distinct Action vs Say this, no vague AI phrases, no scores. "
            "Category: food. Platform: Instagram Reels. "
            "Idea: weeknight sauce keep-or-simplify on a stove."
        ),
    },
]


def extract_json_blob(text: str) -> dict | None:
    text = text.strip()
    # strip markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # find outermost object
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        return None
    blob = text[start : end + 1]
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        # light repair: trailing commas
        repaired = re.sub(r",\s*}", "}", blob)
        repaired = re.sub(r",\s*]", "]", repaired)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            return None


def score_output(raw: str, category: str) -> dict:
    lower = raw.lower()
    banned_hits = [b for b in BANNED if b in lower]
    meta_hits = [m for m in META if m in lower]
    obj = extract_json_blob(raw)
    structural = {
        "json_parsed": obj is not None,
        "schema_version_2": False,
        "steps_ge_3": False,
        "hook_first": False,
        "starts_at_0": False,
        "has_spoken": False,
        "has_action": False,
        "timeline_ok": False,
    }
    field_clone = False
    if obj:
        structural["schema_version_2"] = obj.get("schemaVersion") == 2 or str(obj.get("schemaVersion")) == "2"
        steps = obj.get("steps") or []
        if isinstance(steps, list):
            structural["steps_ge_3"] = len(steps) >= 3
            if steps:
                s0 = steps[0] if isinstance(steps[0], dict) else {}
                structural["hook_first"] = str(s0.get("stage", "")).lower() == "hook"
                structural["starts_at_0"] = s0.get("startSecond") in (0, "0")
            spoken_n = 0
            action_n = 0
            ends = []
            for i, st in enumerate(steps):
                if not isinstance(st, dict):
                    continue
                if st.get("spokenLine"):
                    spoken_n += 1
                if st.get("action"):
                    action_n += 1
                a = str(st.get("action") or "")
                s = str(st.get("spokenLine") or "")
                if a and s and a.strip().lower() == s.strip().lower() and len(a) > 12:
                    field_clone = True
                try:
                    ends.append((float(st.get("startSecond", -1)), float(st.get("endSecond", -1))))
                except (TypeError, ValueError):
                    pass
            structural["has_spoken"] = spoken_n >= 2
            structural["has_action"] = action_n >= 2
            ok_tl = True
            if ends:
                ends = sorted(ends, key=lambda x: x[0])
                if ends[0][0] != 0:
                    ok_tl = False
                for i in range(len(ends) - 1):
                    if ends[i][1] != ends[i + 1][0]:
                        ok_tl = False
                    if ends[i][1] <= ends[i][0]:
                        ok_tl = False
            structural["timeline_ok"] = ok_tl and len(ends) >= 3

    hard_fail = bool(banned_hits or meta_hits or not structural["json_parsed"])
    points = 0
    points += 25 if structural["json_parsed"] else 0
    points += 10 if structural["schema_version_2"] else 0
    points += 15 if structural["steps_ge_3"] else 0
    points += 10 if structural["hook_first"] else 0
    points += 10 if structural["starts_at_0"] else 0
    points += 10 if structural["timeline_ok"] else 0
    points += 10 if structural["has_action"] else 0
    points += 10 if structural["has_spoken"] else 0
    if field_clone:
        points -= 15
    points -= 20 * min(3, len(banned_hits))
    points -= 15 * min(2, len(meta_hits))
    points = max(0, min(100, points))
    if hard_fail:
        points = min(points, 45)

    return {
        "score": points,
        "hard_fail": hard_fail,
        "banned_hits": banned_hits,
        "meta_hits": meta_hits,
        "field_clone": field_clone,
        "structural": structural,
        "category": category,
        "raw_preview": raw[:500],
    }


def build_prompt(instruction: str) -> str:
    return (
        "### Instruction:\n"
        f"{instruction}\n\n"
        "### Input:\n"
        "Return JSON only.\n\n"
        "### Response:\n"
    )


@torch.inference_mode()
def generate_one(model, tokenizer, instruction: str, max_new_tokens: int) -> str:
    prompt = build_prompt(instruction)
    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    out = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        temperature=None,
        top_p=None,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
    )
    full = tokenizer.decode(out[0], skip_special_tokens=True)
    if "### Response:" in full:
        return full.split("### Response:", 1)[1].strip()
    return full[len(prompt) :].strip() if full.startswith(prompt[:40]) else full


def load_model(base: str, adapter: str | None, use_4bit: bool):
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

    tok = AutoTokenizer.from_pretrained(adapter or base, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    kwargs = {"trust_remote_code": True, "device_map": "auto"}
    if use_4bit:
        kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )
    else:
        kwargs["torch_dtype"] = torch.float16

    model = AutoModelForCausalLM.from_pretrained(base, **kwargs)
    if adapter:
        from peft import PeftModel

        model = PeftModel.from_pretrained(model, adapter)
    model.eval()
    return model, tok


def summarize(results: list[dict]) -> dict:
    if not results:
        return {"n": 0, "mean_score": 0, "hard_fail_rate": 1, "json_parse_rate": 0}
    n = len(results)
    return {
        "n": n,
        "mean_score": round(sum(r["score"] for r in results) / n, 2),
        "hard_fail_rate": round(sum(1 for r in results if r["hard_fail"]) / n, 4),
        "json_parse_rate": round(sum(1 for r in results if r["structural"]["json_parsed"]) / n, 4),
        "banned_any_rate": round(sum(1 for r in results if r["banned_hits"]) / n, 4),
        "meta_any_rate": round(sum(1 for r in results if r["meta_hits"]) / n, 4),
        "timeline_ok_rate": round(sum(1 for r in results if r["structural"]["timeline_ok"]) / n, 4),
        "hook_first_rate": round(sum(1 for r in results if r["structural"]["hook_first"]) / n, 4),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--adapter", default=str(DEFAULT_ADAPTER))
    ap.add_argument("--n", type=int, default=5, help="Number of prompts (max 5 built-in)")
    ap.add_argument("--max-new-tokens", type=int, default=650)
    ap.add_argument("--no-4bit", action="store_true")
    ap.add_argument("--skip-base", action="store_true")
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    if not torch.cuda.is_available():
        raise SystemExit("CUDA required for LoRA generation eval")

    prompts = PROMPTS[: max(1, min(args.n, len(PROMPTS)))]
    use_4bit = not args.no_4bit
    out_dir = Path(args.out) if args.out else ARCHIVE / "runs" / "lora_gen_eval"
    run_hint = Path(r"C:\Users\Kagan\AppData\Local\Temp\viralbox_6h_run_dir.txt")
    if not args.out and run_hint.exists():
        out_dir = Path(run_hint.read_text(encoding="utf-8").strip()) / "lora_gen_eval"
    out_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base": args.base,
        "adapter": args.adapter,
        "use_4bit": use_4bit,
        "prompts": [p["id"] for p in prompts],
        "base_results": [],
        "adapter_results": [],
        "base_summary": {},
        "adapter_summary": {},
        "verdict": {},
    }

    # Adapter first (primary)
    print("Loading ADAPTER model...", args.adapter)
    t0 = time.time()
    model_a, tok_a = load_model(args.base, args.adapter, use_4bit)
    print(f"Adapter loaded in {time.time()-t0:.1f}s")
    adapter_results = []
    for p in prompts:
        print("GEN adapter", p["id"])
        raw = generate_one(model_a, tok_a, p["instruction"], args.max_new_tokens)
        scored = score_output(raw, p["category"])
        scored["id"] = p["id"]
        scored["raw"] = raw
        adapter_results.append(scored)
        print("  score", scored["score"], "hard_fail", scored["hard_fail"], "json", scored["structural"]["json_parsed"])
    report["adapter_results"] = [{k: v for k, v in r.items() if k != "raw"} | {"raw_len": len(r["raw"])} for r in adapter_results]
    # keep full raw separately
    (out_dir / "adapter_generations.jsonl").write_text(
        "\n".join(json.dumps({"id": r["id"], "raw": r["raw"], "score": r["score"]}, ensure_ascii=False) for r in adapter_results),
        encoding="utf-8",
    )
    report["adapter_summary"] = summarize(adapter_results)
    del model_a
    torch.cuda.empty_cache()

    if not args.skip_base:
        print("Loading BASE model...", args.base)
        t0 = time.time()
        model_b, tok_b = load_model(args.base, None, use_4bit)
        print(f"Base loaded in {time.time()-t0:.1f}s")
        base_results = []
        for p in prompts:
            print("GEN base", p["id"])
            raw = generate_one(model_b, tok_b, p["instruction"], args.max_new_tokens)
            scored = score_output(raw, p["category"])
            scored["id"] = p["id"]
            scored["raw"] = raw
            base_results.append(scored)
            print("  score", scored["score"], "hard_fail", scored["hard_fail"], "json", scored["structural"]["json_parsed"])
        report["base_results"] = [{k: v for k, v in r.items() if k != "raw"} | {"raw_len": len(r["raw"])} for r in base_results]
        (out_dir / "base_generations.jsonl").write_text(
            "\n".join(json.dumps({"id": r["id"], "raw": r["raw"], "score": r["score"]}, ensure_ascii=False) for r in base_results),
            encoding="utf-8",
        )
        report["base_summary"] = summarize(base_results)
        del model_b
        torch.cuda.empty_cache()

    a = report["adapter_summary"]
    b = report.get("base_summary") or {}
    keep = (
        a.get("n", 0) > 0
        and a.get("hard_fail_rate", 1) <= 0.4
        and a.get("json_parse_rate", 0) >= 0.6
        and a.get("mean_score", 0) >= 55
        and a.get("banned_any_rate", 1) <= 0.2
    )
    better_than_base = True
    if b.get("n"):
        better_than_base = a.get("mean_score", 0) >= b.get("mean_score", 0) - 5
        keep = keep and better_than_base

    report["verdict"] = {
        "keep_adapter": keep,
        "better_than_base_or_close": better_than_base,
        "reason": (
            "Adapter meets secure gen thresholds"
            if keep
            else "Adapter failed secure gen thresholds — do not wire to production"
        ),
    }

    out_json = out_dir / "LORA_GEN_EVAL_latest.json"
    out_md = out_dir / "LORA_GEN_EVAL_latest.md"
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    md = [
        "# LoRA idea-card generation eval",
        "",
        f"- Generated: {report['generated_at']}",
        f"- Base: `{args.base}`",
        f"- Adapter: `{args.adapter}`",
        f"- Keep adapter: **{keep}**",
        "",
        "## Summaries",
        "",
        f"- Adapter: {json.dumps(a)}",
        f"- Base: {json.dumps(b) if b else 'skipped'}",
        "",
        "## Per-prompt adapter scores",
        "",
    ]
    for r in report["adapter_results"]:
        md.append(
            f"- `{r['id']}` score={r['score']} hard_fail={r['hard_fail']} "
            f"json={r['structural']['json_parsed']} banned={r['banned_hits']}"
        )
    md.append("")
    md.append(f"JSON: `{out_json}`")
    out_md.write_text("\n".join(md), encoding="utf-8")

    print(json.dumps({"adapter_summary": a, "base_summary": b, "verdict": report["verdict"], "out": str(out_json)}, indent=2))
    raise SystemExit(0 if keep else 2)


if __name__ == "__main__":
    main()
