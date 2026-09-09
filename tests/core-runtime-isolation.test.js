import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const coreRoot = fileURLToPath(new URL("../../UniEcosystemCore/core/", import.meta.url));
const forbiddenImport = /(?:import|export)\s+[\s\S]*?\sfrom\s*["'][^"']*(?:UboAcademicHub|Ubo app academico|data\/university|data\\university|app\.js)[^"']*["']/i;

function getJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return getJavaScriptFiles(path);
    return extname(entry.name) === ".js" ? [path] : [];
  });
}

for (const file of getJavaScriptFiles(coreRoot)) {
  assert.doesNotMatch(readFileSync(file, "utf8"), forbiddenImport, `Core no debe importar UBO: ${file}`);
}

console.log("core-runtime-isolation.test.js: OK");
