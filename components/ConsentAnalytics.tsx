"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type Consent = "granted" | "denied" | null;

export function ConsentAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("anomalybox_analytics_consent");
    setConsent(saved === "granted" || saved === "denied" ? saved : null);
    setReady(true);
  }, []);

  function choose(value: Exclude<Consent, null>) {
    window.localStorage.setItem("anomalybox_analytics_consent", value);
    setConsent(value);
  }

  if (!measurementId || !ready) return null;
  return (
    <>
      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="anomalybox-ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true,allow_google_signals:false});`}
          </Script>
        </>
      ) : null}
      {consent === null ? (
        <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-ink/15 bg-white p-4 shadow-2xl" aria-label="Analytics preferences">
          <p className="text-sm leading-6 text-ink/70">We use optional, privacy-conscious analytics to understand site performance. Essential account and payment functions do not depend on this choice.</p>
          <div className="mt-3 flex gap-3">
            <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => choose("granted")}>Allow analytics</button>
            <button className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold" onClick={() => choose("denied")}>Essential only</button>
          </div>
        </aside>
      ) : null}
    </>
  );
}