import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { safeNextPath } from "@/lib/navigation";
import { BOX_PRICING, boxPriceLabel } from "@/lib/pricing";
import { publicFlashMessage } from "@/lib/flash-messages";
import { isOAuthProviderEnabled } from "@/lib/supabase/auth-settings";
import { signInWithPassword, signUpWithPassword } from "./actions";

type LoginParams = {
  error?: string;
  next?: string;
  password?: string;
  signup?: string;
};

function parseStoreReservation(nextPath: string) {
  if (!nextPath.startsWith("/store")) return null;
  try {
    const url = new URL(nextPath, "https://anomalybox.local");
    const box = url.searchParams.get("box");
    const category = url.searchParams.get("category");
    const persona = url.searchParams.get("persona");
    if (!box && !category && !persona) return null;

    const boxLabel =
      box === "premium_viral_box_1000"
        ? `Signature Purple Box (${boxPriceLabel("premium_viral_box_1000")} • ${BOX_PRICING.premium_viral_box_1000.briefCount} Briefs)`
        : box === "viral_box_500"
          ? `Classic Red Box (${boxPriceLabel("viral_box_500")} • ${BOX_PRICING.viral_box_500.briefCount} Briefs)`
          : "Creative Brief Package";

    const categoryLabel = category
      ? category
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : null;

    const personaLabel = persona
      ? persona
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : null;

    return { boxLabel, categoryLabel, personaLabel };
  } catch {
    return null;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginParams> }) {
  const params = await searchParams;
  const errorMessage = publicFlashMessage(params.error);
  const next = safeNextPath(params.next, "/profile");
  const encodedNext = encodeURIComponent(next);
  const reservation = parseStoreReservation(next);
  const [googleEnabled, appleEnabled] = await Promise.all([
    isOAuthProviderEnabled("google"),
    isOAuthProviderEnabled("apple"),
  ]);
  const oauthAvailable = googleEnabled || appleEnabled;

  return (
    <AuthShell
      eyebrow={reservation ? "Checkout in progress" : "Secure creator access"}
      title={reservation ? "Claim your creative brief" : "Welcome to your private workspace"}
      description={
        reservation
          ? "Sign in or create an account below to enter your secure Creator Vault and complete checkout."
          : "Sign in to configure a creative brief, complete checkout, and access it securely in Creator Vault."
      }
    >
      {reservation ? (
        <div className="mb-6 rounded-xl border border-plum/30 bg-plum-soft/50 p-4 text-sm text-ink shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-plum-deep">
            <LockKeyhole className="h-4 w-4" />
            <span>Dossier Configuration Reserved</span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-ink/10 bg-white px-2.5 py-1 font-bold text-ink shadow-xs">
              {reservation.boxLabel}
            </span>
            {reservation.categoryLabel ? (
              <span className="rounded-md border border-ink/10 bg-white px-2.5 py-1 font-medium text-ink/80 shadow-xs">
                Lane: {reservation.categoryLabel}
              </span>
            ) : null}
            {reservation.personaLabel ? (
              <span className="rounded-md border border-ink/10 bg-white px-2.5 py-1 font-medium text-ink/80 shadow-xs">
                Mode: {reservation.personaLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-ink/70">
            Sign in or register below to claim this reservation. Your selected parameters are locked and ready for instant delivery in your Creator Vault.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-5 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-coral">{errorMessage}</div>
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
                  className="focus-ring flex items-center justify-center gap-2.5 rounded-md border border-ink/15 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-paper hover:border-ink/25"
                  aria-label="Continue with Google"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </a>
              ) : null}
              {appleEnabled ? (
                <a
                  href={`/api/auth/apple?next=${encodedNext}`}
                  className="focus-ring flex items-center justify-center gap-2.5 rounded-md border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                  aria-label="Continue with Apple"
                >
                  <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 170 170" aria-hidden="true">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.64-14.01-6.19-9.58-11.03-20.4-14.53-32.47-3.5-12.06-5.25-23.47-5.25-34.22 0-14.36 3.65-26.47 10.95-36.33 7.3-9.86 16.59-14.89 27.87-15.08 5.43 0 11.29 1.41 17.58 4.23 6.29 2.82 10.3 4.3 12.04 4.44 1.3.13 5.43-1.48 12.39-4.83 6.96-3.35 13.04-4.8 18.24-4.35 14.57 1.15 25.66 6.84 33.27 17.07-13.04 7.9-19.4 18.59-19.08 32.07.33 10.55 4.3 19.35 11.91 26.41 7.61 7.06 16.74 11.09 27.39 12.09-2.17 6.52-4.78 12.93-7.82 19.23zM119.22 33.02c0-7.39 2.66-14.35 7.98-20.87 5.32-6.52 11.85-10.87 19.58-13.05.76 2.61 1.14 5.32 1.14 8.15 0 7.39-2.77 14.45-8.31 21.18-5.54 6.74-12.17 11.09-19.89 13.05-.11-2.83-.5-5.65-.5-8.46z" />
                  </svg>
                  <span>Continue with Apple</span>
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-plum/15 bg-plum-soft/45 px-4 py-3 text-center">
            <div className="text-sm font-semibold text-ink/70">Social sign-in is being configured.</div>
            <p className="mt-1 text-xs leading-5 text-ink/60">Email sign-in remains fully available.</p>
          </div>
        )}

        <div className="border-t border-ink/10 pt-5">
          <div className="mb-3 text-sm font-semibold text-ink/80">New to Anomaly Box?</div>
          <form action={signUpWithPassword} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <label className="sr-only" htmlFor="sign-up-name">Display name (optional)</label>
            <input
              id="sign-up-name"
              className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
              name="display_name"
              autoComplete="name"
              placeholder="Display name (optional)"
            />
            <label className="sr-only" htmlFor="sign-up-email">Email address</label>
            <input
              id="sign-up-email"
              className="focus-ring w-full rounded-md border border-ink/15 px-4 py-3"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              required
            />
            <label className="sr-only" htmlFor="sign-up-password">Create password</label>
            <input
              id="sign-up-password"
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

      <p className="mt-6 text-xs leading-5 text-ink/60">
        Your Store configuration remains ready after authentication. By continuing, you agree to the{" "}
        <Link href="/legal" className="underline underline-offset-2">Anomaly Box terms</Link>.
      </p>
    </AuthShell>
  );
}
