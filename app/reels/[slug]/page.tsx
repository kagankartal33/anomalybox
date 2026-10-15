import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("reels");
export const generateMetadata = packageGenerateMetadata("reels");
export default packagePage("reels");
