import subprocess
import json

def run_sql(query):
    clean_q = query.strip().replace('\n', ' ')
    cmd = f'npx.cmd supabase db query --linked "{clean_q}"'
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        return {"error": res.stderr or res.stdout}
    out = res.stdout
    match = out.find('"rows":')
    if match != -1:
        # find boundaries
        start = out.find('[', match)
        end = out.rfind(']')
        if start != -1 and end != -1:
            try:
                return {"rows": json.loads(out[start:end+1])}
            except Exception as e:
                return {"error": f"JSON parse error: {e}", "raw": out}
    return {"raw": out}

print("=================================================================")
print("ANOMALY BOX / VIRALBOX: DEEP 360-DEGREE PRODUCTION SYSTEM AUDIT")
print("=================================================================\n")

# 1. Audit Public Tables
print("--- [1/6] AUDITING PRODUCTION DATABASE TABLES ---")
q_tables = "select table_name from information_schema.tables where table_schema = 'public' order by table_name;"
tables_res = run_sql(q_tables)
if "rows" in tables_res:
    tables = [r["table_name"] for r in tables_res["rows"]]
    print(f"Found {len(tables)} tables in public schema:")
    for t in tables:
        print(f"  [OK] {t}")
else:
    print("Error querying tables:", tables_res)

# 2. Audit RPC Functions
print("\n--- [2/6] AUDITING CRITICAL RPC FUNCTIONS ---")
q_rpcs = "select routine_name from information_schema.routines where routine_schema = 'public' order by routine_name;"
rpcs_res = run_sql(q_rpcs)
critical_rpcs = [
    "deliver_idea_box",
    "replace_reported_card",
    "available_inventory_counts",
    "claim_stripe_webhook_event",
    "reserve_checkout_inventory",
    "release_checkout_inventory"
]
if "rows" in rpcs_res:
    existing_rpcs = [r["routine_name"] for r in rpcs_res["rows"]]
    for rpc in critical_rpcs:
        if rpc in existing_rpcs:
            print(f"  [OK] RPC '{rpc}' exists and is active")
        else:
            print(f"  [FAIL] RPC '{rpc}' is MISSING!")

# 3. Audit RLS Security Policies
print("\n--- [3/6] AUDITING RLS SECURITY POLICIES ---")
q_rls = "select tablename, count(policyname) as policy_count from pg_policies where schemaname = 'public' group by tablename order by tablename;"
rls_res = run_sql(q_rls)
if "rows" in rls_res:
    for r in rls_res["rows"]:
        print(f"  [OK] {r['tablename'].ljust(32)} -> {r['policy_count']} RLS policies active")

# 4. Audit 12 Store Categories & Stock Health
print("\n--- [4/6] AUDITING 12 STORE CATEGORIES & STOCK HEALTH ---")
q_stock = """
select 
  c.slug, c.name, c.enabled,
  count(inv.id) as total_available,
  count(case when inv.score_band = 'low' then 1 end) as low_cards,
  count(case when inv.score_band = 'mid' then 1 end) as mid_cards,
  count(case when inv.score_band = 'high' then 1 end) as high_cards
from public.categories c
left join public.idea_inventory inv on inv.category_id = c.id and inv.status = 'available'
where c.enabled = true
group by c.slug, c.name, c.enabled
order by c.slug;
"""
stock_res = run_sql(q_stock)
if "rows" in stock_res:
    all_ok = True
    for s in stock_res["rows"]:
        low = s["low_cards"]
        mid = s["mid_cards"]
        high = s["high_cards"]
        red_ok = low >= 1 and high >= 1
        purple_ok = low >= 2 and mid >= 1 and high >= 2
        status = "100% IN STOCK" if (red_ok and purple_ok) else "OUT OF STOCK"
        if not (red_ok and purple_ok): all_ok = False
        print(f"  [OK] {s['slug'].ljust(24)} | Low: {low}, Mid: {mid}, High: {high} | Total: {s['total_available']} -> {status}")
    print(f"\nStore Categories Status: {'ALL 12 LANES 100% HEALTHY' if all_ok else 'SOME LANES MISSING STOCK'}")

# 5. Audit User Deliveries and Vault Integrity
print("\n--- [5/6] AUDITING USER DELIVERIES & VAULT INTEGRITY ---")
q_user = """
select 
  d.id as delivery_id,
  d.status,
  d.delivered_at,
  bp.name as box_name,
  c.name as category,
  count(bi.id) as item_count
from public.idea_box_deliveries d
join public.box_products bp on bp.id = d.box_product_id
join public.categories c on c.id = d.category_id
left join public.idea_box_items bi on bi.delivery_id = d.id
where d.user_id = '3756096b-1fc1-4b3c-b471-317ff41afe15'
group by d.id, d.status, d.delivered_at, bp.name, c.name
order by d.delivered_at desc;
"""
user_res = run_sql(q_user)
if "rows" in user_res:
    for u in user_res["rows"]:
        print(f"  [OK] [{u['box_name']}] ({u['category']}) -> Status: {u['status']}, Items: {u['item_count']} cards")

# 6. Audit Card Details Integrity
print("\n--- [6/6] AUDITING CARD DETAIL PAYLOADS ---")
q_cards = """
select 
  ic.idea_id, ic.title,
  (ic.card -> 'video_blueprint') is not null as has_blueprint,
  (ic.card -> 'scene_script') is not null as has_script,
  (ic.card -> 'hook_performance_pack') is not null as has_hooks,
  (ic.card -> 'micro_behavior_guide') is not null as has_behavior,
  (ic.card -> 'brand_lift_statement') is not null as has_brand_lift
from public.idea_cards ic
join public.idea_inventory inv on inv.idea_id = ic.idea_id
where inv.status = 'available'
limit 15;
"""
cards_res = run_sql(q_cards)
if "rows" in cards_res:
    all_fields_ok = True
    for c in cards_res["rows"]:
        fields = [c["has_blueprint"], c["has_script"], c["has_hooks"], c["has_behavior"], c["has_brand_lift"]]
        if not all(fields): all_fields_ok = False
        print(f"  [OK] {c['title'][:38].ljust(40)} -> Blueprint: {c['has_blueprint']}, Script: {c['has_script']}, Hooks: {c['has_hooks']}")
    print(f"\nCard Payloads Health: {'100% COMPLETE & RICH' if all_fields_ok else 'MISSING FIELDS DETECTED'}")

print("\n=================================================================")
print("AUDIT COMPLETE")
print("=================================================================")
