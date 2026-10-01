type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("LOCAL_SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("LOCAL_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase URL and service role key are required");
}

function requireInternal(req: Request) {
  const expected = Deno.env.get("INTERNAL_API_TOKEN") ?? Deno.env.get("ADMIN_API_TOKEN");
  if (!expected) throw new HttpError(500, "INTERNAL_API_TOKEN or ADMIN_API_TOKEN is not configured");

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  const token = req.headers.get("x-admin-token") ?? bearer;
  if (token !== expected) throw new HttpError(401, "Unauthorized internal request");
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey!,
      authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new HttpError(res.status, "Supabase REST request failed", data);

  return data;
}

async function deliverBox(body: Json) {
  for (const field of ["user_id", "box_product_slug", "category_slug", "persona_slug"]) {
    if (!body[field]) throw new HttpError(400, `${field} is required`);
  }

  const deliveryId = await rest("rpc/deliver_idea_box", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: body.user_id,
      p_box_product_slug: body.box_product_slug,
      p_category_slug: body.category_slug,
      p_persona_slug: body.persona_slug,
      p_purchase_id: body.purchase_id ?? null,
    }),
  });

  const deliveries = await rest(
    `idea_box_deliveries?select=id,status,failure_reason,delivered_at,created_at&id=eq.${deliveryId}`,
    { method: "GET" },
  ) as Json[];
  const items = await rest(
    `idea_box_items?select=id&delivery_id=eq.${deliveryId}`,
    { method: "GET" },
  ) as Json[];

  return {
    delivery: deliveries[0],
    assigned_count: items.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    requireInternal(req);
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");

    return jsonResponse(200, await deliverBox(await req.json()));
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message, details: error.details });
    }

    return jsonResponse(500, { error: error instanceof Error ? error.message : String(error) });
  }
});