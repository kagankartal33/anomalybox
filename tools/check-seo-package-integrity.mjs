/**
 * Deployment-blocking integrity check for the curated 112-page SEO package.
 *
 * Legacy resources remain available at their existing detail URLs, but public
 * editorial hubs must only render registry pages backed by the new WebP set.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "lib", "seo-package-registry.json");
const packageSourcePath = path.join(root, "lib", "seo-package.ts");
const expectedPageCount = 112;

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

if (errors.length > 0) {
  console.error("SEO package integrity failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `SEO package integrity passed: ${pages.length} registry pages, ${pages.length * 2} WebP assets, legacy hubs isolated.`,
);