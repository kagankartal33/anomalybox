import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Creator Content Guides & Production Tools";
const DESCRIPTION =
  "Plan stronger content with practical guidance on audience fit, hooks, visual proof, shot lists, scripts, editing, and sustainable production.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("resources");
}
export const generateMetadata = hubPagedMetadata("/resources", "Creator Content Guides", DESCRIPTION);

export default function ResourcesPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "resources", title: TITLE, description: DESCRIPTION, params });
}
