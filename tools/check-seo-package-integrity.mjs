/**
 * Deployment-blocking integrity check for the curated public SEO package.
 *
 * Legacy resources remain available at their existing detail URLs, but public
 * editorial hubs must only render registry pages backed by the new WebP set.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "lib", "seo-package-registry.json");
const packageSourcePath = path.join(root, "lib", "seo-package.ts");
const packageAssetsPath = path.join(root, "public", "assets", "seo-package");
const linkGraphPath = path.join(root, "lib", "seo-package-links.json");
const markdownRendererPath = path.join(root, "components", "MarkdownRenderer.tsx");
const articleSourcePath = path.join(root, "components", "SeoPackageArticle.tsx");
const packageContentPath = path.join(root, "content", "seo-package");
const legacyContentPath = path.join(root, "content", "resources");
const markdownMapPath = path.join(root, "lib", "seo-package-markdown.json");
const consolidationPath = path.join(root, "lib", "seo-consolidation.json");
const seoContentPath = path.join(root, "lib", "seo-content.ts");
const hubPageSize = 9;
// Static public routes that may win a consolidation cluster (money pages).
const staticWinnerRoutes = new Map([
  ["/pricing", "app/pricing/page.tsx"],
  ["/store", "app/store/page.tsx"],
  ["/atelier", "app/atelier/page.tsx"],
  ["/dossiers/classic-red", "app/dossiers/[slug]/page.tsx"],
  ["/dossiers/signature-purple", "app/dossiers/[slug]/page.tsx"],
]);
const expectedPageCount = 110;

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const pages = Array.isArray(registry.pages) ? registry.pages : [];
const errors = [];

if (pages.length !== expectedPageCount) {
  errors.push(`expected ${expectedPageCount} registry pages, found ${pages.length}`);
}

const paths = new Set();
const images = new Set();

for (const page of pages) {
  const slug = page.slug || "unknown";
  const canonicalPath = page.path || "";
  const image = page.image || "";

  if (paths.has(canonicalPath)) errors.push(`duplicate canonical path: ${canonicalPath}`);
  if (images.has(image)) errors.push(`duplicate image path: ${image}`);
  paths.add(canonicalPath);
  images.add(image);

  if (!image.startsWith("/assets/seo-package/") || !image.endsWith(".webp")) {
    errors.push(`invalid package image path: ${slug}`);
    continue;
  }

  const thumbnail = path.join(root, "public", image.slice(1));
  const hero = thumbnail.replace(/\.webp$/, "-hero.webp");
  if (!fs.existsSync(thumbnail)) errors.push(`missing package thumbnail: ${slug}`);
  if (!fs.existsSync(hero)) errors.push(`missing package hero: ${slug}`);
}

const packageSource = fs.readFileSync(packageSourcePath, "utf8");
if (!packageSource.includes("export const seoPackagePages: SeoPackagePage[] = registryPages;")) {
  errors.push("public SEO hubs are not pinned to registryPages");
}
if (!packageSource.includes("const routablePages = [...registryPages, ...legacyResourcePages];")) {
  errors.push("legacy route compatibility is not isolated from public hubs");
}

const assetNames = fs
  .readdirSync(packageAssetsPath)
  .filter((name) => name.endsWith(".webp"))
  .sort();
const assetHash = crypto.createHash("sha256");
for (const name of assetNames) {
  assetHash.update(name);
  assetHash.update("\0");
  assetHash.update(fs.readFileSync(path.join(packageAssetsPath, name)));
  assetHash.update("\0");
}
const computedAssetVersion = assetHash.digest("hex").slice(0, 16);
const configuredVersion = packageSource.match(
  /SEO_PACKAGE_ASSET_VERSION\s*=\s*"([a-f0-9]{16})"/,
)?.[1];
if (configuredVersion !== computedAssetVersion) {
  errors.push(
    `SEO_PACKAGE_ASSET_VERSION must be ${computedAssetVersion}; found ${configuredVersion || "missing"}`,
  );
}

const validPaths = new Set(pages.map((page) => page.path));
for (const name of fs.readdirSync(legacyContentPath).filter((name) => name.endsWith(".md"))) {
  validPaths.add(`/resources/${name.slice(0, -3)}`);
}
const linkGraph = JSON.parse(fs.readFileSync(linkGraphPath, "utf8")).links || {};
for (const [sourceSlug, items] of Object.entries(linkGraph)) {
  const seen = new Set();
  for (const item of items) {
    if (!item.path || !validPaths.has(item.path)) {
      errors.push(`broken related guide target: ${sourceSlug} -> ${item.path || "missing"}`);
    }
    if (item.slug === sourceSlug) {
      errors.push(`self-referencing related guide: ${sourceSlug}`);
    }
    if (seen.has(item.path)) {
      errors.push(`duplicate related guide target: ${sourceSlug} -> ${item.path}`);
    }
    seen.add(item.path);
  }
}

const markdownRendererSource = fs.readFileSync(markdownRendererPath, "utf8");
const articleSource = fs.readFileSync(articleSourcePath, "utf8");
if (!markdownRendererSource.includes('import Link from "next/link";')) {
  errors.push("MarkdownRenderer does not render internal links with Next Link");
}
if (!articleSource.includes("stripEmbeddedRelatedGuides(markdown.replace")) {
  errors.push("embedded Related guides blocks are not stripped before rendering");
}

const markdownMap = JSON.parse(fs.readFileSync(markdownMapPath, "utf8"));
const expectedMarkdown = new Map();
for (const directory of [packageContentPath, legacyContentPath]) {
  for (const name of fs.readdirSync(directory).filter((name) => name.endsWith(".md"))) {
    const slug = name.slice(0, -3);
    const markdown = fs.readFileSync(path.join(directory, name), "utf8").replace(/\r\n/g, "\n");
    if (!expectedMarkdown.has(slug)) expectedMarkdown.set(slug, markdown);
    const fenceCount = (markdown.match(/^```/gm) || []).length;
    if (fenceCount % 2 !== 0) errors.push(`unbalanced code fence: ${name}`);
  }
}
for (const [slug, markdown] of expectedMarkdown) {
  if ((markdownMap[slug] || "").replace(/\r\n/g, "\n") !== markdown) {
    errors.push(`stale markdown map entry: ${slug}`);
  }
}
if (Object.keys(markdownMap).length !== expectedMarkdown.size) {
  errors.push(`markdown map count: expected ${expectedMarkdown.size}, found ${Object.keys(markdownMap).length}`);
}

// Content consolidation: every merged URL must exist today, redirect in one hop to a live, indexable
// page, and never be a winner itself. Retired hub pages must be beyond the new last page.
const consolidation = JSON.parse(fs.readFileSync(consolidationPath, "utf8"));
const isProtected = (page) => page.section === "templates" || /\btemplate\b/i.test(page.title || "");
const seoContentSource = fs.readFileSync(seoContentPath, "utf8");
const segmentPaths = new Set(
  [...(seoContentSource.split("export const resources")[0] || "").matchAll(/slug: "([^"]+)"/g)].map(
    (match) => `/content-ideas/${match[1]}`,
  ),
);
const legacyPaths = new Set(
  fs
    .readdirSync(legacyContentPath)
    .filter((name) => name.endsWith(".md"))
    .map((name) => `/resources/${name.slice(0, -3)}`),
);
const publicArticlePaths = new Set([
  ...pages.filter((page) => !isProtected(page)).map((page) => page.path),
  ...legacyPaths,
  ...segmentPaths,
]);
const consolidationSources = new Set();
const consolidationWinners = new Set();
for (const cluster of consolidation.clusters || []) {
  if (!cluster.id || !cluster.winner || !cluster.primaryKeyword || !Array.isArray(cluster.redirects)) {
    errors.push(`consolidation cluster is incomplete: ${cluster.id || "unknown"}`);
    continue;
  }
  if (consolidationWinners.has(cluster.winner)) errors.push(`consolidation winner used twice: ${cluster.winner}`);
  consolidationWinners.add(cluster.winner);
  const staticRoute = staticWinnerRoutes.get(cluster.winner);
  if (staticRoute ? !fs.existsSync(path.join(root, staticRoute)) : !publicArticlePaths.has(cluster.winner)) {
    errors.push(`consolidation winner is not a live public page: ${cluster.winner}`);
  }
  for (const link of cluster.moneyLinks || []) {
    if (!staticWinnerRoutes.has(link.href) || !link.label) {
      errors.push(`consolidation money link must target a money page: ${cluster.id} -> ${link.href}`);
    }
  }
  for (const source of cluster.redirects) {
    if (consolidationSources.has(source)) errors.push(`consolidation source listed twice: ${source}`);
    consolidationSources.add(source);
    if (source === cluster.winner) errors.push(`consolidation source redirects to itself: ${source}`);
    if (!publicArticlePaths.has(source)) errors.push(`consolidation source is not a public article: ${source}`);
  }
}
for (const winner of consolidationWinners) {
  if (consolidationSources.has(winner)) errors.push(`consolidation chain: winner ${winner} is also merged`);
}
const remainingPublic = pages.filter((page) => !isProtected(page) && !consolidationSources.has(page.path));
const hubCounts = new Map([["resources", remainingPublic.length]]);
for (const page of remainingPublic) {
  if (page.section !== "resources") hubCounts.set(page.section, (hubCounts.get(page.section) || 0) + 1);
}
for (const retired of consolidation.retiredHubPages || []) {
  const match = /^\/([a-z-]+)\/p\/(\d+)$/.exec(retired.source || "");
  if (!match) {
    errors.push(`retired hub page has an invalid path: ${retired.source}`);
    continue;
  }
  const lastPage = Math.max(1, Math.ceil((hubCounts.get(match[1]) || 0) / hubPageSize));
  if (Number(match[2]) <= lastPage) {
    errors.push(`retired hub page still exists: ${retired.source} (last page is ${lastPage})`);
  }
  if (retired.destination !== `/${match[1]}`) {
    errors.push(`retired hub page must redirect to its hub root: ${retired.source}`);
  }
}

if (errors.length > 0) {
  console.error("SEO package integrity failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `SEO package integrity passed: ${pages.length} registry pages, ${pages.length * 2} WebP assets, version ${computedAssetVersion}, legacy hubs isolated, ${consolidationSources.size} URLs consolidated into ${consolidationWinners.size} winners.`,
);
