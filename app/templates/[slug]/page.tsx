import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const dynamic = "force-dynamic";
export const generateStaticParams = packageGenerateStaticParams("templates");
export const generateMetadata = packageGenerateMetadata("templates", { requiresPurchase: true });
export default packagePage("templates", { requiresPurchase: true });
