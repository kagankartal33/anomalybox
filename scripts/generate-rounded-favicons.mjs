/**
 * generate-rounded-favicons.mjs
 * 
 * Generates favicons with:
 *  - Solid white background
 *  - iOS squircle rounded corners
 *  - Gem box logo centered, maximized (80% canvas)
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const publicDir = path.join(process.cwd(), "public");
const brandDir = path.join(publicDir, "brand");

// Source: user-provided custom icon image (already formatted as high-res rounded icon)
const customSource = path.join(brandDir, "favicon-source-custom.png");
console.log(`Using custom source: ${customSource}`);

/**
 * Generate a clean crisp favicon at `size`x`size` from custom image
 */
async function generateFavicon(size, outputPath) {
  await sharp(customSource)
    .resize(size, size, { fit: "contain", background: "#FFFFFF" })
    .flatten({ background: "#FFFFFF" })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`✓ ${size}x${size} → ${path.basename(outputPath)}`);
}

async function main() {
  console.log("Generating rounded favicon set...\n");

  await generateFavicon(512, path.join(publicDir, "favicon.png"), 0.22);
  await generateFavicon(48,  path.join(publicDir, "favicon-48.png"), 0.22);
  await generateFavicon(32,  path.join(publicDir, "favicon-32.png"), 0.22);
  await generateFavicon(180, path.join(publicDir, "apple-touch-icon.png"), 0.20);
  await generateFavicon(512, path.join(process.cwd(), "app", "icon.png"), 0.22);

  // favicon.ico → 32x32 copy
  fs.copyFileSync(
    path.join(publicDir, "favicon-32.png"),
    path.join(publicDir, "favicon.ico")
  );
  console.log("✓ favicon.ico → 32x32 copy");
  console.log("\n✅ All done!");
}

main().catch(console.error);
