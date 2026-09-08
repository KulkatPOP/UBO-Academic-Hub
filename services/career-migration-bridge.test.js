import assert from "node:assert/strict";
import { resolveCareerReadOnly } from "./career-migration-bridge.js";

const off = resolveCareerReadOnly("Ingeniería Informática", {
  enabled: false,
  careerReader: () => { throw new Error("No debe consultarse con flag OFF"); }
});
assert.equal(off.usingCanonical, false);
assert.equal(off.career.name, "Ingeniería Informática");

const on = resolveCareerReadOnly("Ingeniería Informática", { enabled: true });
assert.equal(on.usingCanonical, true);
assert.deepEqual(on.career, {
  careerId: "career-informatica",
  name: "Ingeniería Informática",
  status: "available",
  facultyId: null,
  degreeType: null
});
on.career.name = "Mutada";
assert.equal(resolveCareerReadOnly("Ingeniería Informática", { enabled: true }).career.name, "Ingeniería Informática");

const missing = resolveCareerReadOnly("Carrera inexistente", { enabled: true });
assert.equal(missing.usingCanonical, false);
assert.match(missing.warning, /CAREER CANONICAL UNAVAILABLE/);

const invalidMapping = resolveCareerReadOnly("Ingeniería Informática", {
  enabled: true,
  careerReader: () => [{ careerId: "career-invalid", name: "Ingeniería Informática", status: "" }]
});
assert.equal(invalidMapping.usingCanonical, false);
assert.match(invalidMapping.warning, /mapping, adaptador o modelo no disponible/);

const controlledAdapterResult = resolveCareerReadOnly("Ingeniería Informática", {
  enabled: true,
  careerReader: () => []
});
assert.equal(controlledAdapterResult.usingCanonical, false);
assert.equal(controlledAdapterResult.career.name, "Ingeniería Informática");

console.log("career-migration-bridge.test.js: OK");
