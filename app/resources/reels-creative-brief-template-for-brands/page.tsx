import {
  packageGenerateMetadata,
  packagePage,
} from "@/lib/seo-package-page";

const slug = "reels-creative-brief-template-for-brands";
const params = Promise.resolve({ slug });

export const dynamic = "force-dynamic";

const generateProtectedMetadata = packageGenerateMetadata("resources", { requiresPurchase: true });
const ProtectedResourcePage = packagePage("resources", { requiresPurchase: true });

export function generateMetadata() {
  return generateProtectedMetadata({ params });
}

export default function Page() {
  return <ProtectedResourcePage params={params} />;
}
