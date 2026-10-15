import fs from "node:fs";
import path from "node:path";

const HOST = "anomalybox.com";
const BASE_URL = `https://${HOST}`;

// 1. Resolve IndexNow key
let key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  const publicDir = path.join(process.cwd(), "public");
  if (fs.existsSync(publicDir)) {
    const txtFiles = fs
      .readdirSync(publicDir)
      .filter((file) => /^[a-zA-Z0-9_-]{8,128}\.txt$/.test(file) && file !== "robots.txt");
    if (txtFiles.length > 0) {
      key = txtFiles[0].replace(/\.txt$/, "");
    }
  }
}

if (!key) {
  console.error("❌ IndexNow key not found. Set INDEXNOW_KEY env or create a verification txt file in public/.");
  process.exit(1);
}

const keyLocation = `${BASE_URL}/${key}.txt`;

// 2. Resolve URL list
async function getUrlList() {
  // Try fetching live sitemap first
  try {
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const matches = [...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
      if (matches.length > 0) {
        console.log(`📡 Fetched ${matches.length} URLs from live sitemap.xml`);
        return [...new Set(matches)];
      }
    }
  } catch {
    console.log("ℹ️ Live sitemap fetch unreachable or timed out, generating URLs locally...");
  }

  // Fallback: local generation
  const urls = [
    `${BASE_URL}/`,
    `${BASE_URL}/content-ideas`,
    `${BASE_URL}/resources`,
    `${BASE_URL}/store`,
    `${BASE_URL}/pricing`,
    `${BASE_URL}/atelier`,
    `${BASE_URL}/about`,
    `${BASE_URL}/methodology`,
    `${BASE_URL}/dossiers/classic-red`,
    `${BASE_URL}/dossiers/signature-purple`,
    `${BASE_URL}/legal`,
    `${BASE_URL}/reels`,
    `${BASE_URL}/creator-lanes`,
    `${BASE_URL}/creator-personas`,
    `${BASE_URL}/services`,
    `${BASE_URL}/tools`,
  ];

  try {
    const registryPath = path.join(process.cwd(), "lib", "seo-package-registry.json");
    if (fs.existsSync(registryPath)) {
      const reg = JSON.parse(fs.readFileSync(registryPath, "utf8"));
      if (Array.isArray(reg.pages)) {
        for (const page of reg.pages) {
          if (page.path) urls.push(`${BASE_URL}${page.path}`);
        }
      }
    }
    const legacyDir = path.join(process.cwd(), "content", "resources");
    if (fs.existsSync(legacyDir)) {
      const legacyFiles = fs.readdirSync(legacyDir).filter((f) => f.endsWith(".md"));
      for (const file of legacyFiles) {
        const slug = file.replace(/\.md$/, "");
        urls.push(`${BASE_URL}/resources/${slug}`);
      }
    }
  } catch (err) {
    console.error("Warning reading local registry/resources:", err);
  }

  return [...new Set(urls)];
}

async function main() {
  console.log(`🚀 Preparing IndexNow submission for ${HOST}...`);
  console.log(`🔑 Key: ${key.slice(0, 6)}...${key.slice(-4)}`);
  console.log(`📍 Key Location: ${keyLocation}`);

  const urlList = await getUrlList();
  console.log(`📄 Total URLs to submit: ${urlList.length}`);

  const payload = {
    host: HOST,
    key,
    keyLocation,
    urlList,
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n⏳ Submitting to ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 200) {
        console.log(`✅ ${endpoint}: Success (200 OK) - URLs submitted.`);
      } else if (res.status === 202) {
        console.log(`✅ ${endpoint}: Accepted (202 Accepted) - Key pending validation.`);
      } else {
        const text = await res.text().catch(() => "");
        console.warn(`⚠️ ${endpoint}: HTTP ${res.status} - ${text || res.statusText}`);
      }
    } catch (err) {
      console.error(`❌ Error submitting to ${endpoint}:`, err.message);
    }
  }

  console.log("\n🎉 IndexNow protocol execution finished.");
}

main();
