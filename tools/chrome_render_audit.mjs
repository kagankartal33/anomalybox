import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9338;
const profileDir = path.resolve("tmp", "chrome-audit-profile");
fs.mkdirSync(profileDir, { recursive: true });

const browser = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], {
  windowsHide: true,
  stdio: "ignore",
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForChrome() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await wait(150);
  }
  throw new Error("Chrome did not start.");
}

async function testPage(url) {
  console.log(`\nTesting page with Headless Chrome: ${url}`);
  const targetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  const errors = [];
  const consoleMessages = [];

  await new Promise((resolve) => {
    ws.onopen = () => {
      let id = 1;
      ws.send(JSON.stringify({ id: id++, method: "Page.enable" }));
      ws.send(JSON.stringify({ id: id++, method: "Runtime.enable" }));
      ws.send(JSON.stringify({ id: id++, method: "Log.enable" }));
      ws.send(JSON.stringify({ id: id++, method: "Page.navigate", params: { url } }));

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === "Runtime.exceptionThrown") {
          errors.push(msg.params.exceptionDetails);
        }
        if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
          errors.push(msg.params.entry.text);
        }
        if (msg.method === "Page.loadEventFired") {
          setTimeout(() => resolve(), 3000);
        }
      };
    };
  });

  console.log(`  Page loaded. Runtime exceptions / errors: ${errors.length}`);
  for (const err of errors) {
    console.log("  ERROR:", typeof err === "string" ? err : err.text || err.exception?.description);
  }

  // Close tab
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
}

async function run() {
  await waitForChrome();
  console.log("Chrome CDP ready.");
  await testPage("https://anomalybox.com/");
  await testPage("https://anomalybox.com/resources/creator-decision-fatigue-and-burnout-solution");
  await testPage("https://anomalybox.com/resources/how-to-build-a-repeatable-content-system");
  await testPage("https://anomalybox.com/tools/first-3-seconds-auditor");
  browser.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error("Audit failed:", err);
  browser.kill();
  process.exit(1);
});
