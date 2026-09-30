"use client";

import { useState } from "react";

export function CheckoutButton({
  boxProductSlug,
  categorySlug,
  personaSlug,
  disabled,
}: {
  boxProductSlug: string;
  categorySlug: string;
  personaSlug: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ box_product_slug: boxProductSlug, category_slug: categorySlug, persona_slug: personaSlug }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error === "inventory_unavailable" ? "This creator lane is temporarily unavailable." : "Checkout could not be started.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div>
      <button
        className="focus-ring w-full rounded-md bg-ink px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
        disabled={disabled || loading}
        onClick={checkout}
        type="button"
      >
        {loading ? "Opening secure checkout..." : disabled ? "Currently unavailable" : "Buy this ViralBox"}
      </button>
      {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
    </div>
  );
}