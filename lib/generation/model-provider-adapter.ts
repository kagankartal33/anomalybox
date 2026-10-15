export type ProviderProtocol = "openai_compatible" | "gemini" | "anthropic" | "json_text";

export type ModelProviderProfile = {
  provider: string;
  protocol: ProviderProtocol;
  model: string;
  baseUrl?: string | null;
  apiKeyEnvVar: string;
  timeoutMs?: number;
  features?: Record<string, unknown>;
};

export type ModelTokenUsage = { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };

const PROVIDER_CREDENTIAL_ENV_PATTERN = /^VIRALBOX_MODEL_PROVIDER_[A-Z0-9_]{2,96}$/;

function assertProviderCredentialEnvVar(name: string) {
  if (!PROVIDER_CREDENTIAL_ENV_PATTERN.test(name)) {
    throw new ModelProviderError(
      "configuration",
      "Provider credential environment variables must use the VIRALBOX_MODEL_PROVIDER_ prefix",
    );
  }
}

export type StructuredGenerationRequest<T> = {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  system: string;
  prompt: string;
  validate: (value: unknown) => T;
};

export type StructuredGenerationResult<T> = {
  value: T;
  usage: ModelTokenUsage;
  latencyMs: number;
  repaired: boolean;
  providerRequestId: string | null;
};

export class ModelProviderError extends Error {
  usage?: ModelTokenUsage;
  constructor(
    public readonly code: "configuration" | "timeout" | "rate_limit" | "refusal" | "invalid_output" | "provider_error",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

type AdapterOptions = {
  fetchImpl?: typeof fetch;
  env?: (name: string) => string | undefined;
};

function endpoint(baseUrl: string, suffix: string): string {
  return `${baseUrl.replace(/\/$/, "")}${suffix}`;
}

function safeProviderUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ModelProviderError("configuration", "Provider base URL is invalid");
  }
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) {
    throw new ModelProviderError("configuration", "Provider base URL must use HTTPS, except for localhost runtimes");
  }
  if (parsed.username || parsed.password) {
    throw new ModelProviderError("configuration", "Provider credentials must not be embedded in base_url");
  }
  for (const name of parsed.searchParams.keys()) {
    if (/key|token|secret|password|authorization/i.test(name)) {
      throw new ModelProviderError("configuration", "Provider credentials must be supplied through an environment variable");
    }
  }
  return parsed.toString().replace(/\/$/, "");
}

function stripJsonFence(value: string): string {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");
  const start = [firstObject, firstArray].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? -1;
  if (start < 0) throw new ModelProviderError("invalid_output", "Provider returned no JSON value");
  const open = trimmed[start];
  const close = open === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(close);
  if (end < start) throw new ModelProviderError("invalid_output", "Provider returned incomplete JSON");
  return trimmed.slice(start, end + 1);
}

function parseJson(value: unknown): unknown {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") throw new ModelProviderError("invalid_output", "Provider returned an unsupported payload");
  try {
    return JSON.parse(stripJsonFence(value));
  } catch (error) {
    if (error instanceof ModelProviderError) throw error;
    throw new ModelProviderError("invalid_output", "Provider returned invalid JSON");
  }
}

function usageFrom(payload: Record<string, unknown>) {
  const usage = (payload.usage ?? payload.usageMetadata ?? {}) as Record<string, unknown>;
  const tokenCount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  const input = tokenCount(usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokenCount);
  const output = tokenCount(usage.output_tokens ?? usage.completion_tokens ?? usage.candidatesTokenCount);
  const total = tokenCount(usage.total_tokens ?? usage.totalTokenCount);
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: total ?? (input !== null && output !== null ? input + output : null),
  };
}

function addTokenUsage(total: ModelTokenUsage, current: ModelTokenUsage): ModelTokenUsage {
  const sum = (a: number | null, b: number | null) => a === null || b === null ? null : a + b;
  return { inputTokens: sum(total.inputTokens, current.inputTokens), outputTokens: sum(total.outputTokens, current.outputTokens), totalTokens: sum(total.totalTokens, current.totalTokens) };
}

function validationFeedback(error: unknown): string {
  // Do not forward arbitrary error messages: validators may include private input values.
  const issues = error && typeof error === "object" && "issues" in error ? error.issues : undefined;
  if (Array.isArray(issues)) return JSON.stringify(issues.slice(0, 20).map(issue => ({
    path: Array.isArray(issue.path) ? issue.path.slice(0, 8) : [], code: issue.code,
  })));
  return error instanceof ModelProviderError ? error.code : "local_schema_validation_failed";
}

function responseText(payload: Record<string, unknown>, protocol: ProviderProtocol): unknown {
  if (protocol === "openai_compatible") {
    if (typeof payload.output_text === "string") return payload.output_text;
    const choices = payload.choices as Array<Record<string, unknown>> | undefined;
    if (choices?.length) {
      const message = choices[0].message as Record<string, unknown> | undefined;
      if (message?.refusal) throw new ModelProviderError("refusal", "Provider refused the structured request");
      return message?.content;
    }
    const output = payload.output as Array<Record<string, unknown>> | undefined;
    const content = output?.flatMap((item) => item.content as Array<Record<string, unknown>> ?? []);
    const refusal = content?.find((item) => item.type === "refusal");
    if (refusal) throw new ModelProviderError("refusal", "Provider refused the structured request");
    return content?.find((item) => item.type === "output_text")?.text;
  }
  if (protocol === "gemini") {
    const candidates = payload.candidates as Array<Record<string, unknown>> | undefined;
    const promptFeedback = payload.promptFeedback as Record<string, unknown> | undefined;
    const finishReason = String(candidates?.[0]?.finishReason ?? "");
    if (promptFeedback?.blockReason || ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(finishReason)) {
      throw new ModelProviderError("refusal", "Provider refused the structured request");
    }
    const content = candidates?.[0]?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<Record<string, unknown>> | undefined;
    return parts?.map((part) => part.text).filter(Boolean).join("");
  }
  if (protocol === "anthropic") {
    const content = payload.content as Array<Record<string, unknown>> | undefined;
    const tool = content?.find((item) => item.type === "tool_use" && item.name === "emit_structured_result");
    if (tool?.input) return tool.input;
    if (payload.stop_reason === "refusal") throw new ModelProviderError("refusal", "Provider refused the structured request");
    return content?.map((item) => item.text).filter(Boolean).join("");
  }
  return payload.output ?? payload.text ?? payload.content ?? payload.response;
}

function requestFor(profile: ModelProviderProfile, request: StructuredGenerationRequest<unknown>, key: string, repair?: { text: string; issues: string }) {
  const protocol = profile.protocol;
  const schemaText = JSON.stringify(request.jsonSchema);
  const basePrompt = protocol === "json_text"
    ? `${request.prompt}\n\nJSON Schema:\n${schemaText}`
    : request.prompt;
  const repairPrompt = repair
    ? `${basePrompt}\n\nThe previous output had validation issues:\n${repair.issues}\n\nPrevious output:\n${repair.text}\n\nReturn valid JSON matching the schema.`
    : basePrompt;
  if (protocol === "openai_compatible") {
    const base = safeProviderUrl(profile.baseUrl ?? "https://api.openai.com/v1");
    const useResponses = profile.features?.api !== "chat_completions";
    if (useResponses) {
      return {
        url: endpoint(base, "/responses"),
        headers: { Authorization: `Bearer ${key}` },
        body: {
          model: profile.model,
          input: [{ role: "system", content: request.system }, { role: "user", content: repairPrompt }],
          text: { format: { type: "json_schema", name: request.schemaName, strict: true, schema: request.jsonSchema } },
          store: false,
        },
      };
    }
    return {
      url: endpoint(base, "/chat/completions"),
      headers: { Authorization: `Bearer ${key}` },
      body: {
        model: profile.model,
        messages: [{ role: "system", content: request.system }, { role: "user", content: repairPrompt }],
        response_format: { type: "json_schema", json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema } },
      },
    };
  }
  if (protocol === "gemini") {
    const base = safeProviderUrl(profile.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta");
    return {
      url: endpoint(base, `/models/${encodeURIComponent(profile.model)}:generateContent`),
      headers: { "x-goog-api-key": key },
      body: {
        systemInstruction: { parts: [{ text: request.system }] },
        contents: [{ role: "user", parts: [{ text: repairPrompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: request.jsonSchema },
      },
    };
  }
  if (protocol === "anthropic") {
    const base = safeProviderUrl(profile.baseUrl ?? "https://api.anthropic.com/v1");
    return {
      url: endpoint(base, "/messages"),
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: {
        model: profile.model,
        max_tokens: Number(profile.features?.max_tokens ?? 4096),
        system: request.system,
        messages: [{ role: "user", content: repairPrompt }],
        tools: [{ name: "emit_structured_result", description: "Return the requested structured result", input_schema: request.jsonSchema, strict: true }],
        tool_choice: { type: "tool", name: "emit_structured_result" },
      },
    };
  }
  const base = profile.baseUrl;
  if (!base) throw new ModelProviderError("configuration", "json_text profiles require base_url");
  return {
    url: safeProviderUrl(base),
    headers: { Authorization: `Bearer ${key}` },
    body: { model: profile.model, system: request.system, prompt: repairPrompt, response_format: "json" },
  };
}

export async function generateStructured<T>(
  profile: ModelProviderProfile,
  request: StructuredGenerationRequest<T>,
  options: AdapterOptions = {},
): Promise<StructuredGenerationResult<T>> {
  assertProviderCredentialEnvVar(profile.apiKeyEnvVar);
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? ((name: string) => {
    const deno = (globalThis as unknown as { Deno?: { env: { get: (key: string) => string | undefined } } }).Deno;
    return deno?.env.get(name) ?? (typeof process !== "undefined" ? process.env[name] : undefined);
  });
  const key = env(profile.apiKeyEnvVar);
  if (!key) throw new ModelProviderError("configuration", `Missing provider credential environment variable: ${profile.apiKeyEnvVar}`);
  const started = Date.now();
  const budget = profile.timeoutMs ?? 45000;
  if (!Number.isFinite(budget) || budget <= 0) throw new ModelProviderError("configuration", "Provider timeout must be a positive finite number");
  const maxAttempts = profile.protocol === "json_text" ? 2 : 1;
  let repair: { text: string; issues: string } | undefined;
  let usage: ModelTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let unreportedAttempt = false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), budget);
  const assertWithinBudget = () => {
    if (controller.signal.aborted || Date.now() - started >= budget) throw new ModelProviderError("timeout", "Provider request timed out");
  };

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      assertWithinBudget();
      const built = requestFor(profile, request, key, repair);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      Object.assign(headers, built.headers);
      unreportedAttempt = true;
      const response = await fetchImpl(built.url, {
        method: "POST",
        headers,
        body: JSON.stringify(built.body),
        signal: controller.signal,
      });
      const raw = await response.text();
      if (response.status === 429) throw new ModelProviderError("rate_limit", "Provider rate limit exceeded", 429);
      if (!response.ok) throw new ModelProviderError("provider_error", `Provider request failed with status ${response.status}`, response.status);
      let payload: Record<string, unknown>;
      try { payload = JSON.parse(raw) as Record<string, unknown>; }
      catch { payload = { text: raw }; }
      usage = addTokenUsage(usage, usageFrom(payload));
      unreportedAttempt = false;
      assertWithinBudget();
      const output = responseText(payload, profile.protocol);
      if (JSON.stringify(output)?.includes(key)) throw new ModelProviderError("invalid_output", "Provider output contained a credential");
      try {
        const value = request.validate(parseJson(output));
        assertWithinBudget();
        return {
          value,
          usage,
          latencyMs: Date.now() - started,
          repaired: attempt === 1,
          providerRequestId: response.headers.get("x-request-id"),
        };
      } catch (error) {
        if (error instanceof ModelProviderError && error.code === "timeout") throw error;
        if (attempt + 1 >= maxAttempts) {
          if (error instanceof ModelProviderError) throw error;
          throw new ModelProviderError("invalid_output", "Provider output failed local schema validation");
        }
        repair = { text: typeof output === "string" ? output : JSON.stringify(output) ?? "", issues: validationFeedback(error).replaceAll(key, "[redacted]") };
      }
    }
    throw new ModelProviderError("invalid_output", "Provider output failed local schema validation");
  } catch (error) {
    const failure = error instanceof ModelProviderError ? error
      : controller.signal.aborted || (error instanceof Error && error.name === "AbortError")
        ? new ModelProviderError("timeout", "Provider request timed out")
        : new ModelProviderError("provider_error", "Provider request failed");
    // A timed-out/lost response may still have incurred tokens at the provider.
    failure.usage = unreportedAttempt ? { inputTokens: null, outputTokens: null, totalTokens: null } : usage;
    throw failure;
  } finally {
    clearTimeout(timeout);
  }
}