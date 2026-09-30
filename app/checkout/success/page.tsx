import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CheckoutStatusCard } from "@/components/CheckoutStatusCard";
import { getCheckoutStatusForUser } from "@/lib/checkout-status";
import { requireUser } from "@/lib/auth";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { user } = await requireUser();
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/store");

  let result;
  try {
    result = await getCheckoutStatusForUser(sessionId, user.id);
  } catch {
    redirect("/store?checkout=invalid");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl py-6 sm:py-10">
        <CheckoutStatusCard
          sessionId={sessionId}
          initialState={result.state}
          initialMessage={result.message}
        />
      </div>
    </AppShell>
  );
}