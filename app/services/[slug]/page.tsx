import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("services");
export const generateMetadata = packageGenerateMetadata("services");
export default packagePage("services");
