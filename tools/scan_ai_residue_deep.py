"""
Ultra-Granular Comprehensive AI Residue & Slop Scanner.
Scans content, app, components, lib, and docs.
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")

PATTERNS = {
    "Classic AI Tropes & Slop Openers": [
        (r"\bin today's (?:fast-paced|digital|modern|rapidly|ever-changing|competitive|world)\b", "in today's ... world"),
        (r"\bin the digital age\b|\bin the modern era\b", "in the digital age / modern era"),
        (r"\bas we navigate\b|\bin an era where\b", "as we navigate / in an era where"),
        (r"\blook no further\b", "look no further"),
        (r"\bwithout further ado\b", "without further ado"),
        (r"\bit's no secret that\b|\bit is no secret that\b", "it's no secret that"),
        (r"\btestament to\b", "testament to"),
        (r"\btapestry of\b|\brich tapestry\b", "tapestry"),
    ],
    "AI Buzzwords & Superlatives": [
        (r"\bgame-changer\b|\bgame changer\b|\bgamechanger\b", "game-changer"),
        (r"\bunleash (?:your|the)\b", "unleash your/the"),
        (r"\bdelve (?:into|deep)\b|\bdelving\b", "delve into"),
        (r"\bdive deep (?:into)?\b|\bdeep dive\b", "dive deep"),
        (r"\belevate (?:your|the)\b", "elevate your/the"),
        (r"\bharness (?:the power of|your)\b|\bharnessing the\b", "harness the power of"),
        (r"\bunlock (?:your|the) (?:full )?potential\b|\bunlocking your\b", "unlock your potential"),
        (r"\bsupercharge (?:your|the)\b", "supercharge"),
        (r"\bskyrocket (?:your|the)?\b", "skyrocket"),
        (r"\bcutting-edge\b|\bstate-of-the-art\b", "cutting-edge / state-of-the-art"),
        (r"\bparadigm shift\b", "paradigm shift"),
        (r"\bsynergy\b|\bsynergistic\b", "synergy"),
        (r"\bseamlessly (?:integrate|blend|transition|connect|flow)\b", "seamlessly integrate/transition"),
        (r"\bholistic approach\b", "holistic approach"),
        (r"\brobust (?:system|framework|solution|strategy|methodology)\b", "robust system/framework"),
        (r"\bmeticulously (?:crafted|designed|planned|curated)\b", "meticulously crafted"),
        (r"\bparamount importance\b|\bplays a pivotal role\b|\bplays a crucial role\b", "paramount / pivotal role"),
    ],
    "Banned Vague / Vibe Phrases (Rule Enforcement)": [
        (r"\bpremium moment\b|\bpremium frame\b", "premium moment/frame"),
        (r"\bbeauty moment\b|\bfitness moment\b|\bfood moment\b", "beauty/fitness/food moment"),
        (r"\bproof detail\b", "proof detail"),
        (r"\bcarry the energy\b", "carry the energy"),
        (r"\bauthentic impact\b|\bstrategic authenticity\b", "authentic impact / strategic authenticity"),
        (r"\bpolished storytelling\b|\bpolished energy\b", "polished storytelling / energy"),
        (r"\bstop the scroll\b", "stop the scroll"),
        (r"\beffortless engagement\b", "effortless engagement"),
        (r"\bauthentic connection\b", "authentic connection"),
        (r"\bvisual journey\b", "visual journey"),
        (r"\benerjik ol\b|\bheyecanla anlat\b|\bkameraya gül\b", "Turkish vague direction (enerjik ol vb.)"),
        (r"\bact natural\b|\bshow emotion\b|\btalk excitedly\b", "vague performance directions"),
    ],
    "Meta Dialogue & Unfilled Placeholders": [
        (r"\bthe creator should\b", "the creator should"),
        (r"\bthe creator says\b", "the creator says"),
        (r"\bthe audience will see\b", "the audience will see"),
        (r"\bthis video should\b", "this video should"),
        (r"\[insert\b|\[your\b|\[brand name\]|\[product name\]", "unfilled placeholder [insert / your]"),
        (r"\blorem ipsum\b", "lorem ipsum"),
        (r"\binsert product name\b|\binsert category\b", "insert placeholder"),
    ],
    "Generic CTAs & Engagement Bait": [
        (r"\bwhat do you think\?\b", "what do you think?"),
        (r"\blet me know (?:in the comments|below)\b", "let me know below"),
        (r"\bfollow for more\b", "follow for more"),
        (r"\bsave this for later\b", "save this for later"),
        (r"\btag a friend\b", "tag a friend"),
        (r"\bdrop a comment below\b|\bleave a comment below\b", "drop a comment below"),
        (r"\bsmash that like button\b", "smash that like button"),
    ],
    "Turkish AI Slop / Generic Calques": [
        (r"\bgünümüzün hızlı tempolu\b|\bdijital çağda\b|\bgünümüz dünyasında\b", "günümüz dünyasında / dijital çağda"),
        (r"\boyun değiştirici\b", "oyun değiştirici"),
        (r"\bpotansiyelinizi açığa çıkarın\b", "potansiyelinizi açığa çıkarın"),
        (r"\bson teknoloji\b", "son teknoloji"),
        (r"\bkesintisiz bir şekilde\b|\bkusursuz bir şekilde\b", "kesintisiz / kusursuz"),
    ]
}

TARGET_DIRS = [
    ROOT / "content",
    ROOT / "app",
    ROOT / "components",
    ROOT / "lib",
]

EXTENSIONS = {".md", ".tsx", ".ts", ".jsx", ".js", ".json"}
EXCLUDES = {
    "node_modules", ".next", ".git", "tools", "scan_ai_residue",
    "banned-phrases.ts", "ai-residue.ts", "check_story_spine.mjs",
    "scan_ai_residue_deep.py", "ai_residue_report.txt", "ai_residue_scan_results.json"
}

def scan():
    findings = defaultdict(list)
    file_count = 0
    match_count = 0

    for target_dir in TARGET_DIRS:
        if not target_dir.exists():
            continue
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDES and not d.startswith(".")]
            for file in files:
                file_path = Path(root) / file
                if file_path.name in EXCLUDES or file_path.suffix not in EXTENSIONS:
                    continue
                if any(ex in file_path.parts for ex in EXCLUDES):
                    continue
                
                try:
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue

                file_count += 1
                lines = content.splitlines()
                rel_path = file_path.relative_to(ROOT).as_posix()

                for line_no, line in enumerate(lines, 1):
                    for category, pattern_tuples in PATTERNS.items():
                        for pat, label in pattern_tuples:
                            match = re.search(pat, line, re.IGNORECASE)
                            if match:
                                match_count += 1
                                findings[category].append({
                                    "file": rel_path,
                                    "line": line_no,
                                    "label": label,
                                    "matched": match.group(0),
                                    "snippet": line.strip()
                                })

    # Save detailed JSON
    report_json_path = ROOT / "tools" / "ai_residue_scan_results_full.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(findings, f, indent=2, ensure_ascii=False)

    print(f"=== FULL SCAN COMPLETED ===")
    print(f"Scanned files: {file_count}")
    print(f"Total matching locations: {match_count}\n")
    for cat, items in findings.items():
        print(f"--- {cat}: {len(items)} hits ---")
        for item in items:
            print(f"  [{item['file']}:{item['line']}] ({item['label']}) -> \"{item['matched']}\"")
            print(f"    Context: {item['snippet'][:100]}")
        print()

if __name__ == "__main__":
    scan()
