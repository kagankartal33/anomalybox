import registry from "./seo-package-registry.json";
import { resources } from "@/lib/seo-content";

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

export const llmsPublicPages: LlmPublicPage[] = [...registryPages, ...legacyPages];