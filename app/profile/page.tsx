import Link from "next/link";
import { Camera, KeyRound, Mail, Scale, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { NotificationList } from "@/components/NotificationList";
import { PremiumIcon } from "@/components/PremiumIcon";
import { StatusPill } from "@/components/StatusPill";
import { requireUser } from "@/lib/auth";
import { changeProfilePassword, updateProfileIdentity, uploadProfileAvatar } from "./actions";

type ProfileParams = {
  account?: string;
  avatar?: string;
  password?: string;
  error?: string;
};

function initials(value: string) {
  const parts = value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "VB").toUpperCase();
}

function providerNames(providers: unknown) {
  return Array.isArray(providers) ? providers.map(String) : [];
}

function accountMessage(params: ProfileParams) {
  if (params.error) return { tone: "error", text: params.error };
  if (params.account === "updated") return { tone: "success", text: "Account details updated." };
  if (params.avatar === "updated") return { tone: "success", text: "Avatar updated." };
  if (params.password === "updated") return { tone: "success", text: "Password updated." };
  return null;
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<ProfileParams> }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase.from("profiles").select("display_name,role,plan,avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const displayName = profile?.display_name ?? user.email ?? "Anomaly Box creator";
  const providers = providerNames(user.app_metadata?.providers);
  const googleOnly = providers.includes("google") && !providers.includes("email");
  const message = accountMessage(params);

  return (
    <AppShell>
      <section className="mb-6 rounded-md border border-ink/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Account settings</p>
            <h1 className="mt-2 text-4xl font-semibold">{displayName}</h1>
            <p className="mt-2 max-w-2xl text-ink/60">
              Manage your identity, avatar, password, legal access, and account notifications.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill value={profile?.role ?? "creator"} />
            <StatusPill value={profile?.plan ?? "free"} />
          </div>
        </div>
      </section>

      {message ? (
        <div className={`mb-6 rounded-md border p-3 text-sm ${message.tone === "error" ? "border-coral/20 bg-coral/10 text-coral" : "border-teal/20 bg-teal/10 text-teal"}`}>
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <PremiumIcon icon={UserRound} tone="ink" />
              <div>
                <h2 className="text-2xl font-semibold">Profile identity</h2>
                <p className="text-sm text-ink/60">This is the name and image attached to your Anomaly Box account.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="rounded-md border border-ink/10 bg-paper/70 p-4">
                <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-full border border-ink/10 bg-white shadow-sm">
                  {profile?.avatar_url ? (
                    <span
                      aria-label={`${displayName} avatar`}
                      className="block h-full w-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url(${profile.avatar_url})` }}
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-ink/45">{initials(displayName)}</span>
                  )}
                </div>
                <form action={uploadProfileAvatar} className="mt-4 grid gap-3" encType="multipart/form-data">
                  <label className="grid gap-2 text-sm font-semibold">
                    Avatar image
                    <input accept="image/png,image/jpeg,image/webp" className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal" name="avatar" required type="file" />
                  </label>
                  <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white" type="submit">
                    <Camera className="h-4 w-4" />
                    Upload avatar
                  </button>
                  <p className="text-xs leading-5 text-ink/50">PNG, JPG, or WebP. Maximum 2 MB.</p>
                </form>
              </div>

              <form action={updateProfileIdentity} className="grid content-start gap-4">
                <label className="grid gap-2 text-sm font-semibold">
                  Display name
                  <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" defaultValue={profile?.display_name ?? ""} maxLength={120} name="display_name" placeholder="Your name" />
                </label>
                <div className="rounded-md border border-ink/10 bg-paper/70 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <Mail className="h-4 w-4 text-teal" />
                    Email
                  </div>
                  <p className="mt-2 text-ink/65">{user.email}</p>
                </div>
                <button className="focus-ring w-full rounded-md bg-ink px-5 py-3 font-semibold text-white sm:w-fit" type="submit">
                  Save account details
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <PremiumIcon icon={KeyRound} tone="teal" />
              <div>
                <h2 className="text-2xl font-semibold">Change password</h2>
                <p className="text-sm text-ink/60">Use at least 8 characters. Your session may refresh after the update.</p>
              </div>
            </div>
            {googleOnly ? (
              <div className="mt-5 rounded-md border border-ink/10 bg-paper/70 p-4 text-sm leading-6 text-ink/65">
                If your account uses Google login, password changes may not apply unless email/password login is enabled.
              </div>
            ) : null}
            <form action={changeProfilePassword} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                New password
                <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" minLength={8} name="password" required type="password" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Confirm new password
                <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" minLength={8} name="confirm_password" required type="password" />
              </label>
              <div className="md:col-span-2">
                <button className="focus-ring rounded-md bg-ink px-5 py-3 font-semibold text-white" type="submit">
                  Update password
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <PremiumIcon icon={Scale} tone="purple" />
              <div>
                <h2 className="text-2xl font-semibold">User Agreement & Legal</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                  By using Anomaly Box and purchasing digital dossiers, you agree to the Terms, Privacy Policy, and Digital Goods policy.
                </p>
                <Link className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-3 text-sm font-semibold hover:bg-paper" href="/legal">
                  <ShieldCheck className="h-4 w-4" />
                  Open legal documents
                </Link>
              </div>
            </div>
          </div>
        </section>

        <aside id="notifications" className="space-y-3">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <NotificationList notifications={notifications ?? []} />
        </aside>
      </div>
    </AppShell>
  );
}