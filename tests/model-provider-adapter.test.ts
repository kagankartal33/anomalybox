import assert from "node:assert/strict";
import { generateStructured, ModelProviderError, type ModelProviderProfile } from "../lib/generation/model-provider-adapter";

const baseProfile: ModelProviderProfile = {
  provider: "test",
  protocol: "openai_compatible",
  model: "test-model",
  baseUrl: "https://provider.invalid/v1",
  apiKeyEnvVar: "TEST_PROVIDER_KEY",
  timeoutMs: 30,
};
const request = {
  schemaName: "fixture",
  jsonSchema: { type: "object", additionalProperties: false, required: ["ok"], properties: { ok: { type: "boolean" } } },
  system: "Return the fixture.",
  prompt: "Return ok.",
  validate(value: unknown) {
    if (!value || typeof value !== "object" || (value as { ok?: unknown }).ok !== true) throw new Error("schema");
    return value as { ok: true };
  },
};
const env = () => "secret-that-must-not-leak";

const valid = await generateStructured(baseProfile, request, {
  env,
  fetchImpl: async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.text.format.type, "json_schema");
    assert.equal(body.store, false);
    return new Response(JSON.stringify({ output_text: "{\"ok\":true}", usage: { input_tokens: 5, output_tokens: 3, total_tokens: 8 } }), { status: 200, headers: { "x-request-id": "req_1" } });
  },
});
assert.deepEqual(valid.value, { ok: true });
assert.equal(valid.usage.totalTokens, 8);

let calls = 0;
const repaired = await generateStructured({ ...baseProfile, protocol: "json_text", baseUrl: "https://provider.invalid/generate" }, request, {
  env,
  fetchImpl: async () => {
    calls += 1;
    return new Response(JSON.stringify({ text: calls === 1 ? "{partial" : "{\"ok\":true}" }), { status: 200 });
  },
});
assert.equal(repaired.repaired, true);
assert.equal(calls, 2);

async function expectCode(code: ModelProviderError["code"], fetchImpl: typeof fetch, profile = baseProfile) {
  try {
    await generateStructured(profile, request, { env, fetchImpl });
    assert.fail(`Expected ${code}`);
  } catch (error) {
    assert.ok(error instanceof ModelProviderError);
    assert.equal(error.code, code);
    assert.equal(error.message.includes("secret-that-must-not-leak"), false);
  }
}

await expectCode("rate_limit", async () => new Response("{}", { status: 429 }));
await expectCode("refusal", async () => new Response(JSON.stringify({ output: [{ content: [{ type: "refusal", refusal: "no" }] }] }), { status: 200 }));
await expectCode("invalid_output", async () => new Response(JSON.stringify({ output_text: "{\"ok\":false}" }), { status: 200 }));
await expectCode("timeout", async (_input, init) => new Promise((_resolve, reject) => {
  init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
}));

console.log("model provider adapter contract fixtures passed");