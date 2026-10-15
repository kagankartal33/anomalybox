import registry from "./seo-package-registry.json";
import { resources } from "@/lib/seo-content";
import { isPurchaseProtectedTemplate } from "@/lib/template-policy";

export type LlmPublicPage = {
  path: string;
  title: string;
  description: string;
};

const registryPages = (registry.pages ?? []) as Array<Pick<LlmPublicPage, "path" | "title" | "description">>;
const legacyPages = resources.map((resource) => ({
  path: `/resources/${resource.slug}`,
  title: resource.title,
  description: resource.description,
}));

export const llmsPublicPages: LlmPublicPage[] = [...registryPages, ...legacyPages].filter(
  (page) => !isPurchaseProtectedTemplate({ section: sectionFromPath(page.path), title: page.title }),
);

function sectionFromPath(path: string): string {
  return path.split("/").filter(Boolean)[0] ?? "";
}
