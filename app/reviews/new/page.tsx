import { AppShell } from "@/components/AppShell";
import { ReviewUploadForm } from "@/components/ReviewUploadForm";
import { requireUser } from "@/lib/auth";

export default async function NewReviewPage({ searchParams }: { searchParams: Promise<{ idea_id?: string; delivery_item_id?: string }> }) {
  const params = await searchParams;
  await requireUser();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <section className="mb-5 rounded-md border border-ink/10 bg-ink p-6 text-white shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/45">Manual review</p>
          <h1 className="mt-2 text-4xl font-semibold">Submit your draft video.</h1>
          <p className="mt-3 leading-7 text-white/70">The admin team will compare your video against the card checklist and send practical revision feedback.</p>
        </section>
        <ReviewUploadForm ideaId={params.idea_id} deliveryItemId={params.delivery_item_id} />
      </div>
    </AppShell>
  );
}