const base = "http://127.0.0.1:3011";

async function body(path) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

let lastError;
for (let attempt = 0; attempt < 10; attempt += 1) {
  try {
    await body("/pricing");
    lastError = undefined;
    break;
  } catch (error) {
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
if (lastError) throw lastError;

const [protectedPage, protectedHub, protectedLegacy, publicComparison, resources, sitemap, llms] = await Promise.all([
  body("/templates/content-production-brief-template"),
  body("/templates"),
  body("/resources/reels-creative-brief-template-for-brands"),
  body("/resources/physical-creative-direction-box-vs-digital-templates"),
  body("/resources"),
  body("/sitemap.xml"),
  body("/llms.txt"),
]);

const checks = {
  protectedPageShowsGate: protectedPage.includes("Sign in to check your access."),
  protectedPageHidesTitle: !protectedPage.includes("Content Production Brief Template for Solo and Small Teams"),
  protectedPageHidesBody: !protectedPage.includes("organises multi-format content after the concept"),
  protectedHubShowsGate: protectedHub.includes("Sign in to check your access."),
  protectedLegacyShowsGate: protectedLegacy.includes("Sign in to check your access."),
  publicComparisonRemainsPublic: publicComparison.includes("Physical Creative Direction Boxes vs Digital Templates"),
  publicHubHidesProtectedCard: !resources.includes("Reels Creative Brief Template for Skincare &amp; Beauty Brands"),
  sitemapHidesProtectedRoutes: !sitemap.includes("/templates/") && !sitemap.includes("reels-creative-brief-template-for-brands"),
  llmsHidesProtectedRoutes: !llms.includes("/templates/") && !llms.includes("reels-creative-brief-template-for-brands"),
};

for (const [name, passed] of Object.entries(checks)) {
  console.log(`${name}: ${passed ? "PASS" : "FAIL"}`);
}

if (Object.values(checks).some((passed) => !passed)) process.exit(1);