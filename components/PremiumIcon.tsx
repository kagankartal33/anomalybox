import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

const tones = {
  ink: "border-ink/10 bg-ink text-white shadow-[0_18px_40px_-28px_rgba(20,20,20,0.75)]",
  red: "border-[#B42335]/15 bg-[#B42335] text-white shadow-[0_18px_40px_-28px_rgba(180,35,53,0.75)]",
  purple: "border-plum/20 bg-plum text-white shadow-[0_18px_40px_-28px_rgba(78,65,85,0.72)]",
  teal: "border-teal/15 bg-teal text-white shadow-[0_18px_40px_-28px_rgba(26,124,118,0.75)]",
  pearl: "border-ink/10 bg-white text-ink shadow-sm",
  blackDiamond: "border-white/12 bg-[#0D0D0D] text-[#D9E2F2] shadow-[0_28px_70px_-48px_rgba(255,255,255,0.55)]",
};

export type PremiumIconTone = keyof typeof tones;

export function PremiumIcon({
  className,
  icon: Icon,
  size = "md",
  tone = "ink",
}: {
  className?: string;
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  tone?: PremiumIconTone;
}) {
  const sizeClass = {
    sm: "h-8 w-8 rounded-md",
    md: "h-10 w-10 rounded-md",
    lg: "h-12 w-12 rounded-lg",
  }[size];

  const iconSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-5 w-5",
  }[size];

  return (
    <span className={clsx("relative inline-grid shrink-0 place-items-center border", sizeClass, tones[tone], className)}>
      <span className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-white/10" />
      <Icon className={clsx("relative", iconSize)} />
    </span>
  );
}
