import assert from "node:assert/strict";
import { generateStructured, ModelProviderError, type ModelProviderProfile } from "../lib/generation/model-provider-adapter";
import { ideaCardJsonSchema } from "../lib/generation/contracts";
import { z } from "zod";

const baseProfile: ModelProviderProfile = {
  provider: "test",
  protocol: "openai_compatible",
  model: "test-model",
  baseUrl: "https://provider.invalid/v1",
  apiKeyEnvVar: "VIRALBOX_MODEL_PROVIDER_TEST",
  timeoutMs: 1000,
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
    return new Response(JSON.stringify({ output_text: '{"ok":true}', usage: { input_tokens: 5, output_tokens: 3, total_tokens: 8 } }), { status: 200, headers: { "x-request-id": "req_1" } });
  },
});
assert.deepEqual(valid.value, { ok: true });
assert.equal(valid.usage.totalTokens, 8);

await generateStructured({ ...baseProfile, protocol: "anthropic", baseUrl: null }, request, {
  env,
  fetchImpl: async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.tools[0].strict, true);
    assert.deepEqual(body.tool_choice, { type: "tool", name: "emit_structured_result" });
    return new Response(JSON.stringify({ content: [{ type: "tool_use", name: "emit_structured_result", input: { ok: true } }] }), { status: 200 });
  },
});

await generateStructured({ ...baseProfile, protocol: "gemini", baseUrl: null }, request, {
  env,
  fetchImpl: async (input, init) => {
    assert.equal(String(input).includes("?key="), false);
    assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "secret-that-must-not-leak");
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }), { status: 200 });
  },
});

let calls = 0;
const repaired = await generateStructured({ ...baseProfile, protocol: "json_text", baseUrl: "https://provider.invalid/generate" }, request, {
  env,
  fetchImpl: async () => {
    calls += 1;
    return new Response(JSON.stringify({ text: calls === 1 ? "{partial" : '{"ok":true}' }), { status: 200 });
  },
});
assert.equal(repaired.repaired, true);
assert.equal(calls, 2);

const repairBodies: Array<{ prompt: string }> = [];
const repairedSchema = z.object({ uniqueRequiredField: z.string() });
const schemaRepair = await generateStructured({ ...baseProfile, protocol: "json_text" }, {
  ...request, prompt: "Generate the object.",
  jsonSchema: { type: "object", required: ["uniqueRequiredField"], properties: { uniqueRequiredField: { type: "string" } } },
  validate: value => repairedSchema.parse(value),
}, {
  env,
  fetchImpl: async (_input, init) => {
    repairBodies.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ text: repairBodies.length === 1 ? "{}" : '{"uniqueRequiredField":"ok"}', usage: { input_tokens: 100, output_tokens: 50 } }));
  },
});
assert.ok(repairBodies.every(body => body.prompt.includes('"required":["uniqueRequiredField"]')), "Original and repair requests must include the schema");
assert.ok(repairBodies[1].prompt.includes('"path":["uniqueRequiredField"]'), "Repair must identify the failing schema field");
assert.equal(repairBodies.some(body => body.prompt.includes(env())), false);
assert.deepEqual(schemaRepair.usage, { inputTokens: 200, outputTokens: 100, totalTokens: 300 });

let timedCalls = 0;
const actualNow = Date.now;
let virtualNow = 0;
try {
  Date.now = () => virtualNow;
  await generateStructured({ ...baseProfile, protocol: "json_text", timeoutMs: 150 }, request, {
    env,
    fetchImpl: async () => {
      timedCalls++;
      virtualNow += 100;
      return new Response(JSON.stringify({ text: timedCalls === 1 ? "{}" : '{"ok":true}', usage: { input_tokens: 10, output_tokens: 5 } }));
    },
  });
  assert.fail("Repair must share the original total deadline");
} catch (error) {
  assert.ok(error instanceof ModelProviderError);
  assert.equal(error.code, "timeout");
  assert.equal(error.usage?.totalTokens, 30, "Known cost survives a late response");
} finally {
  Date.now = actualNow;
}
assert.equal(timedCalls, 2);

let invalidCalls = 0;
try {
  await generateStructured({ ...baseProfile, protocol: "json_text" }, request, { env, fetchImpl: async () => {
    invalidCalls++;
    return new Response(JSON.stringify({ text: "{}", usage: { input_tokens: 10, output_tokens: 5 } }));
  } });
  assert.fail("Invalid repaired output must fail");
} catch (error) {
  assert.ok(error instanceof ModelProviderError);
  assert.equal(error.code, "invalid_output");
  assert.deepEqual(error.usage, { inputTokens: 20, outputTokens: 10, totalTokens: 30 }, "Failed generation must retain both attempts' usage");
}
assert.equal(invalidCalls, 2);

let lostResponseCalls = 0;
try {
  await generateStructured({ ...baseProfile, protocol: "json_text" }, request, { env, fetchImpl: async () => {
    if (++lostResponseCalls === 2) throw new DOMException("Lost response", "AbortError");
    return new Response(JSON.stringify({ text: "{}", usage: { input_tokens: 10, output_tokens: 5 } }));
  } });
  assert.fail("Lost response must fail");
} catch (error) {
  assert.ok(error instanceof ModelProviderError);
  assert.equal(error.code, "timeout");
  assert.equal(error.usage?.totalTokens, null, "Unknown repair usage must not be reported as the first attempt's complete cost");
}

let unknownUsageCalls = 0;
const unknownUsage = await generateStructured({ ...baseProfile, protocol: "json_text" }, request, { env, fetchImpl: async () => {
  return new Response(JSON.stringify(++unknownUsageCalls === 1 ? { text: "{}" } : { text: '{"ok":true}', usage: { input_tokens: 10, output_tokens: 5 } }));
} });
assert.equal(unknownUsage.usage.totalTokens, null);

let credentialCalls = 0;
await expectCode("invalid_output", async () => {
  credentialCalls++;
  return new Response(JSON.stringify({ text: JSON.stringify({ ok: true, leaked: env() }) }));
}, { ...baseProfile, protocol: "json_text" });
assert.equal(credentialCalls, 1, "A credential echo must never be replayed into a repair prompt");

let failedRepairCalls = 0;
await expectCode("invalid_output", async () => {
  failedRepairCalls += 1;
  return new Response(JSON.stringify({ text: "{partial" }), { status: 200 });
}, { ...baseProfile, protocol: "json_text", baseUrl: "https://provider.invalid/generate" });
assert.equal(failedRepairCalls, 2);

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
await expectCode("configuration", async () => new Response("{}"), { ...baseProfile, baseUrl: "https://user:secret@provider.invalid/v1" });
await expectCode("configuration", async () => new Response("{}"), { ...baseProfile, baseUrl: "https://provider.invalid/v1?api_key=secret" });
await expectCode("refusal", async () => new Response(JSON.stringify({ output: [{ content: [{ type: "refusal", refusal: "no" }] }] }), { status: 200 }));
await expectCode("invalid_output", async () => new Response(JSON.stringify({ output_text: '{"ok":false}' }), { status: 200 }));
await expectCode("timeout", async (_input, init) => new Promise((_resolve, reject) => {
  init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
}), { ...baseProfile, timeoutMs: 30 });

console.log("model provider adapter contract fixtures passed");