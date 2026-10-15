import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

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
    <div className="min-h-screen bg-[#F7F4ED] flex flex-col justify-between">
      <SiteHeader
        isAuthenticated={isAuthenticated}
        role={role}
        unreadCount={unread}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
