import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const chrome = "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe";
const outputRoot = path.resolve("tmp", "visual-qa-20260729");
const profileRoot = path.resolve("tmp", "chrome-cdp-profile-20260729");
const port = 9337;
const baseUrl = (process.argv[2] ?? "https://anomalybox.com").replace(/\\/$/, "");

fs.mkdirSync(outputRoot, { recursive: true });
fs.mkdirSync(profileRoot, { recursive: true });

const browser = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileRoot}`,
  "about:blank",
], {
  windowsHide: true,
  stdio: "ignore",
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForBrowser() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await wait(100);
  }
  throw new Error("Chrome DevTools endpoint did not start.");
}

async function capture(name, url) {
  const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  });
  if (!targetResponse.ok) throw new Error(`Could not create Chrome target for ${name}.`);
  const target = await targetResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const eventWaiters = new Map();
  let requestId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const waiters = eventWaiters.get(message.method);
    if (waiters?.length) {
      const waiter = waiters.shift();
      waiter(message.params);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    requestId += 1;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });

  const once = (method) => new Promise((resolve) => {
    const waiters = eventWaiters.get(method) ?? [];
    waiters.push(resolve);
    eventWaiters.set(method, waiters);
  });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await wait(800);

  const metrics = await send("Runtime.evaluate", {
    expression: "({innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth})",
    returnByValue: true,
  });
  const value = metrics.result.value;
  const overflow = value.innerWidth !== 390 || value.clientWidth !== 390 || value.scrollWidth > 390;
  let offenders = [];
  if (overflow) {
    const offenderResult = await send("Runtime.evaluate", {
      expression: `Array.from(document.querySelectorAll("*"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: String(element.className || "").slice(0, 180),
            text: String(element.textContent || "").trim().replace(/\\\\s+/g, " ").slice(0, 100),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            scrollWidth: element.scrollWidth
          };
        })
        .filter((item) => item.right > 391 || item.width > 391 || item.scrollWidth > 391)
        .sort((a, b) => Math.max(b.right, b.scrollWidth) - Math.max(a.right, a.scrollWidth))
        .slice(0, 12)`,
      returnByValue: true,
    });
    offenders = offenderResult.result.value;
  }

  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const outputPath = path.join(outputRoot, `${name}-mobile-cdp.png`);
  fs.writeFileSync(outputPath, Buffer.from(screenshot.data, "base64"));
  console.log(`OK ${name} ${JSON.stringify(value)} ${outputPath}`);
  if (overflow) console.error(`OVERFLOW ${name} ${JSON.stringify(offenders)}`);

  socket.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
}

try {
  await waitForBrowser();
  await capture("home", `${baseUrl}/`);
  await capture("login", `${baseUrl}/login`);
  await capture("store", `${baseUrl}/store`);
  await capture("forgot", `${baseUrl}/forgot-password`);
  await capture("reset", `${baseUrl}/reset-password`);
} finally {
  browser.kill();
}