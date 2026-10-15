"""
import-seo-content.py
===================
Imports prepared JSONL files (observations, glossary, qa_bank) into Supabase PostgreSQL,
creates compilation record, and prints quality report.
"""

import json
import subprocess
import sys
from pathlib import Path

ARCHIVE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
PREPARED_DIR = ARCHIVE_DIR / "dataset" / "seo_content" / "prepared"


def db_container() -> str:
    out = subprocess.check_output(["docker", "ps", "--format", "{{.Names}}"], text=True)
    names = out.splitlines()
    if "supabase_db_ViralBox" in names:
        return "supabase_db_ViralBox"
    for name in names:
        if name.startswith("supabase_db_"):
            return name
    raise RuntimeError("Could not find running Supabase database container.")


def run_sql(sql_text: str) -> str:
    proc = subprocess.run(
        ["docker", "exec", "-i", db_container(), "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-P", "pager=off"],
        input=sql_text,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"SQL error:\n{proc.stdout}")
    return proc.stdout


def sanitize(val: Any) -> Any:
    if isinstance(val, str):
        return val.replace("\x00", "").replace("\u0000", "")
    if isinstance(val, dict):
        return {k: sanitize(v) for k, v in val.items()}
    if isinstance(val, list):
        return [sanitize(v) for v in val]
    return val


def sqlq(val: str | None) -> str:
    if val is None:
        return "null"
    clean_val = str(val).replace("\x00", "").replace("\u0000", "")
    return "'" + clean_val.replace("'", "''") + "'"


def json_sql(val: Any) -> str:
    cleaned = sanitize(val)
    return sqlq(json.dumps(cleaned, ensure_ascii=False)) + "::jsonb"


def array_sql(items: list) -> str:
    escaped = [sqlq(str(i)) for i in items or []]
    return f"array[{','.join(escaped)}]::text[]"


def import_observations(path: Path) -> int:
    if not path.exists():
        print(f"  ⚠ File not found: {path}")
        return 0

    print(f"📖 Importing SEO observations from {path.name}...")
    lines = path.read_text(encoding="utf-8").splitlines()
    count = 0
    batch_size = 100

    for i in range(0, len(lines), batch_size):
        batch = lines[i:i + batch_size]
        rows = []
        for line in batch:
            if not line.strip():
                continue
            obs = json.loads(line)
            hash_val = sqlq(obs["content_hash"])
            book_val = sqlq(obs["source_book"])
            ch_val = sqlq(obs.get("source_chapter"))
            pg_val = obs.get("source_page") or "null"
            layer_val = sqlq(obs["seo_layer"])
            cat_val = sqlq(obs.get("category_slug"))
            loc_val = sqlq(obs.get("locale", "en"))
            title_val = sqlq((obs.get("title_algorithmic") or "")[:200])
            text_sig = json_sql(obs.get("text_signals", {}))
            metric_sig = json_sql(obs.get("metric_signals", {}))
            concepts = array_sql(obs.get("derived_concepts", []))
            weight = obs.get("training_weight", 0.5)
            use_val = sqlq(obs.get("training_use", "pattern_only"))
            risk_val = sqlq(obs.get("risk_level", "low"))
            meta_val = json_sql(obs.get("metadata", {}))

            rows.append(
                f"({hash_val}, {book_val}, {ch_val}, {pg_val}, {layer_val}, {cat_val}, "
                f"{loc_val}, {title_val}, {text_sig}, {metric_sig}, {concepts}, "
                f"{weight}, {use_val}, {risk_val}, {meta_val})"
            )

        if rows:
            sql = f"""
            INSERT INTO public.seo_training_observations
              (content_hash, source_book, source_chapter, source_page, seo_layer, category_slug,
               locale, title_algorithmic, text_signals, metric_signals, derived_concepts,
               training_weight, training_use, risk_level, metadata)
            VALUES
              {','.join(rows)}
            ON CONFLICT (content_hash) DO NOTHING;
            """
            run_sql(sql)
            count += len(rows)

    print(f"  ✓ Imported {count} observations")
    return count


def import_glossary(path: Path) -> int:
    if not path.exists():
        print(f"  ⚠ File not found: {path}")
        return 0

    print(f"📚 Importing glossary from {path.name}...")
    lines = path.read_text(encoding="utf-8").splitlines()
    count = 0
    batch_size = 100

    for i in range(0, len(lines), batch_size):
        batch = lines[i:i + batch_size]
        rows = []
        for line in batch:
            if not line.strip():
                continue
            g = json.loads(line)
            term = sqlq(g["term"])
            defn = sqlq(g["definition"])
            cat = sqlq(g["category"])
            imp = sqlq(g.get("importance", "Medium"))
            related = array_sql(g.get("related_terms", []))

            rows.append(f"({term}, {defn}, {cat}, {imp}, {related})")

        if rows:
            sql = f"""
            INSERT INTO public.seo_glossary (term, definition, category, importance, related_terms)
            VALUES
              {','.join(rows)}
            ON CONFLICT (term) DO NOTHING;
            """
            run_sql(sql)
            count += len(rows)

    print(f"  ✓ Imported {count} glossary terms")
    return count


def import_qa(path: Path) -> int:
    if not path.exists():
        print(f"  ⚠ File not found: {path}")
        return 0

    print(f"❓ Importing Q&A bank from {path.name}...")
    lines = path.read_text(encoding="utf-8").splitlines()
    count = 0
    batch_size = 100

    for i in range(0, len(lines), batch_size):
        batch = lines[i:i + batch_size]
        rows = []
        for line in batch:
            if not line.strip():
                continue
            q = json.loads(line)
            question = sqlq(q["question"])
            answer = sqlq(q["answer"])
            keywords = array_sql(q.get("keywords", []))
            source_url = sqlq(q.get("source_url"))
            layer = sqlq(q.get("seo_layer"))
            weight = q.get("training_weight", 0.5)

            rows.append(f"({question}, {answer}, {keywords}, {source_url}, {layer}, {weight})")

        if rows:
            sql = f"""
            INSERT INTO public.seo_qa_bank (question, answer, keywords, source_url, seo_layer, training_weight)
            VALUES
              {','.join(rows)}
            ON CONFLICT DO NOTHING;
            """
            run_sql(sql)
            count += len(rows)

    print(f"  ✓ Imported {count} Q&A pairs")
    return count


def create_compilation(version: str):
    print(f"\n📊 Creating compilation '{version}'...")
    sql = f"""
    INSERT INTO public.seo_training_compilations (
      version, observation_count, glossary_count, qa_count, rule_count,
      layer_distribution, source_distribution, active
    )
    SELECT
      {sqlq(version)},
      (SELECT count(*) FROM public.seo_training_observations),
      (SELECT count(*) FROM public.seo_glossary),
      (SELECT count(*) FROM public.seo_qa_bank),
      (SELECT count(*) FROM public.seo_content_rules WHERE enabled),
      (SELECT coalesce(jsonb_object_agg(seo_layer, cnt), '{{}}'::jsonb) FROM (SELECT seo_layer, count(*) as cnt FROM public.seo_training_observations GROUP BY seo_layer) x),
      (SELECT coalesce(jsonb_object_agg(source_book, cnt), '{{}}'::jsonb) FROM (SELECT source_book, count(*) as cnt FROM public.seo_training_observations GROUP BY source_book) x),
      true
    ON CONFLICT (version) DO UPDATE SET
      observation_count = excluded.observation_count,
      glossary_count = excluded.glossary_count,
      qa_count = excluded.qa_count,
      rule_count = excluded.rule_count,
      layer_distribution = excluded.layer_distribution,
      source_distribution = excluded.source_distribution,
      updated_at = now();
    """
    run_sql(sql)
    print(f"  ✓ Compilation '{version}' recorded")


def run_report():
    print("\n" + "=" * 60)
    print("  SUPABASE SEO TRAINING DATA REPORT")
    print("=" * 60 + "\n")

    report_sql = """
    SELECT '--- OBSERVATIONS PER LAYER ---' as section;
    SELECT seo_layer, count(*) as count, round(avg(training_weight)::numeric, 4) as avg_weight
    FROM public.seo_training_observations GROUP BY seo_layer ORDER BY count DESC;

    SELECT '--- GLOSSARY CATEGORIES ---' as section;
    SELECT category, count(*) as count FROM public.seo_glossary GROUP BY category ORDER BY count DESC LIMIT 10;

    SELECT '--- Q&A BANK PER LAYER ---' as section;
    SELECT coalesce(seo_layer, 'unclassified') as seo_layer, count(*) as count
    FROM public.seo_qa_bank GROUP BY seo_layer ORDER BY count DESC;

    SELECT '--- RULES PER LAYER ---' as section;
    SELECT seo_layer, count(*) as count FROM public.seo_content_rules WHERE enabled GROUP BY seo_layer ORDER BY count DESC;

    SELECT '--- COMPILATION RECORD ---' as section;
    SELECT version, observation_count, glossary_count, qa_count, rule_count, active, created_at
    FROM public.seo_training_compilations ORDER BY created_at DESC LIMIT 3;
    """
    out = run_sql(report_sql)
    print(out)


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else "2026-v1-seo-content"

    print("=" * 60)
    print("  IMPORTING SEO TRAINING DATA TO SUPABASE")
    print("=" * 60)
    print(f"  Container: {db_container()}")
    print(f"  Prepared dir: {PREPARED_DIR}")
    print(f"  Version: {version}\n")

    import_observations(PREPARED_DIR / "seo_observations.jsonl")
    import_observations(PREPARED_DIR / "2026_seo_observations.jsonl")
    import_observations(PREPARED_DIR / "hf_observations.jsonl")
    import_observations(PREPARED_DIR / "local_harvest_observations.jsonl")
    import_glossary(PREPARED_DIR / "seo_glossary.jsonl")
    import_qa(PREPARED_DIR / "seo_qa_bank.jsonl")

    create_compilation(version)
    run_report()

    print("✅ All SEO training data successfully imported into Supabase!")


if __name__ == "__main__":
    main()
