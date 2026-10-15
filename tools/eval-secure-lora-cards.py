"""Legacy entry point for actual held-out generation evaluation, not file checks."""
from pathlib import Path
import subprocess
import sys


def main():
    root = Path(__file__).resolve().parents[1]
    if any(flag in sys.argv for flag in ("--sft", "--adapter", "--min-pass-rate")):
        print("A clean SFT file or existing adapter is not model-quality evidence. Use --dataset DIRECTORY --samples GENERATED_JSONL. For data-only integrity use train-lora-idea-card-secure.py --data DIRECTORY --audit-data.", file=sys.stderr)
        return 2
    cli = root / "node_modules" / "tsx" / "dist" / "cli.mjs"
    if not cli.is_file():
        print("Local tsx dependency missing.", file=sys.stderr)
        return 2
    return subprocess.run(["node", str(cli), str(root / "tools" / "eval-card-training.ts"), *sys.argv[1:]], cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
