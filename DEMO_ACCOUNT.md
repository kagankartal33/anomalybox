# ViralBox Demo Account Setup

Use this to quickly test the full application (landing, auth, onboarding, store, vault, box reveal, cards, card reports).

## 1. Start the Local Environment

Open two terminals in the project folder:

**Terminal 1 (Supabase):**
```powershell
supabase start
```

**Terminal 2 (Next.js app):**
```powershell
npm run dev
```

Wait until Supabase says it's ready, then access:
- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:55323

## 2. Create / reset the Demo Account (recommended)

From the repo root with local Supabase running:

```powershell
# Create/reset demo creator and promote to admin
npm run demo:reset

# Optional: also gift one sealed box into Creator Vault
powershell -ExecutionPolicy Bypass -File .\tools\reset-demo-account.ps1 -MakeAdmin -GiftBox
```

Credentials:

- **Email**: `demo.creator@viralbox.test`
- **Password**: `DemoViralBox2026!`
- **Display name**: `Demo Creator`

Then log in at **http://localhost:3000/login** and complete onboarding if prompted:
- Category: `beauty`
- Persona: `luxury_editor`

## 3. Make This Account an Admin (manual SQL alternative)

If you created the account from the UI instead of `demo:reset`, run in Supabase Studio SQL:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'demo.creator@viralbox.test'
);
```

## 4. Gift Yourself a Box (Best way to test Vault + Reveal + Cards immediately)

1. Log in as `demo.creator@viralbox.test`
2. Go to **http://localhost:3000/admin/users**
3. In the **"Send gift box"** section:
   - Select your demo user
   - Choose a box (`$500 Viral Box` or `$1000 Premium Viral Box`)
   - Select the **same category + persona** you chose in onboarding
4. Click "Send gift box"

## 5. Test the Core Flows

- Go to **Creator Vault** (`/boxes`)
- Click **"Reveal this ViralBox"** → watch the premium box opening animation
- Click on the revealed cards → view full execution details
- Open a card and optionally submit a card check/report

## 6. Test the Purchase Flow (optional)

If you want to test real checkout:

1. Set up Stripe test keys in `.env.local`
2. Go to `/store`
3. Try to buy a box
4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Any future date + any CVC

After successful payment, the box will be delivered automatically.

## 7. Quick Data Seeding (if inventory is empty)

If gifting fails with "inventory unavailable", run this once:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\test-all.ps1 -SkipQualityGate
```

This populates categories, some training data, and sample inventory.

---

**Notes**
- The public landing page is now at `/` (when logged out).
- All categories and personas are supported at launch.
- Everything is digital only.
- For custom digital card service requests, use the email link on the landing.

You now have everything needed to test the premium experience end-to-end.
