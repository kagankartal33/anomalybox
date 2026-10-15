"use client";

import Script from "next/script";

export function TurnstileWidget({ theme = "light" }: { theme?: "light" | "dark" }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile min-h-[65px]" data-sitekey={siteKey} data-theme={theme} data-size="flexible" />
    </>
  );
}
