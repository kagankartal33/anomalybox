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

export type StructuredGenerationRequest<T> = {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  system: string;
  prompt: string;
  validate: (value: unknown) => T;
};

export type StructuredGenerationResult<T> = {
  value: T;
  usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
  latencyMs: number;
  repaired: boolean;
  providerRequestId: string | null;
};

export class ModelProviderError extends Error {
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
  const input = Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokenCount);
  const output = Number(usage.output_tokens ?? usage.completion_tokens ?? usage.candidatesTokenCount);
  const total = Number(usage.total_tokens ?? usage.totalTokenCount);
  return {
    inputTokens: Number.isFinite(input) ? input : null,
    outputTokens: Number.isFinite(output) ? output : null,
    totalTokens: Number.isFinite(total) ? total : Number.isFinite(input + output) ? input + output : null,
  };
}

function responseText(payload: Record<string, unknown>, protocol: ProviderProtocol): unknown {
  if (protocol === "openai_compatible") {
    if (typeof payload.output_text === "string") return payload.output_text;
    const choices = payload.choices as Array<Record<string, unknown>> | undefined;
    if (choices?.length) return (choices[0].message as Record<string, unknown> | undefined)?.content;
    const output = payload.output as Array<Record<string, unknown>> | undefined;
    const content = output?.flatMap((item) => item.content as Array<Record<string, unknown>> ?? []);
    const refusal = content?.find((item) => item.type === "refusal");
    if (refusal) throw new ModelProviderError("refusal", "Provider refused the structured request");
    return content?.find((item) => item.type === "output_text")?.text;
  }
  if (protocol === "gemini") {
    const candidates = payload.candidates as Array<Record<string, unknown>> | undefined;
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

function requestFor(profile: ModelProviderProfile, request: StructuredGenerationRequest<unknown>, key: string, repairText?: string) {
  const protocol = profile.protocol;
  const repairPrompt = repairText
    ? `${request.prompt}\
    : request.prompt;
  if (protocol === "openai_compatible") {
    const base = profile.baseUrl ?? "https://api.openai.com/v1";
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
    const base = profile.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
    return {
      url: `${endpoint(base, `/models/${encodeURIComponent(profile.model)}:generateContent`)}?key=${encodeURIComponent(key)}`,
      headers: {},
      body: {
        systemInstruction: { parts: [{ text: request.system }] },
        contents: [{ role: "user", parts: [{ text: repairPrompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: request.jsonSchema },
      },
    };
  }
  if (protocol === "anthropic") {
    const base = profile.baseUrl ?? "https://api.anthropic.com/v1";
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
    url: base,
    headers: { Authorization: `Bearer ${key}` },
    body: { model: profile.model, system: request.system, prompt: repairPrompt, response_format: "json" },
  };
}

export async function generateStructured<T>(
  profile: ModelProviderProfile,
  request: StructuredGenerationRequest<T>,
  options: AdapterOptions = {},
): Promise<StructuredGenerationResult<T>> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? ((name: string) => {
    const deno = (globalThis as unknown as { Deno?: { env: { get: (key: string) => string | undefined } } }).Deno;
    return deno?.env.get(name) ?? (typeof process !== "undefined" ? process.env[name] : undefined);
  });
  const key = env(profile.apiKeyEnvVar);
  if (!key) throw new ModelProviderError("configuration", `Missing provider credential environment variable: ${profile.apiKeyEnvVar}`);
  const started = Date.now();
  const maxAttempts = profile.protocol === "json_text" ? 2 : 1;
  let repairText: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), profile.timeoutMs ?? 45000);
    try {
      const built = requestFor(profile, request, key, repairText);
      const response = await fetchImpl(built.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...built.headers },
        body: JSON.stringify(built.body),
        signal: controller.signal,
      });
      const raw = await response.text();
      if (response.status === 429) throw new ModelProviderError("rate_limit", "Provider rate limit exceeded", 429);
      if (!response.ok) throw new ModelProviderError("provider_error", `Provider request failed with status ${response.status}`, response.status);
      let payload: Record<string, unknown>;
      try { payload = JSON.parse(raw) as Record<string, unknown>; }
      catch { payload = { text: raw }; }
      const output = responseText(payload, profile.protocol);
      try {
        const value = request.validate(parseJson(output));
        return {
          value,
          usage: usageFrom(payload),
          latencyMs: Date.now() - started,
          repaired: attempt === 1,
          providerRequestId: response.headers.get("x-request-id"),
        };
      } catch (error) {
        if (attempt + 1 >= maxAttempts) {
          if (error instanceof ModelProviderError) throw error;
          throw new ModelProviderError("invalid_output", "Provider output failed local schema validation");
        }
        repairText = typeof output === "string" ? output : JSON.stringify(output);
      }
    } catch (error) {
      if (error instanceof ModelProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ModelProviderError("timeout", "Provider request timed out");
      }
      throw new ModelProviderError("provider_error", "Provider request failed");
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new ModelProviderError("invalid_output", "Provider output failed local schema validation");
}