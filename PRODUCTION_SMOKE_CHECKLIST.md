# ViralBox Production Smoke Checklist

Use this checklist after Railway deploy, Supabase production setup, and Stripe/OAuth configuration.

## 1. Deploy and Env

- Railway build completes.
- `NEXT_PUBLIC_SITE_URL` points to the production domain.
- No server-only secret is exposed with `NEXT_PUBLIC_`.
- App homepage loads without missing env errors.

## 2. Supabase

- `supabase db push` completed.
- `supabase db lint --local` passes before push.
- Finalist import applied to production.
- Production DB size measured and stays below 400 MB safety target.
- `creator-review-videos` bucket exists and is private.

## 3. Auth

- Email/password signup works.
- Login/logout works.
- Google login works through Supabase provider.
- Meta Instagram connect redirects back to onboarding.
- Missing Meta config shows a clean error, not a crash.

## 4. Creator Flow

- New creator completes onboarding.
- Creator selects up to 3 lanes and one creator mode.
- Store shows Classic Red Box and SIGNATURE PURPLE BOX.
- Checkout is disabled if the selected lane has no inventory.
- Successful purchase delivers a sealed box to Creator Vault.
- Sealed box does not reveal cards before confirmation.
- Box reveal opens and saves `opened_at`.
- Opened card links to card detail.
- Card detail sections are structured and English.

## 5. Lane Lock Test

- Buy or gift two boxes.
- Change onboarding category/persona.
- Open old sealed box.
- Expected: old box keeps original category/persona and card set.

## 6. Stripe

- Stripe Checkout opens with correct amount.
- Webhook receives `checkout.session.completed`.
- Purchase row is created/updated.
- Delivery row is created once.
- Replay same event: no second delivery and no duplicate inventory consumption.

## 7. Admin

- Non-admin cannot access `/admin`.
- Admin can access dashboard.
- Admin can send gift box.
- Admin can view inventory health.
- Admin can view Atelier leads.
- Admin can open review queue.

## 8. Manual Review

- Creator uploads MP4/MOV/WebM.
- Status becomes `under_review`.
- Admin can open signed video URL.
- Admin checklist saves.
- Creator sees feedback.
- Admin private note is not visible to creator.
- Creator can submit a second attempt.
- `ready_to_post` requires required checklist items to pass or be not applicable.

## 9. ATELIER BLACK BOX

- `/atelier` loads.
- Form validation works.
- Lead is saved to `atelier_leads`.
- Lead appears in `/admin/atelier-leads`.
- ATELIER BLACK BOX is not available in checkout.

## 10. Final Audit Commands

```powershell
npm run audit:leaks
npm run audit:readiness
```

Full regression:

```powershell
npm run typecheck
npm run lint
npm run build
supabase db lint --local
powershell -ExecutionPolicy Bypass -File .\\tools\\test-generator-flow.ps1
powershell -ExecutionPolicy Bypass -File .\\tools\\test-quality-gate-v2.ps1
powershell -ExecutionPolicy Bypass -File .\\tools\\test-creator-video-review.ps1
```