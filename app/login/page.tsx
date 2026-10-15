import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { safeNextPath } from "@/lib/navigation";
import { isOAuthProviderEnabled } from "@/lib/supabase/auth-settings";
import { signInWithPassword, signUpWithPassword } from "./actions";

type LoginParams = {
  error?: string;
  next?: string;
  password?: string;
  signup?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginParams> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/profile");
  const encodedNext = encodeURIComponent(next);
  const [googleEnabled, appleEnabled] = await Promise.all([
    isOAuthProviderEnabled("google"),
    isOAuthProviderEnabled("apple"),
  ]);
  const oauthAvailable = googleEnabled || appleEnabled;

  return (
    <AuthShell
      eyebrow="Secure creator access"
      title="Welcome to your private workspace"
      description="Sign in to configure a dossier, complete checkout, and access briefs secured to your Creator Vault."
    >
      {params.error ? (
        <div className="mb-5 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-coral">{params.error}</div>
      ) : null}
      {params.password === "reset" ? (
        <div className="mb-5 rounded-md border border-teal/20 bg-teal/10 p-3 text-sm text-teal">
          Your password has been updated. Sign in with the new password.
        </div>
      ) : null}
      {params.signup === "confirm" ? (
        <div className="mb-5 rounded-md border border-teal/20 bg-teal/10 p-3 text-sm leading-6 text-teal">
          Account created. Check your inbox to confirm your email, then sign in.
        </div>
      ) : null}

      <div className="space-y-6">
        <form action={signInWithPassword} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="sr-only" htmlFor="sign-in-email">Email address</label>
          <input
            id="sign-in-email"
            className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            required
          />
          <label className="sr-only" htmlFor="sign-in-password">Password</label>
          <input
            id="sign-in-password"
            className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            required
          />
          <div className="flex justify-end">
            <Link className="focus-ring rounded-sm text-sm font-semibold text-ink/60 underline underline-offset-4" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <TurnstileWidget />
          <button
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink py-3 font-semibold text-white"
            type="submit"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {oauthAvailable ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-ink/50">or continue securely</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {googleEnabled ? (
                <a
                  href={`/api/auth/google?next=${encodedNext}`}
                  className="focus-ring rounded-md border border-ink/15 px-4 py-3 text-center font-semibold hover:bg-plum-soft/60"
                >
                  Google
                </a>
              ) : null}
              {appleEnabled ? (
                <a
                  href={`/api/auth/apple?next=${encodedNext}`}
                  className="focus-ring rounded-md border border-ink/15 bg-ink px-4 py-3 text-center font-semibold text-white hover:bg-ink/90"
                >
                  Apple
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-plum/15 bg-plum-soft/45 px-4 py-3 text-center">
            <div className="text-sm font-semibold text-ink/70">Social sign-in is being configured.</div>
            <p className="mt-1 text-xs leading-5 text-ink/50">Email sign-in remains fully available.</p>
          </div>
        )}

        <div className="border-t border-ink/10 pt-5">
          <div className="mb-3 text-sm font-semibold text-ink/80">New to Anomaly Box?</div>
          <form action={signUpWithPassword} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <input
              className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
              name="display_name"
              autoComplete="name"
              placeholder="Display name (optional)"
            />
            <input
              className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              required
            />
            <input
              className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="Create password (8+ characters)"
              required
            />
            <TurnstileWidget />
            <button className="focus-ring w-full rounded-md bg-plum-deep py-3 font-semibold text-white hover:bg-[#3F3545]" type="submit">
              Create account
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs leading-5 text-ink/50">
        Your Store configuration remains ready after authentication. By continuing, you agree to the{" "}
        <Link href="/legal" className="underline underline-offset-2">Anomaly Box terms</Link>.
      </p>
    </AuthShell>
  );
}