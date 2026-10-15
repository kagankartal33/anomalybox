"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

export function RecaptchaSubmitButton({ action, className, children }: { action: string; className: string; children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [checking, setChecking] = useState(false);

  async function submit(event: React.MouseEvent<HTMLButtonElement>) {
    if (!siteKey) return;
    event.preventDefault();
    const form = event.currentTarget.form;
    if (!form || !form.reportValidity()) return;
    setChecking(true);
    try {
      if (!window.grecaptcha) throw new Error("Security verification is loading.");
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha?.ready(() => window.grecaptcha?.execute(siteKey, { action }).then(resolve).catch(reject));
      });
      let input = form.elements.namedItem("recaptcha_token") as HTMLInputElement | null;
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "recaptcha_token";
        form.appendChild(input);
      }
      input.value = token;
      form.requestSubmit();
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      {siteKey ? <Script src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`} strategy="afterInteractive" /> : null}
      <button className={className} type="submit" onClick={submit} disabled={checking}>
        {checking ? "Verifying..." : children}
      </button>
    </>
  );
}
