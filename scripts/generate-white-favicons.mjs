import sharp from "sharp";
import path from "path";
import fs from "fs";

const publicDir = path.join(process.cwd(), "public");

async function generateFavicons() {
  const sourcePath = path.join(publicDir, "favicon.png");
  if (!fs.existsSync(sourcePath)) {
    console.error("Source favicon.png not found!");
    return;
  }

  console.log("Generating white background favicons...");

  // 512x512 with white background
  await sharp(sourcePath)
    .flatten({ background: "#FFFFFF" })
    .resize(512, 512)
    .toFile(path.join(publicDir, "favicon.png.tmp"));
  fs.renameSync(path.join(publicDir, "favicon.png.tmp"), path.join(publicDir, "favicon.png"));

  // 48x48
  await sharp(path.join(publicDir, "favicon.png"))
    .resize(48, 48)
    .toFile(path.join(publicDir, "favicon-48.png.tmp"));
  fs.renameSync(path.join(publicDir, "favicon-48.png.tmp"), path.join(publicDir, "favicon-48.png"));

  // 32x32
  await sharp(path.join(publicDir, "favicon.png"))
    .resize(32, 32)
    .toFile(path.join(publicDir, "favicon-32.png.tmp"));
  fs.renameSync(path.join(publicDir, "favicon-32.png.tmp"), path.join(publicDir, "favicon-32.png"));

  // apple-touch-icon 180x180
  await sharp(path.join(publicDir, "favicon.png"))
    .resize(180, 180)
    .toFile(path.join(publicDir, "apple-touch-icon.png.tmp"));
  fs.renameSync(path.join(publicDir, "apple-touch-icon.png.tmp"), path.join(publicDir, "apple-touch-icon.png"));

  // copy 32x32 png to favicon.ico
  fs.copyFileSync(path.join(publicDir, "favicon-32.png"), path.join(publicDir, "favicon.ico"));

  console.log("Favicons generated successfully!");
}

generateFavicons().catch(console.error);
