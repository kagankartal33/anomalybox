import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={sent ? "Check your inbox" : "Reset your password"}
      description={
        sent
          ? "If an Anomaly Box account exists for that address, a secure recovery link is on its way."
          : "Enter the email attached to your creator account. We will send a time-limited recovery link."
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-md border border-teal/20 bg-teal/10 p-4 text-sm leading-6 text-ink/70">
            <div className="flex items-center gap-2 font-semibold text-teal">
              <Mail className="h-4 w-4" />
              Recovery email requested
            </div>
            <p className="mt-2">Check spam or promotions if it does not appear after a few minutes.</p>
          </div>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-3 font-semibold" href="/login">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      ) : (
        <form action={requestPasswordReset} className="space-y-4">
          <label className="grid gap-2 text-sm font-semibold">
            Email address
            <input
              className="focus-ring rounded-md border border-ink/15 px-4 py-3 font-normal"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <TurnstileWidget />
          <button className="focus-ring w-full rounded-md bg-ink px-5 py-3 font-semibold text-white" type="submit">
            Send secure reset link
          </button>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-ink/65 underline underline-offset-4" href="/login">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
