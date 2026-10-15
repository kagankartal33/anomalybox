"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getGoogleAnalyticsId } from "@/lib/analytics";

type Consent = "granted" | "denied" | null;

function GoogleAnalyticsTracker({ measurementId, consent }: { measurementId: string; consent: Consent }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (consent === "granted" && typeof window !== "undefined" && window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      window.gtag("config", measurementId, {
        page_path: url,
        page_location: window.location.href,
      });
    }
  }, [pathname, searchParams, consent, measurementId]);

  return null;
}

export function ConsentAnalytics() {
  const measurementId = getGoogleAnalyticsId();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("anomalybox_analytics_consent");
      setConsent(saved === "granted" || saved === "denied" ? saved : null);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function choose(value: Exclude<Consent, null>) {
    window.localStorage.setItem("anomalybox_analytics_consent", value);
    setConsent(value);
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: value,
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }

  if (!measurementId || !ready) return null;

  return (
    <>
      {/* 1. Global Site Tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />

      {/* 2. Google Consent Mode v2 & GA4 Configuration */}
      <Script id="anomalybox-ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'analytics_storage': '${consent === "granted" ? "granted" : "denied"}',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            allow_google_signals: false,
            send_page_view: true
          });
        `}
      </Script>

      {/* 3. Automatic Route Change Tracker */}
      <Suspense fallback={null}>
        <GoogleAnalyticsTracker measurementId={measurementId} consent={consent} />
      </Suspense>

      {/* 4. Privacy Consent Banner (If not yet chosen) */}
      {consent === null ? (
        <aside
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-ink/15 bg-white p-4 shadow-2xl"
          aria-label="Analytics preferences"
        >
          <p className="text-sm leading-6 text-ink/75 font-medium">
            We use privacy-respecting analytics cookies to understand how the site is used.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 transition-colors"
              onClick={() => choose("granted")}
            >
              Accept
            </button>
            <button
              type="button"
              className="focus-ring rounded-md border border-ink/15 bg-paper px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-white transition-colors"
              onClick={() => choose("denied")}
            >
              Essential only
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
