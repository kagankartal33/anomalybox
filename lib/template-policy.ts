export type TemplatePolicyPage = {
  section?: string;
  title: string;
};

/**
 * Protect actual reusable templates, while keeping editorial comparisons such
 * as "boxes vs digital templates" publicly readable.
 */
export function isPurchaseProtectedTemplate(page: TemplatePolicyPage): boolean {
  return page.section === "templates" || /\btemplate\b/i.test(page.title);
}
