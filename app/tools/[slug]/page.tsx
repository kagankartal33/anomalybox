import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("tools");
export const generateMetadata = packageGenerateMetadata("tools");
export default packagePage("tools");
