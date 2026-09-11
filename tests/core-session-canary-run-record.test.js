import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInstitutionConfig } from "../config/institution.js";

const record = readFileSync(new URL("../docs/CORE_SESSION_CANARY_RUN_RECORD.md", import.meta.url), "utf8");
const requiredScenarios = [
  "Teacher identity resolution", "Teacher session creation", "Teacher session retrieval",
  "Teacher dashboard", "Teacher direct route", "Teacher logout", "Teacher access after logout",
  "Teacher → Student", "Teacher → Admin", "Student → Teacher", "Admin → Teacher",
  "Adapter failure", "SessionPort failure", "Identity mismatch", "Role mismatch",
  "Stale session", "Corrupt identity", "Unknown role", "Repeated login/logout"
];

assert.match(record, /STATUS: TEMPLATE_ONLY/);
assert.match(record, /CANARY_STATUS: NOT_ACTIVATED/);
assert.match(record, /\*\*Valor de esta plantilla:\*\* `NOT_RUN`/);
console.log("CANARY_RUN_TEMPLATE_OK");

assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
assert.match(record, /\| USE_CORE_SESSION \| `false` \|/);
console.log("CANARY_NOT_ACTIVATED_OK");

assert.match(record, /\| CANARY_PROFILE \| `TEACHER` \|/);
assert.match(record, /\| PROFILE_ID \| `teacher-carlos-perez` \|/);
assert.match(record, /\| ROLE \| `TEACHER` \|/);
console.log("TEACHER_SCOPE_OK");
assert.match(record, /\| Student \| `OUTSIDE_SCOPE` \|/);
console.log("STUDENT_OUTSIDE_SCOPE_OK");
assert.match(record, /\| Admin \| `OUTSIDE_SCOPE` \|/);
console.log("ADMIN_OUTSIDE_SCOPE_OK");

assert.match(record, /Está prohibido incluir contraseñas, tokens, cookies, credenciales, secretos/);
assert.doesNotMatch(record, /\b(password|api[_-]?key|token\s*[:=]|secret\s*[:=])\b/i);
console.log("NO_SECRET_FIELDS_OK");

for (const precheck of ["Core checkpoint confirmado", "UBO checkpoint confirmado", "UBO tests correctos", "Core tests correctos", "PWA y precache correctos", "Rollback disponible"]) {
  assert.match(record, new RegExp(precheck));
}
console.log("PRECHECK_REQUIRED_OK");

for (const baseline of ["teacher-carlos-perez", "SIN SESIÓN CORE", "FUERA DE ALCANCE"]) {
  assert.match(record, new RegExp(baseline));
}
console.log("BASELINE_REQUIRED_OK");

for (const scenario of requiredScenarios) assert.match(record, new RegExp(scenario));
assert.match(record, /PASS`, `FAIL`, `ABORT`, `NOT_RUN`, `NOT_APPLICABLE/);
console.log("EXECUTION_MATRIX_OK");

assert.match(record, /## ABORT RECORD/);
assert.match(record, /Una falla \*\*CRITICAL\*\* no puede registrarse como `PASS`/);
console.log("ABORT_RECORD_OK");
assert.match(record, /## ROLLBACK RECORD/);
assert.match(record, /Rollback target \| `USE_CORE_SESSION=false`/);
console.log("ROLLBACK_RECORD_OK");
assert.match(record, /## Validación post-rollback/);
assert.match(record, /No existe sesión Core residual/);
console.log("POST_ROLLBACK_REQUIRED_OK");

assert.match(record, /NOT_RUN`, `SUCCESS`, `ABORTED`, `ROLLED_BACK`, `DO_NOT_CONTINUE/);
assert.match(record, /No marcar `SUCCESS` si existe un CRITICAL/);
console.log("FINAL_DECISION_RULES_OK");

for (const run of ["Run #1", "Run #2", "Run #3"]) assert.match(record, new RegExp(run));
console.log("RUN_HISTORY_SUPPORTED_OK");

console.log("CORE_SESSION_CANARY_RUN_RECORD_READY");
console.log("core-session-canary-run-record.test.js: OK");
