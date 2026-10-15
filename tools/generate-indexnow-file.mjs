import fs from "node:fs";
import path from "node:path";

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  console.log("INDEXNOW_KEY is not set; skipping IndexNow verification file generation.");
  process.exit(0);
}
if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
  throw new Error("INDEXNOW_KEY must contain only letters, numbers, underscores or hyphens.");
}
const output = path.join(process.cwd(), "public", `${key}.txt`);
fs.writeFileSync(output, `${key}\n`, "utf8");
console.log("Generated IndexNow verification file for production build.");
