import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("creator-lanes");
export const generateMetadata = packageGenerateMetadata("creator-lanes");
export default packagePage("creator-lanes");
