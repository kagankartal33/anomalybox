"""Compatibility entry point. Repeated template cards are no longer training data.

Uses the local TypeScript compiler and production quality gate; never downloads
tsx, generates filler examples, or touches old training archives.
"""
from pathlib import Path
import subprocess
import sys


def main():
    root = Path(__file__).resolve().parents[1]
    cli = root / "node_modules" / "tsx" / "dist" / "cli.mjs"
    if not cli.is_file():
        raise SystemExit("Local tsx dependency missing; install the project's locked dependencies first.")
    if any(flag in sys.argv for flag in ("--count", "--short", "--seed")):
        raise SystemExit("Template multiplication is disabled. Use --input VERIFIED_RECORDS --out NEW_DIRECTORY; --help describes the contract.")
    return subprocess.run(["node", str(cli), str(root / "tools" / "build-card-training.ts"), *sys.argv[1:]], cwd=root, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
