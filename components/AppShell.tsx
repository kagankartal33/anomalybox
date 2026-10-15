import Link from "next/link";
import { Bell, Boxes, Gem, LayoutDashboard, LogIn, LogOut, Package, UserRound } from "lucide-react";
import { PremiumIcon } from "@/components/PremiumIcon";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "creator";
  let unread = 0;
  if (user) {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    ]);
    role = profile?.role ?? "creator";
    unread = count ?? 0;
  }

  const isAuthenticated = Boolean(user);

  return (
    <div className="min-h-screen bg-[#F7F4ED]">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-[#FBF9F5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <Link href={isAuthenticated ? "/boxes" : "/"} className="flex items-center gap-2 font-semibold focus-ring">
            <PremiumIcon icon={Gem} size="sm" tone="ink" />
            ViralBox
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1 text-sm">
            {isAuthenticated ? (
              <>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/store"><Package className="mr-1 inline h-4 w-4" /> Store</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/boxes"><Boxes className="mr-1 inline h-4 w-4" /> Creator Vault</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/profile"><UserRound className="mr-1 inline h-4 w-4" /> Profile</Link>
                <Link aria-label={`${unread} unread notifications`} className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/profile#notifications"><Bell className="mr-1 inline h-4 w-4" /> {unread}</Link>
                {role === "admin" ? <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/admin"><LayoutDashboard className="mr-1 inline h-4 w-4" /> Admin</Link> : null}
                <form action="/api/auth/signout" method="post">
                  <button aria-label="Sign out" className="rounded-md px-3 py-2 hover:bg-white focus-ring" type="submit"><LogOut className="inline h-4 w-4" /></button>
                </form>
              </>
            ) : (
              <>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/">Home</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/store"><Package className="mr-1 inline h-4 w-4" /> Store</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/pricing">Pricing</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/resources">Resources</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/#how">How It Works</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/atelier">Atelier</Link>
                <Link className="rounded-md bg-ink px-3 py-2 text-white hover:bg-black focus-ring" href="/login"><LogIn className="mr-1 inline h-4 w-4" /> Login</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 py-10 text-sm text-ink/50">ViralBox premium creator workspace.</footer>
    </div>
  );
}