import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicFlashMessage } from "@/lib/flash-messages";
import { resetPassword } from "./actions";

type ResetParams = {
  error?: string;
  expired?: string;
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<ResetParams> }) {
  const params = await searchParams;
  const errorMessage = publicFlashMessage(params.error);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unavailable = Boolean(params.expired) || !user;

  return (
    <AuthShell
      eyebrow="Secure recovery"
      title={unavailable ? "This recovery link is no longer active" : "Choose a new password"}
      description={
        unavailable
          ? "Recovery links are time-limited and can only be used once. Request a fresh link to continue."
          : "Use a new password with at least eight characters. All existing sessions will be signed out."
      }
    >
      {unavailable ? (
        <div className="space-y-4">
          <div className="rounded-md border border-coral/20 bg-coral/10 p-4 text-sm leading-6 text-ink/70">
            The link may have expired, already been used, or been opened in a different browser.
          </div>
          <Link className="focus-ring inline-flex rounded-md bg-ink px-5 py-3 font-semibold text-white" href="/forgot-password">
            Request a new recovery link
          </Link>
        </div>
      ) : (
        <form action={resetPassword} className="space-y-4">
          {errorMessage ? <div className="rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-coral">{errorMessage}</div> : null}
          <label className="grid gap-2 text-sm font-semibold">
            New password
            <input className="focus-ring rounded-md border border-ink/15 px-4 py-3 font-normal" minLength={8} name="password" type="password" autoComplete="new-password" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Confirm new password
            <input className="focus-ring rounded-md border border-ink/15 px-4 py-3 font-normal" minLength={8} name="confirm_password" type="password" autoComplete="new-password" required />
          </label>
          <button className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 font-semibold text-white" type="submit">
            <KeyRound className="h-4 w-4" />
            Update password
          </button>
        </form>
      )}
    </AuthShell>
  );
}
