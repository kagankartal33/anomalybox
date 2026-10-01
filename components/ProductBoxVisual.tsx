import { Gem, Sparkles } from "lucide-react";

export type ProductBoxVariant = "red" | "purple" | "black";

type ProductBoxVisualProps = {
  variant: ProductBoxVariant;
  opened?: boolean;
  cardCount?: number;
  label?: string;
  className?: string;
};

const themes = {
  red: {
    shell: "bg-[#3B1719]",
    lid: "bg-[#9F2637]",
    body: "bg-[#D74654]",
    ribbon: "bg-[#FFD2BC]",
    glow: "bg-[#FFF1EA]",
    foil: "bg-[#FFD8C2]",
    accent: "text-[#B42335]",
    cardLine: "bg-[#FFD8C2]",
  },
  purple: {
    shell: "bg-[#28153B]",
    lid: "bg-[#5B2A86]",
    body: "bg-[#8E5BD6]",
    ribbon: "bg-[#D8B4FE]",
    glow: "bg-[#EFE6FF]",
    foil: "bg-[#F3D7FF]",
    accent: "text-[#6D28D9]",
    cardLine: "bg-[#E9D5FF]",
  },
  black: {
    shell: "bg-[#070707]",
    lid: "bg-[#191919]",
    body: "bg-[#101010]",
    ribbon: "bg-[#D9E2F2]",
    glow: "bg-[#E7ECF5]",
    foil: "bg-[#E9EEF8]",
    accent: "text-[#0D0D0D]",
    cardLine: "bg-[#D9E2F2]",
  },
} satisfies Record<ProductBoxVariant, Record<string, string>>;

export function ProductBoxVisual({
  variant,
  opened = false,
  cardCount = 3,
  label,
  className = "",
}: ProductBoxVisualProps) {
  const theme = themes[variant];
  const displayLabel = label ?? (opened ? `${cardCount} cards revealed` : "sealed creator box");

  return (
    <div className={`viralbox-art relative mx-auto h-56 w-full max-w-[330px] ${opened ? "is-open" : "is-sealed"} ${className}`}>
      <div className={`absolute left-1/2 top-10 h-24 w-52 -translate-x-1/2 rounded-[28px] blur-2xl transition-opacity duration-500 ${theme.glow} ${opened ? "opacity-90" : "opacity-55 group-hover:opacity-85"}`} />
      {variant === "black" ? (
        <div className="absolute left-1/2 top-8 h-36 w-36 -translate-x-1/2 rotate-45 rounded-[18px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.025)_38%,rgba(115,130,156,0.18)_64%,rgba(0,0,0,0.02))] shadow-[0_28px_70px_-44px_rgba(255,255,255,0.7)]" />
      ) : null}
      <div className={`absolute inset-x-8 bottom-4 h-28 rounded-[10px] border border-white/25 ${theme.shell} shadow-soft`} />
      <div className={`viralbox-lid absolute inset-x-5 bottom-[126px] h-12 origin-bottom rounded-[10px] border border-white/30 ${theme.lid} shadow-soft transition-transform duration-500`} />
      <div className={`absolute inset-x-10 bottom-10 h-32 rounded-[9px] border border-white/25 ${theme.body} shadow-inner`} />
      <div className="absolute inset-x-12 bottom-10 h-32 rounded-[8px] bg-gradient-to-br from-white/18 via-transparent to-ink/10" />
      <div className={`absolute left-1/2 bottom-10 h-32 w-7 -translate-x-1/2 ${theme.ribbon}`} />
      <div className={`absolute inset-x-10 bottom-[94px] h-7 ${theme.ribbon}`} />
      <div className={`absolute left-1/2 bottom-[78px] grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border border-white/40 ${theme.foil} shadow-soft`}>
        <Gem className={`h-6 w-6 ${variant === "black" ? "text-[#101010]" : theme.accent}`} />
      </div>
      {opened ? (
        <>
          <div className="viralbox-card-rise viralbox-card-rise-left absolute left-9 top-4 h-32 w-20 rotate-[-10deg] rounded-md border border-ink/10 bg-white shadow-soft">
            <div className={`mx-3 mt-4 h-1.5 rounded-full ${theme.cardLine}`} />
            <div className="mx-3 mt-3 h-1 rounded-full bg-ink/10" />
            <div className="mx-3 mt-2 h-1 rounded-full bg-ink/10" />
          </div>
          <div className="viralbox-card-rise viralbox-card-rise-center absolute left-1/2 top-0 h-36 w-24 -translate-x-1/2 rounded-md border border-ink/10 bg-white shadow-soft">
            <div className={`mx-4 mt-5 h-1.5 rounded-full ${theme.cardLine}`} />
            <div className="mx-4 mt-3 h-1 rounded-full bg-ink/10" />
            <div className="mx-4 mt-2 h-1 rounded-full bg-ink/10" />
            <div className="mx-4 mt-2 h-1 rounded-full bg-ink/10" />
          </div>
          <div className="viralbox-card-rise viralbox-card-rise-right absolute right-9 top-5 h-32 w-20 rotate-[11deg] rounded-md border border-ink/10 bg-white shadow-soft">
            <div className={`mx-3 mt-4 h-1.5 rounded-full ${theme.cardLine}`} />
            <div className="mx-3 mt-3 h-1 rounded-full bg-ink/10" />
            <div className="mx-3 mt-2 h-1 rounded-full bg-ink/10" />
          </div>
        </>
      ) : (
        <div className="absolute left-1/2 top-10 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-white/90 shadow-soft transition-transform duration-500 group-hover:scale-110">
          <Sparkles className={`h-7 w-7 ${variant === "black" ? "text-[#101010]" : theme.accent}`} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{displayLabel}</div>
    </div>
  );
}