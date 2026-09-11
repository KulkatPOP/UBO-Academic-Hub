import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const uboRoot = fileURLToPath(new URL("../", import.meta.url));
const expectedCoreRoot = resolve(uboRoot, "../UniEcosystemCore");
const identitySnapshotPath = join(expectedCoreRoot, "core", "identity-snapshot.js");

function resolveLocalCoreModule(coreRoot = expectedCoreRoot) {
  const modulePath = join(resolve(coreRoot), "core", "identity-snapshot.js");
  if (!existsSync(modulePath)) {
    throw new Error(`CORE_LOCAL_MODULE_NOT_FOUND: ${modulePath}`);
  }
  return modulePath;
}

function collectJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

assert.equal(existsSync(join(uboRoot, "package.json")), false, "UBO no debe introducir package.json en esta fase.");
assert.equal(existsSync(identitySnapshotPath), true, "El Core real debe estar disponible en el repositorio hermano esperado.");
assert.equal(expectedCoreRoot.includes("UniEcosystemCore"), true);
console.log("CORE_LOCAL_PATH_RESOLVED");

const resolvedModulePath = resolveLocalCoreModule();
const { createIdentitySnapshot } = await import(pathToFileURL(resolvedModulePath).href);
const teacherSnapshot = createIdentitySnapshot({ id: "teacher-carlos-perez", roles: ["TEACHER"] });
assert.deepEqual(teacherSnapshot, { id: "teacher-carlos-perez", roles: ["TEACHER"] });
assert.equal(Object.isFrozen(teacherSnapshot), true);
assert.equal(Object.isFrozen(teacherSnapshot.roles), true);
console.log("CORE_NODE_CONSUMPTION_OK");

for (let attempt = 0; attempt < 5; attempt += 1) {
  assert.deepEqual(createIdentitySnapshot({ id: "teacher-carlos-perez", roles: ["TEACHER"] }), teacherSnapshot);
}
console.log("CORE_LOCAL_RESOLUTION_DETERMINISTIC");

assert.throws(
  () => resolveLocalCoreModule(join(dirname(expectedCoreRoot), "UniEcosystemCore-missing")),
  /CORE_LOCAL_MODULE_NOT_FOUND/
);
console.log("CORE_LOCAL_MISSING_PATH_CLEAR_ERROR");

assert.equal(existsSync(join(uboRoot, "UniEcosystemCore")), false, "No debe existir una copia de Core dentro de UBO.");
assert.equal(existsSync(join(uboRoot, "core", "identity-snapshot.js")), false, "UBO no debe duplicar IdentitySnapshot.");
console.log("NO_CORE_COPY_IN_UBO");

const coreSourceFiles = collectJavaScriptFiles(join(expectedCoreRoot, "core"));
for (const sourceFile of coreSourceFiles) {
  const source = readFileSync(sourceFile, "utf8");
  assert.equal(/UboAcademicHub|Ubo app academico|\.\.\/Ubo/i.test(source), false, `Core no debe importar UBO: ${sourceFile}`);
}
assert.equal(statSync(expectedCoreRoot).isDirectory(), true);
console.log("NO_UBO_IMPORT_IN_CORE");
console.log("ONE_WAY_DEPENDENCY_DIRECTION_OK");
console.log("CORE_PRODUCT_ISOLATION_OK");
console.log("CORE_RUNTIME_ISOLATION_OK");
console.log("core-local-consumption.test.js: OK");
