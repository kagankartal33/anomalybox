import markdownData from "./seo-package-markdown.json";

/** Loaded only by article pages. Hubs must not import this file. */
export function getSeoPackageMarkdown(slug: string): string | null {
  return (markdownData as Record<string, string>)[slug] ?? null;
}
