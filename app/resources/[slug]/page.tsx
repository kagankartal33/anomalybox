import {
  packageGenerateMetadata,
  packageGenerateStaticParams,
  packagePage,
} from "@/lib/seo-package-page";

export const generateStaticParams = packageGenerateStaticParams("resources", {
  excludePurchaseProtected: true,
});
export const generateMetadata = packageGenerateMetadata("resources", {
  excludePurchaseProtected: true,
});
export default packagePage("resources", { excludePurchaseProtected: true });
