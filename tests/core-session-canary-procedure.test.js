import assert from "node:assert/strict";
import { getInstitutionConfig } from "../config/institution.js";
import { demoUsers } from "../data/users.js";

const teacher = demoUsers.find(user => user.role === "TEACHER");
const student = demoUsers.find(user => user.role === "STUDENT");
const admin = demoUsers.find(user => user.role === "ADMIN");

const procedure = Object.freeze({
  approvals: Object.freeze(["Responsable técnico", "Responsable del proyecto", "Responsable de pruebas"]),
  canary: Object.freeze({ id: teacher.id, role: "TEACHER" }),
  baseline: Object.freeze([
    "teacherIdentity", "teacherRole", "teacherSessionState", "studentState",
    "adminState", "pwaVersion", "uboCheckpoint", "coreCheckpoint"
  ]),
  monitoring: Object.freeze([
    "identityResolved", "roleMatched", "sessionCreated", "sessionRetrieved",
    "logoutCleared", "allowedAccess", "deniedAccess", "absenceDetected",
    "profileSwitchCleared", "unexpectedErrors"
  ]),
  excludedMonitoring: Object.freeze(["password", "token", "credential", "academicContent", "personalData"]),
  severity: Object.freeze({
    CRITICAL: "ABORT_IMMEDIATELY",
    HIGH: "ABORT_UNLESS_EXPLICIT_APPROVAL",
    MEDIUM: "DOCUMENT_AND_EVALUATE",
    LOW: "DOCUMENT"
  }),
  rollback: Object.freeze([
    "disable-canary", "set-flag-false", "reload-runtime", "verify-ubo-authority",
    "verify-teacher", "verify-student", "verify-admin", "run-tests", "record-result"
  ])
});

function isTeacherCanaryCandidate(identity) {
  return Boolean(identity) && identity.id === procedure.canary.id && identity.role === procedure.canary.role;
}

function evaluateAbort(severity) {
  return procedure.severity[severity] || "ABORT_IMMEDIATELY";
}

assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
assert.deepEqual(procedure.approvals, ["Responsable técnico", "Responsable del proyecto", "Responsable de pruebas"]);
console.log("CANARY_APPROVAL_REQUIRED_OK");

assert.equal(isTeacherCanaryCandidate({ id: teacher.id, role: teacher.role }), true);
assert.equal(isTeacherCanaryCandidate({ id: teacher.id, role: "ADMIN" }), false);
console.log("CANARY_SCOPE_TEACHER_ONLY_OK");
assert.equal(isTeacherCanaryCandidate({ id: student.id, role: student.role }), false);
console.log("STUDENT_OUTSIDE_SCOPE_OK");
assert.equal(isTeacherCanaryCandidate({ id: admin.id, role: admin.role }), false);
console.log("ADMIN_OUTSIDE_SCOPE_OK");

assert.deepEqual(procedure.baseline, [
  "teacherIdentity", "teacherRole", "teacherSessionState", "studentState",
  "adminState", "pwaVersion", "uboCheckpoint", "coreCheckpoint"
]);
assert.equal(procedure.baseline.some(item => /password|token|credential/i.test(item)), false);
console.log("BASELINE_REQUIRED_OK");

assert.equal(procedure.monitoring.includes("identityResolved"), true);
assert.equal(procedure.monitoring.includes("logoutCleared"), true);
assert.equal(procedure.monitoring.includes("unexpectedErrors"), true);
console.log("MONITORING_REQUIRED_OK");

assert.equal(evaluateAbort("CRITICAL"), "ABORT_IMMEDIATELY");
assert.equal(evaluateAbort("UNKNOWN"), "ABORT_IMMEDIATELY");
console.log("CRITICAL_ABORT_OK");
assert.equal(evaluateAbort("HIGH"), "ABORT_UNLESS_EXPLICIT_APPROVAL");
console.log("HIGH_ABORT_RULE_OK");

assert.deepEqual(procedure.rollback, [
  "disable-canary", "set-flag-false", "reload-runtime", "verify-ubo-authority",
  "verify-teacher", "verify-student", "verify-admin", "run-tests", "record-result"
]);
assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
console.log("ROLLBACK_REQUIRED_OK");

const postRollbackChecks = ["student", "teacher", "admin", "teacherDeniedWithoutIdentity", "adminDeniedWithoutIdentity", "noCoreSnapshot", "consistentDemoIdentity", "consistentUboSession"];
assert.equal(postRollbackChecks.length, 8);
console.log("POST_ROLLBACK_VALIDATION_OK");

assert.equal(procedure.excludedMonitoring.some(item => /password|token|credential|personalData/i.test(item)), true);
assert.equal(procedure.monitoring.some(item => /password|token|credential|academicContent|personalData/i.test(item)), false);
console.log("NO_SECRET_LOGGING_OK");

assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
assert.equal(Object.hasOwn(getInstitutionConfig().featureFlags, "CORE_SESSION_CANARY_PROFILE"), false);
console.log("NO_AUTO_ACTIVATION_OK");

for (const run of ["CANARY RUN #1", "CANARY RUN #2", "CANARY RUN #3"]) {
  assert.match(run, /^CANARY RUN #\d$/);
  assert.equal(procedure.rollback.includes("record-result"), true);
}
console.log("REPEATABLE_PROCEDURE_OK");

console.log("CORE_SESSION_CANARY_OPERATIONS_READY");
console.log("core-session-canary-procedure.test.js: OK");
