import Stripe from "stripe";
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(".env.local");
let key = process.env.STRIPE_SECRET_KEY;

if (!key && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("STRIPE_SECRET_KEY=")) {
      key = trimmed.split("=")[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

if (!key) {
  console.log("No STRIPE_SECRET_KEY found.");
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  const newEmail = process.argv[2] || "support@anomalybox.com";
  console.log(`Attempting to set Stripe support email to: ${newEmail}`);
  try {
    const updated = await stripe.accounts.update("acct_1TpVttAnuhYobes5", {
      business_profile: {
        support_email: newEmail,
      },
    });
    console.log("SUCCESS! Updated Stripe business profile support email:", updated.business_profile?.support_email);
  } catch (err) {
    console.log("Account update response:", err.message);
  }
}

main();
