# Anomaly Box SEO production handoff

## Completed in the repository

- 112 package pages and 123 legacy resource pages share canonical metadata, cleaned descriptions and bounded alt text.
- Public pages expose visible direct-answer summaries, FAQs and step sections where present; JSON-LD is generated only from that visible content.
- Organization, WebSite, Article/Service, Product, BreadcrumbList, FAQPage and HowTo JSON-LD are scoped to the page that actually renders them.
- `/robots.txt`, `/sitemap.xml` and `/llms.txt` are generated from the public canonical set. Private/auth/payment routes are noindex/disallowed.
- API responses receive `X-Robots-Tag: noindex, nofollow`.
- SEO training remains isolated from viral-card training; SCR-053 through SCR-070 are applied.
- Production checks passed locally and on `https://anomalybox.com`.

## One-time account actions still required

Vercel's environment pull masks secret values, so the following must be confirmed in the Vercel project dashboard without pasting secrets into chat:

1. Add `RESEND_API_KEY` (verified `anomalybox.com` sender) for Atelier and auth email delivery.
2. `INTERNAL_API_TOKEN`, `ADMIN_API_TOKEN` and `INDEXNOW_KEY` are now generated and configured automatically in Vercel.
3. Confirm `NEXT_PUBLIC_SITE_URL=https://anomalybox.com` and the production Supabase URL.
4. Confirm Stripe live secret and webhook secret, then register `https://anomalybox.com/api/stripe/webhook` in Stripe.
5. Add the Google, Bing and Yandex verification values as Vercel production variables:
   `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `YANDEX_SITE_VERIFICATION`.

After saving variables, redeploy with:

```text
npx vercel deploy --prod --yes
```

## Search indexing

- Verify the `https://anomalybox.com` property in Google Search Console, Bing Webmaster and Yandex Webmaster.
- Submit `https://anomalybox.com/sitemap.xml` in each console.
- Generate an IndexNow key, add it as `INDEXNOW_KEY` in Vercel, and publish the matching key file at the domain root before submitting changed URLs.

Search position and rich-result appearance are measured after crawling; neither a first-place ranking nor a fixed audit score can be guaranteed.