/* Mocked edge dependencies only; no network or production credentials. */
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";

// Test-only dynamic boundary. Production code remains strictly typed.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Callable = (...args: any[]) => any;
export function edgeHarness(provider?: Callable) {
  const entry = path.resolve("supabase/functions/admin-generation-batches/index.ts");
  const require = createRequire(entry);
  const names = ["evaluateQualityCheck", "classifySafety", "richCardSignature", "signatureSimilarity", "bestDuplicate", "generateBatch", "processQueuedGeneration", "generationRunStatus", "importBatch", "publishInventory", "scoreCandidate", "defaultLayerPolicy", "validateV2IdeaCardProduction", "ModelProviderError"];
  const dependencies = ["getRows", "getPagedRows", "postRows", "patchRows", "resolveBatch", "trainingContext", "cardsForIdeas", "importBatch", "scoresForIdeas", "publishedFingerprintPool", "lookupCategoryLayerPolicy", "lookupCategoryById", "lookupById"];
  const additions = "\nexport {" + names.join(",") + "}; export function mocks(m) {" + dependencies.map(name => "if(m." + name + ") " + name + " = m." + name + ";").join("\n") + "}";
  const source = ts.transpileModule(fs.readFileSync(entry, "utf8") + additions, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, Callable> = {};
  vm.runInNewContext(source, {
    exports, console, URL, Request, Response, Headers, TextEncoder, TextDecoder, crypto, setTimeout, clearTimeout, AbortController,
    Deno: { env: { get: (key: string) => key === "SUPABASE_URL" ? "http://localhost:54321" : "test-only" }, serve: () => {} },
    require: (id: string) => {
      const loaded = require(id);
      return id.includes("model-provider-adapter") && provider ? { ...loaded, generateStructured: provider } : loaded;
    },
    fetch: () => { throw new Error("Unexpected network access in edge regression"); },
  }, { filename: entry });
  return exports;
}
