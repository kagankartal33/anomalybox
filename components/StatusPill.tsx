import { clsx } from "clsx";

const colors: Record<string, string> = {
  delivered: "bg-teal/10 text-teal",
  under_review: "bg-citron/30 text-ink",
  revision_requested: "bg-coral/10 text-coral",
  ready_to_post: "bg-teal/10 text-teal",
  blocked: "bg-ink text-white",
  needs_inventory: "bg-coral/10 text-coral",
  unopened: "bg-citron/30 text-ink",
  opened: "bg-teal/10 text-teal",
  paid: "bg-teal/10 text-teal",
  pending: "bg-citron/30 text-ink",
  partial: "bg-citron/30 text-ink",
  missing: "bg-coral/10 text-coral",
  pass: "bg-teal/10 text-teal",
  not_applicable: "bg-white text-ink/50",
  available: "bg-teal/10 text-teal",
  creator: "bg-white text-ink/70",
  admin: "bg-ink text-white",
  read: "bg-white text-ink/50",
};

const labels: Record<string, string> = {
  under_review: "under review",
  revision_requested: "revision requested",
  ready_to_post: "ready to post",
  needs_inventory: "needs inventory",
  not_applicable: "not applicable",
};

export function StatusPill({ value }: { value: string | null | undefined }) {
  const text = String(value ?? "unknown");
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", colors[text] ?? "bg-white text-ink/70")}>
      {labels[text] ?? text.replaceAll("_", " ")}
    </span>
  );
}