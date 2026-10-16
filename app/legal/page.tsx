import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Terms, Privacy, and Digital Goods Policy | Anomaly Box",
  description: "Anomaly Box terms of service, privacy policy, and digital goods fulfillment policy.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto py-10 prose prose-neutral">
        <h1 className="text-4xl font-semibold">Legal</h1>

        <div className="mt-8 space-y-10">
          <section>
            <h2 className="text-2xl font-semibold">Terms of Service</h2>
            <p className="text-sm text-ink/70 mt-2">Last updated: August 2026</p>
            <div className="mt-4 text-sm leading-relaxed text-ink/80 space-y-4">
              <p>Anomaly Box provides access to premium, execution-ready creator briefs delivered digitally through a private vault experience. All sales are final once the brief is delivered to your vault.</p>
              <p>You may not copy, redistribute, or resell the briefs. Briefs are licensed for your personal or brand use only.</p>
              <p>We reserve the right to modify or discontinue the service. By purchasing or accessing Anomaly Box you agree to these terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Privacy Policy</h2>
            <p className="text-sm text-ink/70 mt-2">Last updated: August 2026</p>
            <div className="mt-4 text-sm leading-relaxed text-ink/80 space-y-4">
              <p>We collect only what is necessary to deliver creative briefs and run the service: account information, purchase and delivery records, category and creator-mode preferences, optional profile details, and support or Atelier request messages you send us.</p>
              <p>We do not sell personal data. Payment processing is handled by Stripe; authentication may use Supabase Auth providers you choose (for example email or Google).</p>
              <p>You can request account deletion at any time by contacting us at support@anomalybox.com.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Refunds &amp; Digital Goods</h2>
            <div className="mt-4 text-sm leading-relaxed text-ink/80 space-y-4">
              <p>All Anomaly Box purchases are digital goods. Once a creative brief is delivered to your Creator Vault, it is considered fulfilled.</p>
              <p>Because the briefs are available in Creator Vault after delivery, we do not offer refunds after fulfillment.</p>
              <p>If you experience a technical issue preventing access to your purchased box, contact us within 7 days and we will assist.</p>
            </div>
          </section>
        </div>

        <p className="mt-12 text-xs text-ink/60">
          For questions: <a href="mailto:support@anomalybox.com" className="underline">support@anomalybox.com</a>
        </p>

        <div className="mt-8">
          <Link href="/" className="text-sm underline">Back to home</Link>
        </div>
      </div>
    </PublicShell>
  );
}
