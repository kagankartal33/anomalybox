import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Creator Personas";
const DESCRIPTION =
  "Direction that respects capacity, privacy, and proof style — not one-size-fits-all content advice.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("creator-personas");
}
export const generateMetadata = hubPagedMetadata("/creator-personas", TITLE, DESCRIPTION);

export default function CreatorPersonasPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "creator-personas", title: TITLE, description: DESCRIPTION, params });
}
