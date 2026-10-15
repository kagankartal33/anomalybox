import { clsx } from "clsx";

const colors: Record<string, string> = {
  delivered: "bg-teal/10 text-teal",
  under_review: "bg-citron/30 text-ink",
  needs_inventory: "bg-coral/10 text-coral",
  unopened: "bg-citron/30 text-ink",
  opened: "bg-teal/10 text-teal",
  paid: "bg-teal/10 text-teal",
  pending: "bg-citron/30 text-ink",
  available: "bg-teal/10 text-teal",
  private_card: "bg-teal/10 text-teal",
  creator: "bg-white text-ink/70",
  admin: "bg-ink text-white",
  read: "bg-white text-ink/50",
  accepted: "bg-teal/10 text-teal",
  rejected: "bg-coral/10 text-coral",
  replaced: "bg-[#5B2A86]/10 text-[#5B2A86]",
  closed: "bg-white text-ink/50",
};

const labels: Record<string, string> = {
  under_review: "under review",
  needs_inventory: "needs inventory",
  private_card: "creative brief",
};
export function StatusPill({ value }: { value: string | null | undefined }) {
  const text = String(value ?? "unknown");
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", colors[text] ?? "bg-white text-ink/70")}>
      {labels[text] ?? text.replaceAll("_", " ")}
    </span>
  );
}
