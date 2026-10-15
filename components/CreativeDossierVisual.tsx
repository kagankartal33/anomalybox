import Image from "next/image";
import { premiumAssets } from "@/lib/premium-assets";

export type CreativeDossierVariant = "red" | "purple" | "black";

type CreativeDossierVisualProps = {
  variant: CreativeDossierVariant;
  available?: boolean;
  itemCount?: number;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const dossierByVariant: Record<CreativeDossierVariant, { image: string; accent: string; name: string }> = {
  red: {
    image: premiumAssets.dossiers.classic,
    accent: "bg-[#963B48]",
    name: "classic red",
  },
  purple: {
    image: premiumAssets.dossiers.signature,
    accent: "bg-[#725F7B]",
    name: "signature purple",
  },
  black: {
    image: premiumAssets.dossiers.atelier,
    accent: "bg-[#27272A]",
    name: "atelier black",
  },
};

const sizeClass = {
  sm: "h-44 max-w-[250px]",
  md: "h-64 max-w-[420px]",
  lg: "h-80 max-w-[540px]",
};

export function CreativeDossierVisual({
  variant,
  available = false,
  itemCount = 3,
  label,
  className = "",
  size = "md",
}: CreativeDossierVisualProps) {
  const dossier = dossierByVariant[variant];
  const displayLabel = label ?? (available ? `${itemCount} briefs available` : "private shoot brief");
  const alt = available
    ? `${dossier.name} Anomaly Box creative brief package with ${itemCount} briefs available`
    : `${dossier.name} Anomaly Box creative brief package secured in a production studio`;

  return (
    <div
      className={`creative-dossier mx-auto grid w-full grid-rows-[minmax(0,1fr)_auto] ${sizeClass[size]} ${available ? "is-available" : "is-secured"} ${className}`}
    >
      <div className="relative min-h-0 overflow-hidden rounded-xl bg-[#171619]">
        <Image
          src={dossier.image}
          alt={alt}
          fill
          sizes="(max-width: 768px) 78vw, 380px"
          className="object-cover transition duration-500 ease-out group-hover:scale-[1.015]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" aria-hidden="true" />
        <div
          className={`absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm ${dossier.accent}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#B8F2D0]" : "bg-white/70"}`} aria-hidden="true" />
          {available ? "Available" : "Secured"}
        </div>
      </div>
      <div
        className={`px-1 pt-2 text-center text-[10px] font-semibold uppercase leading-[1.35] tracking-[0.14em] [overflow-wrap:anywhere] ${
          variant === "black" ? "text-white/85" : "text-ink"
        }`}
      >
        {displayLabel}
      </div>
    </div>
  );
}
