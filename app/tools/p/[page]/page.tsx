import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Creator Tools & Checklists";
const DESCRIPTION = "Lightweight tools that help you decide, filter concepts, and protect production energy.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("tools");
}
export const generateMetadata = hubPagedMetadata("/tools", TITLE, DESCRIPTION);

export default function ToolsPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "tools", title: TITLE, description: DESCRIPTION, params });
}
