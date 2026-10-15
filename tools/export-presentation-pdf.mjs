/**
 * tools/export-presentation-pdf.mjs
 * Converts distribution/slideshare/presentation.html to a high-quality presentation PDF
 * for upload on SlideShare, Issuu, and doc-sharing platforms.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const inputHtml = path.join(rootDir, "distribution", "slideshare", "presentation.html");
const outputPdf = path.join(rootDir, "distribution", "slideshare", "Anomaly-Box-Creative-Direction-Deck.pdf");

if (!fs.existsSync(inputHtml)) {
  console.error(`❌ Input file not found: ${inputHtml}`);
  process.exit(1);
}

// Find Chrome or Edge executable on Windows/Mac/Linux
function findBrowserExecutable() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.CHROME_BIN,
    process.env.EDGE_BIN,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const browserExe = findBrowserExecutable();
if (!browserExe) {
  console.error("❌ No Chrome or Microsoft Edge executable found to render PDF.");
  process.exit(1);
}

console.log(`🚀 Rendering PDF with browser: ${browserExe}`);
console.log(`📄 Input HTML: ${inputHtml}`);
console.log(`📦 Output PDF: ${outputPdf}`);

const fileUrl = `file:///${inputHtml.replace(/\\/g, "/")}`;

try {
  execFileSync(
    browserExe,
    [
      "--headless",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${outputPdf}`,
      fileUrl,
    ],
    { stdio: "inherit", timeout: 30000 }
  );

  if (fs.existsSync(outputPdf) && fs.statSync(outputPdf).size > 1000) {
    const sizeKb = (fs.statSync(outputPdf).size / 1024).toFixed(1);
    console.log(`✅ Success! Created presentation deck PDF (${sizeKb} KB) at:\n   ${outputPdf}`);
  } else {
    console.error("❌ PDF was not generated or is empty.");
    process.exit(1);
  }
} catch (err) {
  console.error("❌ Failed to render PDF:", err.message);
  process.exit(1);
}
