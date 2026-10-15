# Anomaly Box Launch Status

Updated: 2026-08-08

## Green (done)

- Site live: `https://anomalybox.com`
- Health: database ok, payments ok
- Public routes: `/`, `/store`, `/pricing`, `/login`, `/atelier`, `/about`, `/legal`
- Supabase Auth: email + Google enabled; signup enabled
- Stripe account `anomalybox.com`: charges/payouts enabled
- Stripe TEST products + prices:
  - Classic Red Dossier — `$500` (`price_1TzKuKAnuhYobes55r9PvRBA`)
  - Signature Purple Dossier — `$1000` (`price_1TzKuOAnuhYobes5ttBXBNjh`)
- Webhook: Supabase function `stripe-webhook` (signature verified)
- Inventory: 35 available cards across beauty/fashion/food/lifestyle/travel
- Store availability API returns stock for travel + travel_curator
- Checkout correctly requires login (`401 login_required`)
- Stripe agent skills (6) + Stripe MCP connected in Grok
- Agent status command: `npm run stripe:agent:status`
- App host: **Vercel**

## Yellow (works in test, not full live commerce yet)

- Production payment mode is still **test** (`paymentMode: "test"`)
- Stripe CLI live key may be restricted (`rk_live_`); full `sk_live_...` needed for live product creation

## Red / blocked without human secrets or payment

1. **Stripe live secret key**
   - https://dashboard.stripe.com/apikeys
   - Then:
     ```powershell
     # put sk_live_... into .env.local as STRIPE_SECRET_KEY
     npm run stripe:products:live
     npm run stripe:setup:live
     ```

2. **Resend API key** (transactional email / Atelier mail)
   - Not present as a real `re_...` key in local env
   - https://resend.com/api-keys
   - Set Vercel Production `RESEND_API_KEY`

3. **Meta / Instagram OAuth**
   - Optional; not configured (placeholders only)
   - Google login already enabled in Supabase

4. **Manual browser smoke (5 minutes)**
   - Login/signup on production
   - Store → travel → travel_curator
   - Stripe test card checkout (`4242...`)
   - Confirm Creator Vault delivery + open box + card detail

## Commands

```powershell
npm run stripe:agent:status
npm run stripe:products
npm run test:route-smoke
node tools/check-vercel-production-env.mjs
npx vercel deploy --prod --yes
```
