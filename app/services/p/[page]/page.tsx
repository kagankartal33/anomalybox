import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Services & Direction";
const DESCRIPTION = "How Anomaly Box briefs and private direction fit a real shoot week.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("services");
}
export const generateMetadata = hubPagedMetadata("/services", TITLE, DESCRIPTION);

export default function ServicesPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "services", title: TITLE, description: DESCRIPTION, params });
}
