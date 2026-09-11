import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInstitutionConfig } from "../config/institution.js";

const checklist = readFileSync(new URL("../docs/CORE_SESSION_CANARY_APPROVAL_CHECKLIST.md", import.meta.url), "utf8");

assert.match(checklist, /# Checklist oficial de aprobación previa/);
assert.match(checklist, /ESTADO DEL CHECKLIST: NOT_APPROVED/);
console.log("CANARY_APPROVAL_CHECKLIST_EXISTS");

for (const teacherRequirement of ["Perfil Teacher confirmado", "Carlos Pérez confirmado", "teacher-carlos-perez", "TEACHER"]) {
  assert.match(checklist, new RegExp(teacherRequirement));
}
console.log("TEACHER_SCOPE_REQUIRED");
assert.match(checklist, /Student fuera/);
console.log("STUDENT_OUTSIDE_SCOPE");
assert.match(checklist, /Admin fuera/);
console.log("ADMIN_OUTSIDE_SCOPE");
assert.match(checklist, /Career fuera/);
console.log("CAREER_OUTSIDE_SCOPE");
assert.match(checklist, /Room fuera/);
console.log("ROOM_OUTSIDE_SCOPE");

assert.match(checklist, /Run ID definido/);
assert.match(checklist, /`USE_CORE_SESSION=false` antes del inicio/);
console.log("BASELINE_REQUIRED");
for (const checkpoint of ["ca238a93c2cc15bbf597e643cab26bd02aa42128", "414eee6392afa54e93adcc4f6c42d3be08d4387a", "ubo-academic-hub-v114"]) {
  assert.match(checklist, new RegExp(checkpoint));
}
console.log("CHECKPOINT_REQUIRED");
for (const test of ["Identity Adapter", "Shadow", "Coexistence", "Canary design", "Canary operations", "Canary run record", "PWA/precache", "Suite completa Core"]) {
  assert.match(checklist, new RegExp(test));
}
console.log("TESTS_REQUIRED");

for (const rollbackRule of ["Procedimiento manual disponible", "UBO puede recuperar autoridad", "Sesión Core residual puede detectarse", "Identidad residual puede detectarse"]) {
  assert.match(checklist, new RegExp(rollbackRule));
}
console.log("ROLLBACK_REQUIRED");
assert.match(checklist, /CRITICAL → abort inmediato/);
assert.match(checklist, /HIGH → abort salvo aprobación explícita/);
assert.match(checklist, /No existe fallback permisivo/);
console.log("ABORT_RULES_REQUIRED");

assert.match(checklist, /No se registrarán contraseñas/);
assert.match(checklist, /No se registrarán tokens/);
assert.match(checklist, /No se registrarán cookies/);
assert.match(checklist, /No se registrará sessionStorage completo/);
assert.match(checklist, /No se registrará localStorage completo/);
console.log("NO_SECRET_LOGGING_REQUIRED");

for (const approver of ["Responsable técnico aprueba", "Responsable del proyecto aprueba", "Responsable de pruebas aprueba"]) {
  assert.match(checklist, new RegExp(approver));
}
assert.match(checklist, /APPROVED_FOR_MANUAL_CANARY/);
console.log("MANUAL_APPROVAL_REQUIRED");

assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
assert.equal(Object.hasOwn(getInstitutionConfig().featureFlags, "CORE_SESSION_CANARY_PROFILE"), false);
assert.match(checklist, /No existe activación automática/);
console.log("NO_AUTO_ACTIVATION");
assert.match(checklist, /Core production session: FUTURO CANARY, fuera del runtime actual/);
console.log("CORE_OUTSIDE_RUNTIME_SCOPE");
assert.match(checklist, /APPROVED_FOR_MANUAL_CANARY` \*\*no activa\*\* el canario/);
assert.match(checklist, /La aprobación no habilita el canario/);
console.log("APPROVAL_DOES_NOT_EQUAL_ACTIVATION");

console.log("CORE_SESSION_CANARY_APPROVAL_CHECKLIST_READY");
console.log("core-session-canary-approval-checklist.test.js: OK");
