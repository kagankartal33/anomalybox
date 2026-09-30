import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("resources");
export const generateMetadata = packageGenerateMetadata("resources");
export default packagePage("resources");