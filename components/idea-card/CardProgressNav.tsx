"use client";

/**
 * CardProgressNav
 * Ultra-compact sticky navigation bar for the card detail page.
 * Highlights the active section using IntersectionObserver.
 * Provides instant 1-tap "Shoot Mode" access with zero viewport clutter on mobile.
 */

import { useEffect, useRef, useState } from "react";
import { Video, ChevronRight } from "lucide-react";

const SECTIONS = [
  { id: "section-brief", label: "Brief" },
  { id: "section-shoot", label: "Shoot Plan" },
  { id: "section-checklist", label: "Final Check" },
  { id: "section-guide", label: "Visual Guide" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

interface CardProgressNavProps {
  onShootMode: () => void;
}

export function CardProgressNav({ onShootMode }: CardProgressNavProps) {
  const [active, setActive] = useState<SectionId>("section-brief");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionEls = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (sectionEls.length === 0) return;

    const visibleSet = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSet.add(entry.target.id);
          } else {
            visibleSet.delete(entry.target.id);
          }
        }

        for (const section of SECTIONS) {
          if (visibleSet.has(section.id)) {
            setActive(section.id);
            break;
          }
        }
      },
      {
        rootMargin: "-10% 0px -60% 0px",
        threshold: 0,
      },
    );

    for (const el of sectionEls) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  function scrollTo(id: SectionId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? "Brief";

  return (
    <nav
      aria-label="Card sections"
      className="print:hidden sticky top-0 z-40 flex h-11 sm:h-12 items-center justify-between gap-2 border-b border-ink/10 bg-[#F7F4ED]/95 px-3 sm:px-6 backdrop-blur-md"
    >
      {/* Mobile only compact breadcrumb indicator */}
      <div className="flex items-center gap-1.5 sm:hidden min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-plum">
          Section
        </span>
        <ChevronRight className="h-3 w-3 text-ink/30 shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold text-ink truncate">
          {activeLabel}
        </span>
      </div>

      {/* Desktop section tabs */}
      <ol className="hidden sm:flex items-center gap-1" role="list">
        {SECTIONS.map((section, idx) => {
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollTo(section.id)}
                aria-current={isActive ? "step" : undefined}
                className={`focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-ink text-white shadow-2xs"
                    : "text-ink/60 hover:bg-paper hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-paper text-ink/40"
                  }`}
                >
                  {idx + 1}
                </span>
                {section.label}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Shoot Mode CTA Button */}
      <button
        type="button"
        onClick={onShootMode}
        className="focus-ring flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-1 text-xs font-bold text-white transition hover:bg-black active:scale-98 shadow-sm sm:px-3.5 sm:py-1.5"
        aria-label="Open full-screen Shoot mode"
      >
        <Video className="h-3.5 w-3.5 text-red-400 fill-red-400" aria-hidden="true" />
        <span>Shoot Mode</span>
      </button>
    </nav>
  );
}
