"use client";

import { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

export function CheckoutButton({
  boxProductSlug,
  categorySlug,
  personaSlug,
  contextDetail,
  disabled,
  label = "Open secure checkout",
}: {
  boxProductSlug: string;
  categorySlug: string;
  personaSlug: string;
  contextDetail?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  async function recaptchaToken() {
    if (!recaptchaSiteKey) return undefined;
    if (!window.grecaptcha) throw new Error("Security verification is still loading.");
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha?.ready(() => {
        window.grecaptcha?.execute(recaptchaSiteKey, { action: "begin_checkout" }).then(resolve).catch(reject);
      });
    });
  }

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const token = await recaptchaToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box_product_slug: boxProductSlug,
          category_slug: categorySlug,
          persona_slug: personaSlug,
          context_detail: contextDetail,
          recaptcha_token: token,
        }),
      });
      const data = await res.json();
      if (res.status === 401 && typeof data.login_url === "string") {
        window.location.href = data.login_url;
        return;
      }
      if (!res.ok) {
        setError(
          data.error === "inventory_unavailable"
            ? "This creator lane does not have enough approved briefs available right now."
            : "Secure checkout could not be started. Please try again.",
        );
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("The secure checkout service could not be reached. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      {recaptchaSiteKey ? <Script src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} strategy="afterInteractive" /> : null}
      <button
        className="focus-ring w-full rounded-md bg-ink px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
        disabled={disabled || loading}
        onClick={checkout}
        type="button"
      >
        {loading ? "Opening secure checkout..." : disabled ? "Currently unavailable" : label}
      </button>
      {error ? <p className="mt-2 text-sm text-coral" role="alert">{error}</p> : null}
    </div>
  );
}