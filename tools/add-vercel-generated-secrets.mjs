import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";

function add(name, value) {
  const args = ["--yes", "vercel", "env", "add", name, "production"];
  const result = spawnSync(
    command,
    process.platform === "win32" ? ["/d", "/s", "/c", `npx.cmd ${args.join(" ")}`] : args,
    { input: `${value}\n`, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    throw new Error(`${name} could not be added: ${(result.stderr || result.stdout || "unknown error").trim().slice(0, 400)}`);
  }
}

add("INTERNAL_API_TOKEN", randomBytes(32).toString("base64url"));
add("ADMIN_API_TOKEN", randomBytes(32).toString("base64url"));
add("INDEXNOW_KEY", randomBytes(16).toString("hex"));
console.log("Generated production internal/admin/IndexNow secrets were added to Vercel without printing values.");
