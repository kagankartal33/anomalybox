


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."box_delivery_status" AS ENUM (
    'pending',
    'delivered',
    'needs_inventory',
    'failed',
    'refunded'
);


ALTER TYPE "public"."box_delivery_status" OWNER TO "postgres";


CREATE TYPE "public"."card_report_admin_decision" AS ENUM (
    'reject',
    'accept_no_replace',
    'accept_replace'
);


ALTER TYPE "public"."card_report_admin_decision" OWNER TO "postgres";


CREATE TYPE "public"."card_report_reason" AS ENUM (
    'unclear_execution',
    'duplicate_or_too_similar',
    'wrong_lane_or_creator_mode_fit',
    'safety_or_sponsor_concern',
    'too_generic',
    'already_used_or_not_useful',
    'other'
);


ALTER TYPE "public"."card_report_reason" OWNER TO "postgres";


CREATE TYPE "public"."card_report_status" AS ENUM (
    'under_review',
    'accepted',
    'rejected',
    'replaced',
    'closed'
);


ALTER TYPE "public"."card_report_status" OWNER TO "postgres";


CREATE TYPE "public"."checkout_session_status" AS ENUM (
    'created',
    'open',
    'paid',
    'expired',
    'canceled'
);


ALTER TYPE "public"."checkout_session_status" OWNER TO "postgres";


CREATE TYPE "public"."generation_source_mode" AS ENUM (
    'admin_direct',
    'jsonl_import'
);


ALTER TYPE "public"."generation_source_mode" OWNER TO "postgres";


CREATE TYPE "public"."idea_status" AS ENUM (
    'draft',
    'ready',
    'needs_refinement',
    'human_review_required',
    'blocked',
    'published',
    'archived'
);


ALTER TYPE "public"."idea_status" OWNER TO "postgres";


CREATE TYPE "public"."inventory_status" AS ENUM (
    'available',
    'paused',
    'retired'
);


ALTER TYPE "public"."inventory_status" OWNER TO "postgres";


CREATE TYPE "public"."purchase_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded',
    'canceled'
);


ALTER TYPE "public"."purchase_status" OWNER TO "postgres";


CREATE TYPE "public"."review_decision" AS ENUM (
    'PASS',
    'REFINE',
    'HUMAN_REVIEW_REQUIRED',
    'BLOCK'
);


ALTER TYPE "public"."review_decision" OWNER TO "postgres";


CREATE TYPE "public"."safety_status" AS ENUM (
    'SAFE',
    'NEEDS_REVIEW',
    'BLOCKED'
);


ALTER TYPE "public"."safety_status" OWNER TO "postgres";


CREATE TYPE "public"."score_band" AS ENUM (
    'low',
    'mid',
    'high'
);


ALTER TYPE "public"."score_band" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deliver_idea_box"("p_user_id" "uuid", "p_box_product_slug" "text", "p_category_slug" "text", "p_persona_slug" "text", "p_purchase_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_product public.box_products%rowtype;
  v_category_id uuid;
  v_persona_id uuid;
  v_delivery_id uuid;
  v_band public.score_band;
  v_needed integer;
  v_available integer;
  v_slot_index integer := 1;
  v_inventory_id uuid;
  v_idea_id uuid;
  v_existing_status public.box_delivery_status;
  v_loop_index integer;
begin
  if p_user_id is null then raise exception 'p_user_id is required'; end if;

  if p_purchase_id is not null then
    select id, status into v_delivery_id, v_existing_status from public.idea_box_deliveries where purchase_id = p_purchase_id for update;
    if v_delivery_id is not null and v_existing_status = 'delivered' then return v_delivery_id; end if;
  end if;

  select * into v_product from public.box_products where slug = p_box_product_slug and enabled = true;
  if not found then raise exception 'box product not found: %', p_box_product_slug; end if;
  select id into v_category_id from public.categories where slug = p_category_slug and enabled = true;
  if v_category_id is null then raise exception 'category not found: %', p_category_slug; end if;
  select id into v_persona_id from public.creator_personas where slug = p_persona_slug and enabled = true;
  if v_persona_id is null then raise exception 'persona not found: %', p_persona_slug; end if;

  for v_band in select unnest(array['low','mid','high']::public.score_band[]) loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);
    if v_needed > 0 then
      select count(*)::integer into v_available
      from public.idea_inventory inv
      where inv.category_id = v_category_id and inv.score_band = v_band and inv.status = 'available'
        and inv.reuse_count = 0 and inv.max_reuse_count = 1 and inv.quality_floor_passed is true
        and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id);
      if v_available < v_needed then
        if v_delivery_id is null then
          insert into public.idea_box_deliveries(user_id,purchase_id,box_product_id,category_id,persona_id,status,allocation,failure_reason)
          values (p_user_id,p_purchase_id,v_product.id,v_category_id,v_persona_id,'needs_inventory',v_product.allocation,format('insufficient %s inventory for category: needed %s, available %s', v_band::text, v_needed, v_available))
          returning id into v_delivery_id;
        else
          update public.idea_box_deliveries set user_id = p_user_id, box_product_id = v_product.id, category_id = v_category_id, persona_id = v_persona_id, status = 'needs_inventory', allocation = v_product.allocation, failure_reason = format('insufficient %s inventory for category: needed %s, available %s', v_band::text, v_needed, v_available), delivered_at = null where id = v_delivery_id;
        end if;
        return v_delivery_id;
      end if;
    end if;
  end loop;

  if v_delivery_id is null then
    insert into public.idea_box_deliveries(user_id,purchase_id,box_product_id,category_id,persona_id,status,allocation)
    values (p_user_id,p_purchase_id,v_product.id,v_category_id,v_persona_id,'pending',v_product.allocation)
    returning id into v_delivery_id;
  else
    update public.idea_box_deliveries set user_id = p_user_id, box_product_id = v_product.id, category_id = v_category_id, persona_id = v_persona_id, status = 'pending', allocation = v_product.allocation, failure_reason = null, delivered_at = null where id = v_delivery_id;
    delete from public.idea_box_items where delivery_id = v_delivery_id;
  end if;

  for v_band in select unnest(array['low','mid','high']::public.score_band[]) loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);
    for v_loop_index in 1..v_needed loop
      select inv.id, inv.idea_id into v_inventory_id, v_idea_id
      from public.idea_inventory inv
      where inv.category_id = v_category_id and inv.score_band = v_band and inv.status = 'available'
        and inv.reuse_count = 0 and inv.max_reuse_count = 1 and inv.quality_floor_passed is true
        and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)
      order by case when inv.persona_id = v_persona_id then 0 else 1 end, inv.internal_rank_score desc, inv.published_at asc
      limit 1 for update skip locked;
      if v_inventory_id is null then raise exception 'inventory changed during delivery for band %', v_band::text; end if;
      insert into public.idea_box_items(delivery_id,user_id,inventory_id,idea_id,slot_index,assigned_band)
      values (v_delivery_id,p_user_id,v_inventory_id,v_idea_id,v_slot_index,v_band);
      update public.idea_inventory set reuse_count = 1, max_reuse_count = 1, last_assigned_at = now(), status = 'retired'::public.inventory_status where id = v_inventory_id;
      v_slot_index := v_slot_index + 1;
    end loop;
  end loop;

  update public.idea_box_deliveries set status = 'delivered', delivered_at = now() where id = v_delivery_id;
  return v_delivery_id;
end;
$$;


ALTER FUNCTION "public"."deliver_idea_box"("p_user_id" "uuid", "p_box_product_slug" "text", "p_category_slug" "text", "p_persona_slug" "text", "p_purchase_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."inventory_health"() RETURNS TABLE("category_slug" "text", "persona_slug" "text", "low_count" bigint, "mid_count" bigint, "high_count" bigint, "low_target" integer, "mid_target" integer, "high_target" integer, "low_threshold" integer, "mid_threshold" integer, "high_threshold" integer, "needs_generation" boolean)
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with pairs as (
    select c.id as category_id, p.id as persona_id
    from public.categories c cross join public.creator_personas p
    where c.enabled = true and p.enabled = true
    union select inv.category_id, inv.persona_id from public.idea_inventory inv
  ),
  counts as (
    select pairs.category_id, pairs.persona_id,
      count(inv.id) filter (where inv.score_band = 'low' and inv.status = 'available' and inv.reuse_count = 0 and inv.quality_floor_passed is true and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)) as low_count,
      count(inv.id) filter (where inv.score_band = 'mid' and inv.status = 'available' and inv.reuse_count = 0 and inv.quality_floor_passed is true and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)) as mid_count,
      count(inv.id) filter (where inv.score_band = 'high' and inv.status = 'available' and inv.reuse_count = 0 and inv.quality_floor_passed is true and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)) as high_count
    from pairs
    left join public.idea_inventory inv on inv.category_id = pairs.category_id and inv.persona_id = pairs.persona_id
    group by pairs.category_id, pairs.persona_id
  )
  select c.slug, p.slug, counts.low_count, counts.mid_count, counts.high_count,
    200, 100, 100, 60, 30, 30,
    counts.low_count < 60 or counts.mid_count < 30 or counts.high_count < 30
  from counts
  join public.categories c on c.id = counts.category_id
  join public.creator_personas p on p.id = counts.persona_id
  order by (counts.low_count < 60 or counts.mid_count < 30 or counts.high_count < 30) desc,
    c.sort_order,
    p.sort_order,
    c.slug,
    p.slug;
$$;


ALTER FUNCTION "public"."inventory_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."replace_reported_card"("p_report_id" "uuid", "p_replacement_inventory_id" "uuid", "p_admin_user_id" "uuid", "p_admin_feedback" "text", "p_admin_private_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_report public.card_reports%rowtype;
  v_item public.idea_box_items%rowtype;
  v_delivery public.idea_box_deliveries%rowtype;
  v_new_inventory public.idea_inventory%rowtype;
  v_now timestamptz := now();
begin
  select * into v_report from public.card_reports where id = p_report_id for update;
  if not found then raise exception 'card report not found'; end if;
  if v_report.status <> 'under_review' then raise exception 'card report is not under review'; end if;
  select * into v_item from public.idea_box_items where id = v_report.delivery_item_id for update;
  if not found then raise exception 'delivery item not found'; end if;
  select * into v_delivery from public.idea_box_deliveries where id = v_report.delivery_id for update;
  if not found then raise exception 'delivery not found'; end if;
  select * into v_new_inventory from public.idea_inventory where id = p_replacement_inventory_id for update;
  if not found then raise exception 'replacement inventory not found'; end if;
  if v_new_inventory.status <> 'available' or v_new_inventory.quality_floor_passed is not true or v_new_inventory.reuse_count <> 0 or v_new_inventory.max_reuse_count <> 1 then raise exception 'replacement inventory is not available'; end if;
  if exists (select 1 from public.idea_box_items used where used.idea_id = v_new_inventory.idea_id or used.inventory_id = v_new_inventory.id) then raise exception 'replacement inventory has already been assigned'; end if;
  if v_new_inventory.category_id <> v_delivery.category_id then raise exception 'replacement must match the same category'; end if;
  if v_new_inventory.idea_id = v_item.idea_id then raise exception 'replacement cannot be the reported card'; end if;

  insert into public.card_report_replacements(report_id,user_id,delivery_id,delivery_item_id,old_idea_id,old_inventory_id,new_idea_id,new_inventory_id,replaced_by,metadata)
  values (v_report.id,v_report.user_id,v_report.delivery_id,v_report.delivery_item_id,v_item.idea_id,v_item.inventory_id,v_new_inventory.idea_id,v_new_inventory.id,p_admin_user_id,jsonb_build_object('reason', v_report.reason, 'slot_index', v_item.slot_index));
  update public.idea_box_items set idea_id = v_new_inventory.idea_id, inventory_id = v_new_inventory.id where id = v_item.id;
  update public.idea_inventory set reuse_count = 1, max_reuse_count = 1, status = 'retired'::public.inventory_status, last_assigned_at = coalesce(last_assigned_at, v_now) where id in (v_item.inventory_id, v_new_inventory.id);
  update public.card_reports set status = 'replaced', admin_decision = 'accept_replace', admin_feedback = nullif(trim(coalesce(p_admin_feedback, '')), ''), admin_private_note = nullif(trim(coalesce(p_admin_private_note, '')), ''), replacement_idea_id = v_new_inventory.idea_id, replacement_inventory_id = v_new_inventory.id, reviewed_by = p_admin_user_id, reviewed_at = v_now, closed_at = v_now where id = v_report.id;
  insert into public.card_report_events(report_id,user_id,actor,event_type,metadata) values (v_report.id,v_report.user_id,'admin','card_replaced',jsonb_build_object('replacement_idea_id', v_new_inventory.idea_id));
  return v_new_inventory.idea_id;
end;
$$;


ALTER FUNCTION "public"."replace_reported_card"("p_report_id" "uuid", "p_replacement_inventory_id" "uuid", "p_admin_user_id" "uuid", "p_admin_feedback" "text", "p_admin_private_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."atelier_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "instagram_handle" "text",
    "desired_effect" "text" NOT NULL,
    "project_context" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "atelier_leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'qualified'::"text", 'closed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."atelier_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."box_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price_usd_cents" integer NOT NULL,
    "idea_count" integer NOT NULL,
    "allocation" "jsonb" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "box_products_allocation_check" CHECK (("jsonb_typeof"("allocation") = 'object'::"text")),
    CONSTRAINT "box_products_idea_count_check" CHECK (("idea_count" > 0)),
    CONSTRAINT "box_products_price_usd_cents_check" CHECK (("price_usd_cents" > 0)),
    CONSTRAINT "box_products_slug_check" CHECK (("slug" = "lower"("slug"))),
    CONSTRAINT "box_products_slug_check1" CHECK (("slug" ~ '^[a-z0-9]+(_[a-z0-9]+)*$'::"text"))
);


ALTER TABLE "public"."box_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_report_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "actor" "text" DEFAULT 'system'::"text" NOT NULL,
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_report_events_actor_check" CHECK (("actor" = ANY (ARRAY['creator'::"text", 'admin'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."card_report_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_report_replacements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "delivery_item_id" "uuid" NOT NULL,
    "old_idea_id" "uuid" NOT NULL,
    "old_inventory_id" "uuid" NOT NULL,
    "new_idea_id" "uuid" NOT NULL,
    "new_inventory_id" "uuid" NOT NULL,
    "replaced_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."card_report_replacements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "delivery_item_id" "uuid" NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "reason" "public"."card_report_reason" NOT NULL,
    "creator_note" "text" DEFAULT ''::"text" NOT NULL,
    "status" "public"."card_report_status" DEFAULT 'under_review'::"public"."card_report_status" NOT NULL,
    "admin_decision" "public"."card_report_admin_decision",
    "admin_feedback" "text",
    "admin_private_note" "text",
    "replacement_idea_id" "uuid",
    "replacement_inventory_id" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_reports_admin_feedback_check" CHECK ((("admin_feedback" IS NULL) OR ("char_length"("admin_feedback") <= 5000))),
    CONSTRAINT "card_reports_admin_private_note_check" CHECK ((("admin_private_note" IS NULL) OR ("char_length"("admin_private_note") <= 5000))),
    CONSTRAINT "card_reports_creator_note_check" CHECK (("char_length"("creator_note") <= 2000))
);


ALTER TABLE "public"."card_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "family" "text" DEFAULT 'creator_content'::"text" NOT NULL,
    "risk_level" "text" DEFAULT 'low'::"text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 100 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "categories_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'restricted'::"text"]))),
    CONSTRAINT "categories_slug_check" CHECK (("slug" = "lower"("slug"))),
    CONSTRAINT "categories_slug_check1" CHECK (("slug" ~ '^[a-z0-9]+(_[a-z0-9]+)*$'::"text"))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkout_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "box_product_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "persona_id" "uuid",
    "purchase_id" "uuid",
    "provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "provider_session_id" "text",
    "status" "public"."checkout_session_status" DEFAULT 'created'::"public"."checkout_session_status" NOT NULL,
    "checkout_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creator_category_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "persona_id" "uuid",
    "priority" integer DEFAULT 100 NOT NULL,
    "selected_content_layers" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."creator_category_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creator_personas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 100 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_personas_slug_check" CHECK (("slug" = "lower"("slug"))),
    CONSTRAINT "creator_personas_slug_check1" CHECK (("slug" ~ '^[a-z0-9]+(_[a-z0-9]+)*$'::"text"))
);


ALTER TABLE "public"."creator_personas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creator_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "handle" "text",
    "niche" "text",
    "default_platforms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "production_capacity" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "voice_guidelines" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "constraints" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."creator_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_box_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "purchase_id" "uuid",
    "box_product_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "persona_id" "uuid" NOT NULL,
    "status" "public"."box_delivery_status" DEFAULT 'pending'::"public"."box_delivery_status" NOT NULL,
    "allocation" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "failure_reason" "text",
    "opened_at" timestamp with time zone,
    "opened_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_box_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_box_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "inventory_id" "uuid" NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "slot_index" integer NOT NULL,
    "assigned_band" "public"."score_band" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "idea_box_items_slot_index_check" CHECK (("slot_index" > 0))
);


ALTER TABLE "public"."idea_box_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "external_idea_id" "text",
    "category_id" "uuid",
    "persona_id" "uuid",
    "platform" "text" DEFAULT 'instagram_reels'::"text" NOT NULL,
    "format" "text" DEFAULT 'short_video'::"text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "locale" "text" DEFAULT 'US'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "one_sentence_premise" "text" NOT NULL,
    "core_insight" "text",
    "opportunity_statement" "text",
    "mechanism_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "trend_signal_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "hook_options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "story_beats" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "comedy_remix" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "human_awareness" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "production_requirements" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "content_style_layers" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "candidate_source" "public"."generation_source_mode",
    "safety_status" "public"."safety_status" DEFAULT 'SAFE'::"public"."safety_status" NOT NULL,
    "perspective_prism_status" "public"."review_decision" DEFAULT 'PASS'::"public"."review_decision" NOT NULL,
    "confidence_band" "text" DEFAULT 'MEDIUM'::"text" NOT NULL,
    "status" "public"."idea_status" DEFAULT 'published'::"public"."idea_status" NOT NULL,
    "decision_trace" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "card" "jsonb" NOT NULL,
    "markdown" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."idea_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idea_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "idea_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "persona_id" "uuid" NOT NULL,
    "platform" "text" DEFAULT 'instagram_reels'::"text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "content_style_layers" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "internal_rank_score" numeric(5,2) NOT NULL,
    "score_band" "public"."score_band" NOT NULL,
    "quality_floor_passed" boolean DEFAULT true NOT NULL,
    "status" "public"."inventory_status" DEFAULT 'available'::"public"."inventory_status" NOT NULL,
    "reuse_count" integer DEFAULT 0 NOT NULL,
    "max_reuse_count" integer DEFAULT 1 NOT NULL,
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_assigned_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "idea_inventory_internal_rank_score_check" CHECK ((("internal_rank_score" >= (0)::numeric) AND ("internal_rank_score" <= (100)::numeric))),
    CONSTRAINT "idea_inventory_max_reuse_count_check" CHECK (("max_reuse_count" = 1)),
    CONSTRAINT "idea_inventory_reuse_count_check" CHECK ((("reuse_count" >= 0) AND ("reuse_count" <= 1)))
);


ALTER TABLE "public"."idea_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."linked_social_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_account_id" "text",
    "handle" "text",
    "display_name" "text",
    "avatar_url" "text",
    "access_token_encrypted" "text",
    "refresh_token_encrypted" "text",
    "token_expires_at" timestamp with time zone,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "connected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "linked_social_accounts_provider_check" CHECK (("provider" = ANY (ARRAY['instagram'::"text", 'google'::"text", 'meta'::"text"])))
);


ALTER TABLE "public"."linked_social_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "href" "text",
    "channel" "text" DEFAULT 'in_app'::"text" NOT NULL,
    "read_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_channel_check" CHECK (("channel" = ANY (ARRAY['in_app'::"text", 'email'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "role" "text" DEFAULT 'creator'::"text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "locale" "text" DEFAULT 'en-US'::"text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['creator'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "box_product_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "persona_id" "uuid",
    "provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "provider_checkout_session_id" "text",
    "provider_payment_intent_id" "text",
    "amount_usd_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "public"."purchase_status" DEFAULT 'pending'::"public"."purchase_status" NOT NULL,
    "fulfillment_source" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "raw_event" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "purchases_amount_usd_cents_check" CHECK (("amount_usd_cents" > 0)),
    CONSTRAINT "purchases_fulfillment_source_check" CHECK (("fulfillment_source" = ANY (ARRAY['stripe'::"text", 'admin_gift'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_events" (
    "id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "processed_at" timestamp with time zone,
    "processing_status" "text" DEFAULT 'processing'::"text" NOT NULL,
    "error_message" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stripe_webhook_events_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['processing'::"text", 'processed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."stripe_webhook_events" OWNER TO "postgres";


ALTER TABLE ONLY "public"."atelier_leads"
    ADD CONSTRAINT "atelier_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."box_products"
    ADD CONSTRAINT "box_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."box_products"
    ADD CONSTRAINT "box_products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."card_report_events"
    ADD CONSTRAINT "card_report_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_provider_session_id_key" UNIQUE ("provider_session_id");



ALTER TABLE ONLY "public"."creator_category_preferences"
    ADD CONSTRAINT "creator_category_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_personas"
    ADD CONSTRAINT "creator_personas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_personas"
    ADD CONSTRAINT "creator_personas_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_purchase_id_key" UNIQUE ("purchase_id");



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_delivery_id_idea_id_key" UNIQUE ("delivery_id", "idea_id");



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_delivery_id_slot_index_key" UNIQUE ("delivery_id", "slot_index");



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_candidates"
    ADD CONSTRAINT "idea_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_cards"
    ADD CONSTRAINT "idea_cards_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_cards"
    ADD CONSTRAINT "idea_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idea_inventory"
    ADD CONSTRAINT "idea_inventory_idea_id_key" UNIQUE ("idea_id");



ALTER TABLE ONLY "public"."idea_inventory"
    ADD CONSTRAINT "idea_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."linked_social_accounts"
    ADD CONSTRAINT "linked_social_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."linked_social_accounts"
    ADD CONSTRAINT "linked_social_accounts_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_provider_checkout_session_id_key" UNIQUE ("provider_checkout_session_id");



ALTER TABLE ONLY "public"."stripe_webhook_events"
    ADD CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id");



CREATE INDEX "atelier_leads_status_created_idx" ON "public"."atelier_leads" USING "btree" ("status", "created_at" DESC);



CREATE UNIQUE INDEX "card_reports_one_open_per_item_uidx" ON "public"."card_reports" USING "btree" ("delivery_item_id") WHERE ("status" = 'under_review'::"public"."card_report_status");



CREATE INDEX "card_reports_status_created_idx" ON "public"."card_reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "card_reports_user_status_idx" ON "public"."card_reports" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "categories_enabled_sort_idx" ON "public"."categories" USING "btree" ("enabled", "sort_order", "slug");



CREATE INDEX "checkout_sessions_user_status_idx" ON "public"."checkout_sessions" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE UNIQUE INDEX "creator_category_preferences_user_category_persona_uidx" ON "public"."creator_category_preferences" USING "btree" ("user_id", "category_id", COALESCE("persona_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "creator_personas_enabled_sort_idx" ON "public"."creator_personas" USING "btree" ("enabled", "sort_order", "slug");



CREATE INDEX "idea_box_deliveries_user_status_idx" ON "public"."idea_box_deliveries" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE UNIQUE INDEX "idea_box_items_global_idea_uidx" ON "public"."idea_box_items" USING "btree" ("idea_id");



CREATE UNIQUE INDEX "idea_box_items_global_inventory_uidx" ON "public"."idea_box_items" USING "btree" ("inventory_id");



CREATE INDEX "idea_box_items_user_delivery_idx" ON "public"."idea_box_items" USING "btree" ("user_id", "delivery_id", "slot_index");



CREATE INDEX "idea_inventory_stock_idx" ON "public"."idea_inventory" USING "btree" ("category_id", "persona_id", "score_band", "status", "reuse_count", "internal_rank_score" DESC) WHERE (("status" = 'available'::"public"."inventory_status") AND ("reuse_count" = 0));



CREATE INDEX "notifications_user_unread_idx" ON "public"."notifications" USING "btree" ("user_id", "read_at", "created_at" DESC);



CREATE INDEX "purchases_user_status_idx" ON "public"."purchases" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE OR REPLACE TRIGGER "atelier_leads_set_updated_at" BEFORE UPDATE ON "public"."atelier_leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "box_products_set_updated_at" BEFORE UPDATE ON "public"."box_products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "card_reports_set_updated_at" BEFORE UPDATE ON "public"."card_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "categories_set_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "checkout_sessions_set_updated_at" BEFORE UPDATE ON "public"."checkout_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "creator_personas_set_updated_at" BEFORE UPDATE ON "public"."creator_personas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "creator_profiles_set_updated_at" BEFORE UPDATE ON "public"."creator_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "idea_box_deliveries_set_updated_at" BEFORE UPDATE ON "public"."idea_box_deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "idea_candidates_set_updated_at" BEFORE UPDATE ON "public"."idea_candidates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "idea_cards_set_updated_at" BEFORE UPDATE ON "public"."idea_cards" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "idea_inventory_set_updated_at" BEFORE UPDATE ON "public"."idea_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "linked_social_accounts_set_updated_at" BEFORE UPDATE ON "public"."linked_social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "purchases_set_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."card_report_events"
    ADD CONSTRAINT "card_report_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."card_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_report_events"
    ADD CONSTRAINT "card_report_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."idea_box_deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_delivery_item_id_fkey" FOREIGN KEY ("delivery_item_id") REFERENCES "public"."idea_box_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_new_idea_id_fkey" FOREIGN KEY ("new_idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_new_inventory_id_fkey" FOREIGN KEY ("new_inventory_id") REFERENCES "public"."idea_inventory"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_old_idea_id_fkey" FOREIGN KEY ("old_idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_old_inventory_id_fkey" FOREIGN KEY ("old_inventory_id") REFERENCES "public"."idea_inventory"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_replaced_by_fkey" FOREIGN KEY ("replaced_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."card_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_report_replacements"
    ADD CONSTRAINT "card_report_replacements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."idea_box_deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_delivery_item_id_fkey" FOREIGN KEY ("delivery_item_id") REFERENCES "public"."idea_box_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_replacement_idea_id_fkey" FOREIGN KEY ("replacement_idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_replacement_inventory_id_fkey" FOREIGN KEY ("replacement_inventory_id") REFERENCES "public"."idea_inventory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."card_reports"
    ADD CONSTRAINT "card_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_box_product_id_fkey" FOREIGN KEY ("box_product_id") REFERENCES "public"."box_products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."creator_personas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creator_category_preferences"
    ADD CONSTRAINT "creator_category_preferences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creator_category_preferences"
    ADD CONSTRAINT "creator_category_preferences_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."creator_personas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."creator_category_preferences"
    ADD CONSTRAINT "creator_category_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_box_product_id_fkey" FOREIGN KEY ("box_product_id") REFERENCES "public"."box_products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."creator_personas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."idea_box_deliveries"
    ADD CONSTRAINT "idea_box_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."idea_box_deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."idea_inventory"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_box_items"
    ADD CONSTRAINT "idea_box_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_candidates"
    ADD CONSTRAINT "idea_candidates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_candidates"
    ADD CONSTRAINT "idea_candidates_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."creator_personas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_candidates"
    ADD CONSTRAINT "idea_candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_cards"
    ADD CONSTRAINT "idea_cards_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_inventory"
    ADD CONSTRAINT "idea_inventory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."idea_inventory"
    ADD CONSTRAINT "idea_inventory_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "public"."idea_candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idea_inventory"
    ADD CONSTRAINT "idea_inventory_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."creator_personas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."linked_social_accounts"
    ADD CONSTRAINT "linked_social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_box_product_id_fkey" FOREIGN KEY ("box_product_id") REFERENCES "public"."box_products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."creator_personas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."atelier_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."box_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "box_products_read_enabled" ON "public"."box_products" FOR SELECT TO "authenticated", "anon" USING (("enabled" = true));



ALTER TABLE "public"."card_report_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_report_events_owner_select" ON "public"."card_report_events" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."card_report_replacements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_reports_owner_insert" ON "public"."card_reports" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "card_reports_owner_select" ON "public"."card_reports" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_read_enabled" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (("enabled" = true));



ALTER TABLE "public"."checkout_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checkout_sessions_owner_select" ON "public"."checkout_sessions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."creator_category_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creator_category_preferences_owner_all" ON "public"."creator_category_preferences" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."creator_personas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creator_personas_read_enabled" ON "public"."creator_personas" FOR SELECT TO "authenticated", "anon" USING (("enabled" = true));



ALTER TABLE "public"."creator_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creator_profiles_owner_all" ON "public"."creator_profiles" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."idea_box_deliveries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_box_deliveries_owner_select" ON "public"."idea_box_deliveries" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."idea_box_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_box_items_owner_select" ON "public"."idea_box_items" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."idea_candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idea_cards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idea_cards_delivery_select" ON "public"."idea_cards" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."idea_box_items" "item"
  WHERE (("item"."idea_id" = "idea_cards"."idea_id") AND ("item"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."idea_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."linked_social_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "linked_social_accounts_owner_delete" ON "public"."linked_social_accounts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "linked_social_accounts_owner_select" ON "public"."linked_social_accounts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_owner_select" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notifications_owner_update" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchases_owner_select" ON "public"."purchases" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."stripe_webhook_events" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."deliver_idea_box"("p_user_id" "uuid", "p_box_product_slug" "text", "p_category_slug" "text", "p_persona_slug" "text", "p_purchase_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deliver_idea_box"("p_user_id" "uuid", "p_box_product_slug" "text", "p_category_slug" "text", "p_persona_slug" "text", "p_purchase_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."inventory_health"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."inventory_health"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."replace_reported_card"("p_report_id" "uuid", "p_replacement_inventory_id" "uuid", "p_admin_user_id" "uuid", "p_admin_feedback" "text", "p_admin_private_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."replace_reported_card"("p_report_id" "uuid", "p_replacement_inventory_id" "uuid", "p_admin_user_id" "uuid", "p_admin_feedback" "text", "p_admin_private_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."atelier_leads" TO "anon";
GRANT ALL ON TABLE "public"."atelier_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."atelier_leads" TO "service_role";



GRANT ALL ON TABLE "public"."box_products" TO "anon";
GRANT ALL ON TABLE "public"."box_products" TO "authenticated";
GRANT ALL ON TABLE "public"."box_products" TO "service_role";



GRANT ALL ON TABLE "public"."card_report_events" TO "anon";
GRANT ALL ON TABLE "public"."card_report_events" TO "authenticated";
GRANT ALL ON TABLE "public"."card_report_events" TO "service_role";



GRANT ALL ON TABLE "public"."card_report_replacements" TO "anon";
GRANT ALL ON TABLE "public"."card_report_replacements" TO "authenticated";
GRANT ALL ON TABLE "public"."card_report_replacements" TO "service_role";



GRANT ALL ON TABLE "public"."card_reports" TO "anon";
GRANT ALL ON TABLE "public"."card_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."card_reports" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."creator_category_preferences" TO "anon";
GRANT ALL ON TABLE "public"."creator_category_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_category_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."creator_personas" TO "anon";
GRANT ALL ON TABLE "public"."creator_personas" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_personas" TO "service_role";



GRANT ALL ON TABLE "public"."creator_profiles" TO "anon";
GRANT ALL ON TABLE "public"."creator_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."idea_box_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."idea_box_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_box_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."idea_box_items" TO "anon";
GRANT ALL ON TABLE "public"."idea_box_items" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_box_items" TO "service_role";



GRANT ALL ON TABLE "public"."idea_candidates" TO "anon";
GRANT ALL ON TABLE "public"."idea_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."idea_cards" TO "anon";
GRANT ALL ON TABLE "public"."idea_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_cards" TO "service_role";



GRANT ALL ON TABLE "public"."idea_inventory" TO "anon";
GRANT ALL ON TABLE "public"."idea_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."idea_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."linked_social_accounts" TO "anon";
GRANT ALL ON TABLE "public"."linked_social_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."linked_social_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT UPDATE("read_at") ON TABLE "public"."notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







