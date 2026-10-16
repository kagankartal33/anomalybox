import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Table, HelpCircle } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  
  let inMermaid = false;
  let mermaidLines: string[] = [];

  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];

  let bulletItems: string[] = [];
  let numberedItems: string[] = [];
  const seenH2 = new Set<string>();

  const flushTable = (key: string) => {
    if (tableHeaders.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="my-8 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-md">
          <div className="flex items-center gap-2 border-b border-ink/10 bg-plum-soft/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-plum-deep">
            <Table className="h-4 w-4" /> Visual Direction Decision Matrix
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink/80">
              <thead className="bg-ink/5 text-xs font-bold uppercase tracking-wider text-ink/70">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-6 py-4 border-b border-ink/10">{h.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-plum-soft/20 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-6 py-4 font-medium leading-relaxed">
                        {cell.trim().startsWith("**") && cell.trim().endsWith("**") ? (
                          <strong className="text-ink font-semibold">{cell.trim().slice(2, -2)}</strong>
                        ) : (
                          parseInlineFormatting(cell.trim())
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  const flushMermaid = (key: string) => {
    // Extract step titles from mermaid lines and sanitize internal technical terms
    const steps: string[] = [];
    mermaidLines.forEach((l) => {
      const match = l.match(/\["([^"]+)"\]/);
      if (match) {
        let text = match[1];
        text = text.replace(/Research & Citation Ledger/gi, "Topic & Audience Research");
        text = text.replace(/Information Gain Structuring/gi, "Shot List & Script Breakdown");
        text = text.replace(/Anti-AI Burstiness Polish/gi, "Visual & Lighting Setup");
        text = text.replace(/Originality Gate Verification/gi, "Edit Assembly & Quality Assurance");
        steps.push(text);
      }
    });

    elements.push(
      <div key={`mermaid-${key}`} className="my-8 rounded-2xl border border-plum/20 bg-gradient-to-br from-ink via-ink/95 to-plum-deep/90 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-plum-soft">
            <Sparkles className="h-4 w-4 text-yellow-300" /> Shoot-Ready Execution Workflow
          </div>
          <span className="rounded-full bg-plum-soft/20 px-3 py-1 text-[11px] font-semibold text-plum-soft border border-white/15">
            Production Framework
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <div key={idx} className="relative rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-[10px] font-bold uppercase tracking-widest text-plum-soft">
                Step 0{idx + 1}
              </div>
              <div className="mt-2 text-sm font-semibold text-white leading-snug">
                {step}
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-white/55">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
    inMermaid = false;
    mermaidLines = [];
  };

  const flushCode = (key: string) => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${key}`} className="my-6 overflow-x-auto rounded-2xl border border-ink/10 bg-ink p-5 text-sm leading-relaxed text-white shadow-md">
          <code data-language={codeLanguage || undefined}>{codeLines.join("\n")}</code>
        </pre>
      );
    }
    inCode = false;
    codeLanguage = "";
    codeLines = [];
  };

  const flushLists = (key: string) => {
    if (bulletItems.length > 0) {
      elements.push(
        <ul key={`bullets-${key}`} className="my-5 list-disc space-y-2 pl-6 text-base leading-relaxed text-ink/80 sm:text-lg">
          {bulletItems.map((item, index) => (
            <li key={index} className="pl-1 marker:text-plum-deep">
              {parseInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (numberedItems.length > 0) {
      elements.push(
        <ol key={`numbers-${key}`} className="my-5 list-decimal space-y-3 pl-7 text-base leading-relaxed text-ink/80 sm:text-lg">
          {numberedItems.map((item, index) => (
            <li key={index} className="pl-1 marker:font-bold marker:text-plum-deep">
              {parseInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
    }
    bulletItems = [];
    numberedItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Mermaid start/end
    if (line.trim().startsWith("```mermaid")) {
      inMermaid = true;
      mermaidLines = [];
      continue;
    }
    if (inMermaid) {
      if (line.trim().startsWith("```")) {
        flushMermaid(`m-${i}`);
      } else {
        mermaidLines.push(line);
      }
      continue;
    }

    // Standard fenced code blocks
    if (line.trim().startsWith("```") && !inCode) {
      inCode = true;
      codeLanguage = line.trim().slice(3).trim();
      codeLines = [];
      continue;
    }
    if (inCode) {
      if (line.trim().startsWith("```")) {
        flushCode(`c-${i}`);
      } else {
        codeLines.push(line);
      }
      continue;
    }

    // Markdown Table parsing
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.split("|").filter((c) => c.trim() !== "");
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else if (line.includes("---")) {
        // Table separator line, ignore
        continue;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(`t-${i}`);
    }

    // Group consecutive Markdown list items into semantic lists.
    const bulletMatch = line.match(/^[-*+]\s+(.*)/);
    if (bulletMatch) {
      if (numberedItems.length > 0) flushLists(`mixed-${i}`);
      bulletItems.push(bulletMatch[1]);
      continue;
    }
    const numMatch = line.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      if (bulletItems.length > 0) flushLists(`mixed-${i}`);
      numberedItems.push(numMatch[1]);
      continue;
    }
    flushLists(`l-${i}`);

    // Ignore H1 if it repeats the title
    if (line.startsWith("# ")) {
      continue;
    }

    // H2 headings
    if (line.startsWith("## ")) {
      const headingText = sanitizeVisibleText(line.replace("## ", "").trim())
        .replace(/^Information gain matrix/i, "Production decision matrix");
      let nextContentIndex = i + 1;
      while (nextContentIndex < lines.length && lines[nextContentIndex].trim() === "") {
        nextContentIndex += 1;
      }
      const emptySection = nextContentIndex >= lines.length || /^#{1,2}\s+/.test(lines[nextContentIndex]);
      const headingKey = headingText.toLocaleLowerCase("en");
      if (emptySection || seenH2.has(headingKey)) continue;
      seenH2.add(headingKey);
      elements.push(
        <h2 key={i} className="mt-12 mb-4 text-2xl font-bold text-ink flex items-center gap-3 border-l-4 border-plum-deep pl-4">
          {headingText}
        </h2>
      );
      continue;
    }

    // H3 FAQ headings
    if (line.startsWith("### ")) {
      const faqText = sanitizeVisibleText(line.replace("### ", "").trim());
      elements.push(
        <div key={i} className="mt-8 mb-2 flex items-center gap-2 text-xl font-bold text-ink">
          <HelpCircle className="h-5 w-5 text-plum-deep shrink-0" />
          <h3>{faqText}</h3>
        </div>
      );
      continue;
    }

    // Suppress Source Ledger ID badges completely
    if (line.trim().includes("Source Ledger ID") || line.trim().includes("SRC-0001")) {
      continue;
    }

    // Key Lead Summary Paragraph (Clean styling without technical AEO labels)
    if (line.trim().startsWith("**") && line.trim().endsWith("**") && line.trim().length > 30) {
      const boldText = line.trim().slice(2, -2);
      elements.push(
        <div key={i} className="my-6 rounded-2xl border border-plum/20 bg-plum-soft/30 p-6 shadow-sm">
          <p className="text-base font-semibold leading-relaxed text-ink">
            {boldText}
          </p>
        </div>
      );
      continue;
    }

    // Blockquotes and summary callouts
    const quoteMatch = line.match(/^>\s?(.*)/);
    if (quoteMatch) {
      const quote = sanitizeVisibleText(quoteMatch[1]).replace(/^\*\*Quick take:\*\*\s*/i, "");
      elements.push(
        <blockquote key={i} className="my-7 rounded-2xl border-l-4 border-plum-deep bg-plum-soft/30 px-6 py-5 text-base leading-relaxed text-ink/80 shadow-sm sm:text-lg">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-plum-deep">Quick take</span>
          {parseInlineFormatting(quote)}
        </blockquote>
      );
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-10 border-0 border-t border-ink/10" />);
      continue;
    }

    // Normal Paragraph
    if (line.trim().length > 0) {
      elements.push(
        <p key={i} className="my-4 text-base sm:text-lg leading-relaxed text-ink/80">
          {parseInlineFormatting(sanitizeVisibleText(line))}
        </p>
      );
    }
  }


  // Flush table if file ends with table
  if (inTable) {
    flushTable("end");
  }
  if (inCode) {
    flushCode("end");
  }
  flushLists("end");

  return <div className="prose prose-lg max-w-none text-ink">{elements}</div>;
}

function parseInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (href.startsWith("/")) {
        return (
          <Link key={idx} href={href} className="focus-ring rounded-sm font-semibold text-plum-deep underline decoration-plum/35 underline-offset-4 transition hover:decoration-plum-deep">
            {label}
          </Link>
        );
      }
      if (/^https?:\/\//i.test(href)) {
        return (
          <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="focus-ring rounded-sm font-semibold text-plum-deep underline decoration-plum/35 underline-offset-4 transition hover:decoration-plum-deep">
            {label}
          </a>
        );
      }
      return label;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.9em] text-ink">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function sanitizeVisibleText(text: string): string {
  return text
    .replace(/Zero-Click Summary/gi, "Quick take")
    .replace(/SEO operator rules/gi, "Practical publishing rules")
    .replace(/Information Gain Structuring/gi, "Production structure")
    .replace(/Anti-AI Burstiness Polish/gi, "Editorial polish")
    .replace(/Originality Gate Verification/gi, "Originality review");
}
