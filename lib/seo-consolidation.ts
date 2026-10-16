/**
 * Content consolidation map (see docs/seo/content-consolidation-plan.md).
 *
 * Each cluster names one canonical winner and the public URLs merged into it.
 * Merged URLs answer with a 308 (next.config.ts) and are excluded from hubs,
 * the sitemap, the RSS feed, llms.txt and related-guide links. Their markdown
 * and registry entries stay in place so a merge is reverted by deleting the
 * path from lib/seo-consolidation.json.
 */
import consolidation from "./seo-consolidation.json";

export type ConsolidationMoneyLink = {
  href: string;
  label: string;
};

export type ConsolidationCluster = {
  id: string;
  priority: "P0" | "P1" | "P2";
  label: string;
  primaryKeyword: string;
  winner: string;
  moneyLinks?: ConsolidationMoneyLink[];
  redirects: string[];
};

export const consolidationClusters = consolidation.clusters as ConsolidationCluster[];

const destinationsBySource = new Map(
  consolidationClusters.flatMap((cluster) => cluster.redirects.map((source) => [source, cluster.winner] as const)),
);
const clustersByWinner = new Map(consolidationClusters.map((cluster) => [cluster.winner, cluster]));

/** True when the public URL has been merged into a cluster winner and must not be linked or listed. */
export function isConsolidatedPath(path: string): boolean {
  return destinationsBySource.has(path);
}

/** The cluster winner that replaced a merged URL, if the URL was merged. */
export function consolidationDestination(path: string): string | undefined {
  return destinationsBySource.get(path);
}

/** The consolidation cluster a page wins, if any. */
export function consolidationClusterForWinner(path: string): ConsolidationCluster | undefined {
  return clustersByWinner.get(path);
}
