import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Instagram Reels Guides";
const DESCRIPTION =
  "Build Reels around a clear promise, a strong opening frame, visible proof, and a scene plan that fits the way you actually create.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("reels");
}
export const generateMetadata = hubPagedMetadata("/reels", TITLE, DESCRIPTION);

export default function ReelsPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "reels", title: TITLE, description: DESCRIPTION, params });
}
