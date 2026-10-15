import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Creator Lanes";
const DESCRIPTION =
  "Lane-specific strategy notes so beauty, fitness, travel, UGC, and founder content stay recognizable.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("creator-lanes");
}
export const generateMetadata = hubPagedMetadata("/creator-lanes", TITLE, DESCRIPTION);

export default function CreatorLanesPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "creator-lanes", title: TITLE, description: DESCRIPTION, params });
}
