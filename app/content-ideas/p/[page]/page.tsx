import { generateHubPagedParams, hubPagedMetadata, renderHubPagedPage } from "@/lib/hub-section-route";

const TITLE = "Content Ideas Ready to Shoot";
const DESCRIPTION =
  "Ideas become useful when a creator can film them. These guides organize audience tension, proof, opening frame, and production boundaries.";

export const revalidate = 300;
export function generateStaticParams() {
  return generateHubPagedParams("content-ideas");
}
export const generateMetadata = hubPagedMetadata("/content-ideas", TITLE, DESCRIPTION);

export default function ContentIdeasPaged({ params }: { params: Promise<{ page: string }> }) {
  return renderHubPagedPage({ section: "content-ideas", title: TITLE, description: DESCRIPTION, params });
}
