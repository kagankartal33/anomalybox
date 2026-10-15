"use client";

import { useState } from "react";
import { Copy, Check, Printer, Video } from "lucide-react";
import type { PresentedCard } from "@/lib/idea-card";

/**
 * CardExportActions
 * Copy-for-Notion/Markdown + Print/PDF actions.
 * Generates an Oscar-grade call sheet and markdown document including the narrative spine.
 */
export function CardExportActions({
  card,
  onShootMode,
}: {
  card: PresentedCard;
  onShootMode: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    let md = `# ${card.title}\n\n`;

    if (card.hookLine) {
      md += `> **Opening Hook (0:00 - 0:03):** "${card.hookLine}"\n\n`;
    }

    if (card.whyItWorks) {
      md += `**Why Viewers Stop:** ${card.whyItWorks}\n\n`;
    }

    if (card.viewerLeaveWith) {
      md += `**What They Keep:** ${card.viewerLeaveWith}\n\n`;
    }

    md += `### Production Specs\n`;
    md += `- **Format:** ${card.meta.format}\n`;
    md += `- **Final video:** ${card.meta.durationLabel}\n`;
    if (card.meta.filmingEstimateLabel) md += `- **Estimated filming:** ${card.meta.filmingEstimateLabel}\n`;
    if (card.meta.editingEstimateLabel) md += `- **Estimated editing:** ${card.meta.editingEstimateLabel}\n`;
    md += `- **Difficulty:** ${card.meta.difficultyLabel}\n`;
    if (card.meta.categoryLabel) md += `- **Lane:** ${card.meta.categoryLabel}\n`;
    if (card.meta.shootFormatLabel) md += `- **Shoot Format:** ${card.meta.shootFormatLabel}\n`;
    if (card.meta.presenceLabel) md += `- **Camera Presence:** ${card.meta.presenceLabel}\n`;

    if (card.kit && card.kit.length > 0) {
      md += `- **Required Kit:** ${card.kit.join(", ")}\n`;
    }
    md += `\n`;

    // Narrative Story Spine
    const spineItems =
      card.storySpine && card.storySpine.length > 0
        ? card.storySpine
        : card.steps.map((s) => s.stageLabel || s.purpose);

    if (spineItems.length > 0) {
      md += `### Story Spine (Video Flow)\n`;
      spineItems.forEach((beat, idx) => {
        md += `${idx + 1}. ${beat}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n## Scene-by-Scene Shoot Plan\n\n`;

    card.steps.forEach((step, idx) => {
      md += `### [ ] Scene ${idx + 1}: ${step.stageLabel}\n`;
      md += `*Goal: ${step.purpose}*\n\n`;

      if (step.spokenLine) {
        md += `- **Say this:** "${step.spokenLine}"\n`;
      }
      if (step.action) {
        md += `- **Action & Movement:** ${step.action}\n`;
      }
      if (step.shot) {
        md += `- **Camera & Frame:** ${step.shot}\n`;
      }
      if (step.onScreenText) {
        md += `- **On-Screen Text:** "${step.onScreenText}"\n`;
      }
      if (step.editNote || step.performanceNote) {
        md += `- **Edit & Cut:** ${step.editNote || step.performanceNote}\n`;
      }
      md += `\n`;
    });

    if (card.safety.bullets.length > 0 || card.overallProductionNotes.length > 0) {
      md += `## Checks Before You Post\n\n`;
      if (card.overallProductionNotes.length > 0) {
        card.overallProductionNotes.forEach((note) => {
          md += `- [ ] ${note}\n`;
        });
      }
      if (card.safety.bullets.length > 0) {
        card.safety.bullets.forEach((bullet) => {
          md += `- [ ] ${bullet}\n`;
        });
      }
      md += `\n`;
    }

    md += `---\n*Anomaly Box — anomalybox.com*\n`;
    return md;
  };

  const handleCopy = async () => {
    try {
      const text = generateMarkdown();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
      {/* Shoot Mode — triggers parent-owned modal */}
      <button
        type="button"
        onClick={onShootMode}
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black transition shadow-sm active:scale-98 focus-ring"
      >
        <Video className="h-3.5 w-3.5 text-red-400 fill-red-400" aria-hidden="true" />
        <span>Open Shoot Mode</span>
      </button>

      {/* Copy for Notion / Markdown */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink/80 hover:border-ink/30 hover:bg-paper transition focus-ring"
        title="Copy complete structured brief with story spine and checklist"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span className="text-emerald-700 font-bold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-ink/60" aria-hidden="true" />
            <span>Copy brief</span>
          </>
        )}
      </button>

      {/* Print / Save PDF Call Sheet */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink/80 hover:border-ink/30 hover:bg-paper transition focus-ring"
        title="Print or save as high-res director's call sheet PDF"
      >
        <Printer className="h-3.5 w-3.5 text-ink/60" aria-hidden="true" />
        <span>Print / PDF</span>
      </button>
    </div>
  );
}
