import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("creator-personas");
export const generateMetadata = packageGenerateMetadata("creator-personas");
export default packagePage("creator-personas");
