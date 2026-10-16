"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import type { CheckoutFulfillmentState } from "@/lib/stripe-fulfillment";
import { premiumAssets } from "@/lib/premium-assets";

type StatusPayload = {
  state: CheckoutFulfillmentState;
  message?: string;
};

const statusCopy: Record<CheckoutFulfillmentState, { label: string; title: string; body: string }> = {
  delivered: {
    label: "Secured",
    title: "Your creative brief is ready in Creator Vault.",
    body: "Payment is confirmed and your private briefs have been assigned exactly once.",
  },
  pending: {
    label: "Finalizing",
    title: "We are confirming your secure delivery.",
    body: "Keep this page open. The Creator Vault will update as soon as payment confirmation completes.",
  },
  attention: {
    label: "Protected",
    title: "Your purchase needs a fulfillment review.",
    body: "Your payment record is protected. No second payment is required; the Anomaly Box team can complete the delivery.",
  },
  refunded: {
    label: "Refunded",
    title: "This payment has been refunded.",
    body: "Previously revealed briefs remain retired and will never be returned to inventory.",
  },
};

export function CheckoutStatusCard({
  sessionId,
  initialState,
  initialMessage,
}: {
  sessionId: string;
  initialState: CheckoutFulfillmentState;
  initialMessage?: string;
}) {
  const [status, setStatus] = useState<StatusPayload>({ state: initialState, message: initialMessage });
  const copy = statusCopy[status.state];

  useEffect(() => {
    if (status.state !== "pending") return;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as StatusPayload;
          setStatus(payload);
          if (payload.state !== "pending") window.clearInterval(timer);
        }
      } finally {
        if (attempts >= 20) window.clearInterval(timer);
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [sessionId, status.state]);

  const Icon = status.state === "delivered" ? CheckCircle2 : status.state === "pending" ? Clock3 : ShieldAlert;

  return (
    <div className="grid overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative min-h-64 bg-ink lg:min-h-[520px]">
        <Image
          src={premiumAssets.marketing.howReceive}
          alt="An Anomaly Box creative brief secured in a calm production workspace"
          fill
          sizes="(max-width: 1023px) 100vw, 45vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex items-center p-7 sm:p-10 lg:p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-plum/15 bg-plum-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-plum-deep">
            <Icon className="h-4 w-4" />
            {copy.label}
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">{copy.title}</h1>
          <p className="mt-4 leading-7 text-ink/65">{status.message ?? copy.body}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {status.state === "delivered" ? (
              <Link className="focus-ring inline-flex justify-center rounded-md bg-ink px-6 py-3 font-semibold text-white" href="/boxes">
                Open Creator Vault
              </Link>
            ) : (
              <button
                className="focus-ring rounded-md bg-ink px-6 py-3 font-semibold text-white"
                type="button"
                onClick={() => window.location.reload()}
              >
                Refresh status
              </button>
            )}
            <Link className="focus-ring inline-flex justify-center rounded-md border border-ink/15 px-6 py-3 font-semibold" href="/profile">
              View account
            </Link>
          </div>

          {status.state === "attention" ? (
            <p className="mt-6 text-sm text-ink/60">
              Need help? <a className="font-semibold underline" href="mailto:support@anomalybox.com">support@anomalybox.com</a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
