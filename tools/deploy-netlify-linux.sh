#!/usr/bin/env bash
set -euo pipefail

deploy_root="/workspace/anomaly-box"
mkdir -p "$deploy_root"

tar \\
  --exclude="./node_modules" \\
  --exclude="./.next" \\
  --exclude="./.netlify" \\
  --exclude="./.env.local" \\
  --exclude="./archive" \\
  --exclude="./tmp" \\
  --exclude="./production_exports" \\
  -C /source -cf - . |
  tar -C "$deploy_root" -xf -

cd "$deploy_root"
npm ci --no-audit --no-fund

NETLIFY_AUTH_TOKEN="$(
  node - <<'NODE'
const config = JSON.parse(require("node:fs").readFileSync("/netlify-config.json", "utf8"));
function findToken(value) {
  if (!value || typeof value !== "object") return "";
  if (typeof value.token === "string" && value.token) return value.token;
  for (const child of Object.values(value)) {
    const token = findToken(child);
    if (token) return token;
  }
  return "";
}
process.stdout.write(findToken(config));
NODE
)"

if [[ -z "$NETLIFY_AUTH_TOKEN" ]]; then
  echo "Netlify authentication token was not found." >&2
  exit 1
fi
export NETLIFY_AUTH_TOKEN

npx --yes netlify-cli@latest deploy \\
  --prod \\
  --build \\
  --site "0ace5ce9-d9e5-4d5a-9b14-99c5801d0501" \\
  --message "Production hardening: auth recovery, reserved fulfillment, premium UX"

unset NETLIFY_AUTH_TOKEN