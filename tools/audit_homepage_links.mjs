async function checkPageLinks(path) {
  const res = await fetch(`https://anomalybox.com${path}`);
  const html = await res.text();
  const links = [...html.matchAll(/href=["'](\/[^"'#\s]+)["']/g)].map((m) => m[1]);
  const unique = [...new Set(links)].filter((l) => !l.startsWith("/_next") && !l.startsWith("/assets") && !l.startsWith("/favicon") && !l.includes(".png") && !l.includes(".webp"));
  console.log(`\nTotal content links on ${path}: ${unique.length}`);
  for (const l of unique) {
    console.log(`  ${l}`);
  }
}
async function run() {
  await checkPageLinks("/resources");
  await checkPageLinks("/content-ideas");
}
run().catch(console.error);
