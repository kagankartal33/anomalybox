import Image from "next/image";

export type CreativeDossierVariant = "red" | "purple" | "black";

type CreativeDossierVisualProps = {
  variant: CreativeDossierVariant;
  available?: boolean;
  itemCount?: number;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const dossierByVariant: Record<CreativeDossierVariant, { src: string; accent: string }> = {
  red: {
    src: "/assets/premium/studio/dossier-classic.webp",
    accent: "bg-[#A52434]",
  },
  purple: {
    src: "/assets/premium/studio/dossier-signature.webp",
    accent: "bg-[#6D3AA8]",
  },
  black: {
    src: "/assets/premium/studio/dossier-atelier.webp",
    accent: "bg-[#202124]",
  },
};

const sizeClass = {
  sm: "h-40 max-w-[230px]",
  md: "h-60 max-w-[380px]",
  lg: "h-80 max-w-[500px]",
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
  const displayLabel = label ?? (available ? `${itemCount} briefs available` : "secured creative dossier");
  const alt = available
    ? `${variant} creative dossier with ${itemCount} private briefs available`
    : `${variant} secured creative dossier`;

  return (
    <div
      className={`creative-dossier relative mx-auto w-full ${sizeClass[size]} ${available ? "is-available" : "is-secured"} ${className}`}
    >
      <div className="relative h-[calc(100%-1.5rem)] overflow-hidden rounded-[3px] bg-ink">
        <Image
          src={dossier.src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 78vw, 380px"
          className="object-cover transition duration-500 ease-out group-hover:scale-[1.015]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" aria-hidden="true" />
        <div
          className={`absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm ${dossier.accent}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#B8F2D0]" : "bg-white/70"}`} aria-hidden="true" />
          {available ? "Available" : "Secured"}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/48">
        {displayLabel}
      </div>
    </div>
  );
}