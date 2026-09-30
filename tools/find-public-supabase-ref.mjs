/** Read-only diagnostic for the Supabase project URL embedded in public JS. */
const base = new URL(process.argv[2] || "https://anomalybox.com/store");
const html = await (await fetch(base)).text();
const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((match) => new URL(match[1], base).href);
const refs = new Set();
for (const script of scripts) {
  const source = await (await fetch(script)).text();
  for (const match of source.matchAll(/https:\/\/([a-z0-9]+)\.supabase\.co/g)) refs.add(match[1]);
}
console.log([...refs].join("\