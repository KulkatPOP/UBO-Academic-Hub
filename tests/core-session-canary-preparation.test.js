import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInstitutionConfig } from "../config/institution.js";

const preparation = readFileSync(new URL("../docs/CORE_SESSION_CANARY_PREPARATION.md", import.meta.url), "utf8");

assert.match(preparation, /CANARY_RUN_ID: CANARY-TEACHER-001/);
console.log("CANARY_RUN_ID_DEFINED");
assert.match(preparation, /RUN_STATUS: NOT_STARTED/);
assert.match(preparation, /CANARY_EXECUTION: NOT_STARTED/);
console.log("CANARY_NOT_STARTED");
assert.match(preparation, /CANARY_AUTHORIZATION: NOT_GRANTED/);
console.log("CANARY_NOT_AUTHORIZED");

assert.match(preparation, /teacher-carlos-perez/);
assert.match(preparation, /`TEACHER`/);
assert.match(preparation, /Teacher \| `CANARY_SCOPE`/);
console.log("TEACHER_SCOPE_DEFINED");
assert.match(preparation, /Student \| `OUTSIDE_SCOPE`/);
console.log("STUDENT_OUTSIDE_SCOPE");
assert.match(preparation, /Admin \| `OUTSIDE_SCOPE`/);
console.log("ADMIN_OUTSIDE_SCOPE");
assert.match(preparation, /Career \| `OUTSIDE_SCOPE`/);
console.log("CAREER_OUTSIDE_SCOPE");
assert.match(preparation, /Room \| `OUTSIDE_SCOPE`/);
console.log("ROOM_OUTSIDE_SCOPE");

for (const baseline of ["Core Session", "UBO Session", "USE_CORE_SESSION", "USE_CANONICAL_CAREER", "USE_CANONICAL_ROOM"]) {
  assert.match(preparation, new RegExp(baseline));
}
console.log("BASELINE_DEFINED");
assert.match(preparation, /Rollback objetivo: `USE_CORE_SESSION=false`/);
console.log("ROLLBACK_DEFINED");
assert.match(preparation, /Abort inmediato ante identidad o rol incorrectos/);
console.log("ABORT_DEFINED");
assert.match(preparation, /No se registran contraseñas, tokens, cookies, credenciales/);
console.log("NO_SECRET_LOGGING");

assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
assert.equal(Object.hasOwn(getInstitutionConfig().featureFlags, "CORE_SESSION_CANARY_PROFILE"), false);
assert.match(preparation, /No activa `USE_CORE_SESSION`/);
console.log("NO_AUTO_ACTIVATION");
assert.match(preparation, /Core Session \| `OFF`/);
console.log("CORE_OUTSIDE_RUNTIME_SCOPE");
assert.match(preparation, /PWA `ubo-academic-hub-v114`/);
console.log("PWA_UNCHANGED");
assert.equal(getInstitutionConfig().featureFlags.USE_CANONICAL_CAREER, false);
assert.equal(getInstitutionConfig().featureFlags.USE_CANONICAL_ROOM, false);
console.log("FLAGS_OFF");

console.log("CANARY_RUN_PREPARATION_READY");
console.log("core-session-canary-preparation.test.js: OK");
