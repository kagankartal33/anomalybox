const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

function requireAdmin(req: Request) {
  const expected = Deno.env.get("ADMIN_API_TOKEN") ?? Deno.env.get("INTERNAL_API_TOKEN");
  if (!expected) throw new HttpError(500, "ADMIN_API_TOKEN or INTERNAL_API_TOKEN is not configured");

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = req.headers.get("x-admin-token") ?? bearer;
  if (token !== expected) throw new HttpError(401, "Unauthorized admin request");
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callInventoryHealth() {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/inventory_health`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey!,
      authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new HttpError(res.status, "inventory_health RPC failed", data);

  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    requireAdmin(req);

    if (req.method !== "GET" && req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const rows = await callInventoryHealth();
    return jsonResponse(200, {
      reorder_rows: rows.filter((row: { needs_generation: boolean }) => row.needs_generation),
      rows,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message, details: error.details });
    }

    return jsonResponse(500, { error: error instanceof Error ? error.message : String(error) });
  }
});