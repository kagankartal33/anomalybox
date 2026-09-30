import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const key = randomBytes(16).toString("hex");
const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";

function run(args, input = "") {
  const result = spawnSync(
    command,
    process.platform === "win32" ? ["/d", "/s", "/c", `npx.cmd ${args.join(" ")}`] : args,
    { input, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
  );
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "Vercel command failed").trim().slice(0, 400));
}

run(["--yes", "vercel", "env", "rm", "INDEXNOW_KEY", "production", "--yes"]);
run(["--yes", "vercel", "env", "add", "INDEXNOW_KEY", "production"], `${key}\
fs.writeFileSync(path.join(process.cwd(), "public", `${key}.txt`), `${key}\
console.log("IndexNow key rotated and matching public verification file created without printing the key.");