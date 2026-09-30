import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import ts from "typescript";

const root = process.cwd();
const directory = path.join(root, "supabase/functions/admin-generation-batches");
const queue = [path.join(directory, "index.ts")], visited = new Set();
const imports = { zod: "npm:zod@3.25.76" };
const relative = value => path.relative(directory, value).replaceAll("\\", "/");
while (queue.length) {
  const file = queue.shift();
  if (visited.has(file)) continue;
  visited.add(file);
  const tree = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  for (const statement of tree.statements) {
    if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    if (specifier === "zod") continue;
    assert.ok(specifier.startsWith(".") || specifier.startsWith("@/"), `Unsupported edge dependency ${specifier}`);
    const unresolved = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
    const resolved = [unresolved, `${unresolved}.ts`, path.join(unresolved, "index.ts")].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    assert.ok(resolved, `Unresolved dependency ${file}: ${specifier}`);
    if (specifier.startsWith("@/") || resolved !== unresolved) imports[specifier.startsWith("@/") ? specifier : relative(unresolved)] = relative(resolved);
    queue.push(resolved);
  }
}
const config = { imports: Object.fromEntries(Object.entries(imports).sort(([a], [b]) => a.localeCompare(b))) };
if (process.argv.includes("--print")) process.stdout.write(JSON.stringify(config, null, 2));
else {
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, "deno.json"), "utf8")), config);
  console.log(`Edge import map: ${visited.size} local modules verified (not a Deno runtime test)`);
}