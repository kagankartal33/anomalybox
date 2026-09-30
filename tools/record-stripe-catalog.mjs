/**
 * Record Stripe product/price IDs created in Dashboard on box_products.
 * Provider IDs are not secrets; Supabase credentials stay in .env.local.
 *
 * Usage:
 *   node tools/record-stripe-catalog.mjs --mode live \
 *     --entry slug,product_id,price_id,unit_amount
 */
import fs from "node:fs";
import process from "node:process";

function loadDotEnv(filePath = ".env.local") {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function argumentValues(flag) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && process.argv[index + 1]) values.push(process.argv[index + 1]);
  }
  return values;
}

loadDotEnv();
const mode = argumentValues("--mode")[0];
if (mode !== "test" && mode !== "live") throw new Error("Use --mode test or --mode live.");

const entries = argumentValues("--entry").map((raw) => {
  const [slug, productId, priceId, amountRaw] = raw.split(",");
  const amount = Number(amountRaw);
  if (!slug || !productId?.startsWith("prod_") || !priceId?.startsWith("price_") || !Number.isInteger(amount)) {
    throw new Error(`Invalid catalog entry: ${raw}`);
  }
  return { slug, productId, priceId, amount };
});
if (entries.length === 0) throw new Error("At least one --entry is required.");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Supabase service credentials are missing.");

for (const entry of entries) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const readResponse = await fetch(
    `${supabaseUrl}/rest/v1/box_products?slug=eq.${encodeURIComponent(entry.slug)}&select=id,metadata`,
    { headers },
  );
  if (!readResponse.ok) throw new Error(`Could not read ${entry.slug}: ${readResponse.status}`);
  const product = (await readResponse.json())[0];
  if (!product) throw new Error(`Missing box_products row: ${entry.slug}`);

  const metadata = product.metadata && typeof product.metadata === "object" ? product.metadata : {};
  const stripeMetadata = metadata.stripe && typeof metadata.stripe === "object" ? metadata.stripe : {};
  const patchResponse = await fetch(`${supabaseUrl}/rest/v1/box_products?id=eq.${product.id}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      price_usd_cents: entry.amount,
      metadata: {
        ...metadata,
        stripe: {
          ...stripeMetadata,
          [mode]: {
            product_id: entry.productId,
            price_id: entry.priceId,
            currency: "usd",
            unit_amount: entry.amount,
            synced_at: new Date().toISOString(),
          },
        },
      },
    }),
  });
  if (!patchResponse.ok) throw new Error(`Could not update ${entry.slug}: ${patchResponse.status}`);
  console.log(`Recorded Stripe ${mode} catalog for ${entry.slug} (${entry.amount} cents).`);
}