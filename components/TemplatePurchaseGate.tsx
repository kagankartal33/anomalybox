import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import type { TemplateAccessState } from "@/lib/template-access";

type Props = {
  accessState: TemplateAccessState;
  returnPath: string;
};

export function TemplatePurchaseGate({ accessState, returnPath }: Props) {
  const isAnonymous = accessState === "anonymous";
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;

  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_24px_80px_rgba(43,34,47,0.10)]">
          <div className="border-b border-ink/10 bg-plum-soft/45 px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Customer resource library
            </div>
          </div>
          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">
              {isAnonymous ? "Sign in to check your access." : "This resource unlocks after purchase."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/65 sm:text-lg">
              {isAnonymous
                ? "Purchased Anomaly Box customers can use the private production-resource library from the account connected to their Creator Vault."
                : "Your account is active, but it does not yet have a paid Anomaly Box purchase. Any completed creative brief purchase unlocks this library."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={isAnonymous ? loginHref : "/store"}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white transition hover:bg-plum-deep"
              >
                {isAnonymous ? "Sign in" : "Choose a creative brief"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={isAnonymous ? "/pricing" : "/boxes"}
                className="focus-ring inline-flex items-center rounded-xl border border-ink/15 bg-white px-6 py-3 font-semibold text-ink transition hover:bg-plum-soft/50"
              >
                {isAnonymous ? "View pricing" : "Open Creator Vault"}
              </Link>
            </div>

            <div className="mt-9 flex items-start gap-3 border-t border-ink/10 pt-6 text-sm leading-6 text-ink/60">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
              <p>Access is checked securely against the paid purchase history on your signed-in account.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
