/**
 * Retire explicitly approved SEO package pages from every public artifact.
 * The source package remains archival; import_seo_package_v6.py owns the
 * matching denylist so future imports cannot restore retired pages.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const retired = new Set(["reels-shot-list-template", "ugc-brief-template"]);

function insideRoot(target) {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function writeJson(relativePath, value, pretty = false) {
  if (!insideRoot(target)) throw new Error(`Refusing out-of-workspace write: ${target}`);
  fs.writeFileSync(target, `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`);
}

const registryPath = path.join(root, "lib", "seo-package-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
registry.pages = (registry.pages ?? []).filter((page) => !retired.has(page.slug));
registry.count = registry.pages.length;
writeJson("lib/seo-package-registry.json", registry, true);

const linksPath = path.join(root, "lib", "seo-package-links.json");
const links = JSON.parse(fs.readFileSync(linksPath, "utf8"));
for (const slug of retired) delete links.links?.[slug];
for (const [slug, items] of Object.entries(links.links ?? {})) {
  links.links[slug] = items.filter((item) => !retired.has(item.slug));
}
links.count = Object.keys(links.links ?? {}).length;
writeJson("lib/seo-package-links.json", links, true);

const markdownPath = path.join(root, "lib", "seo-package-markdown.json");
const markdown = JSON.parse(fs.readFileSync(markdownPath, "utf8"));
for (const slug of retired) delete markdown[slug];
writeJson("lib/seo-package-markdown.json", markdown);

const exactFiles = [];
for (const slug of retired) {
  exactFiles.push(
    path.join(root, "content", "seo-package", `${slug}.md`),
    path.join(root, "public", "assets", "image-prompts", `${slug}.md`),
    path.join(root, "public", "assets", "seo-package", `${slug}.webp`),
    path.join(root, "public", "assets", "seo-package", `${slug}-hero.webp`),
  );
}
for (const target of exactFiles) {
  if (!insideRoot(target)) throw new Error(`Refusing out-of-workspace delete: ${target}`);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

const assetDirectory = path.join(root, "public", "assets", "seo-package");
const assetHash = crypto.createHash("sha256");
for (const name of fs.readdirSync(assetDirectory).filter((name) => name.endsWith(".webp")).sort()) {
  assetHash.update(name);
  assetHash.update("\0");
  assetHash.update(fs.readFileSync(path.join(assetDirectory, name)));
  assetHash.update("\0");
}
const assetVersion = assetHash.digest("hex").slice(0, 16);
const packageSourcePath = path.join(root, "lib", "seo-package.ts");
const packageSource = fs.readFileSync(packageSourcePath, "utf8").replace(
  /SEO_PACKAGE_ASSET_VERSION\s*=\s*"[a-f0-9]{16}"/,
  `SEO_PACKAGE_ASSET_VERSION = "${assetVersion}"`,
);
fs.writeFileSync(packageSourcePath, packageSource, "utf8");

console.log(`Retired ${retired.size} SEO pages; ${registry.count} public package pages remain; asset version ${assetVersion}.`);