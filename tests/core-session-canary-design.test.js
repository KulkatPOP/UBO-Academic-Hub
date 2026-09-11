import assert from "node:assert/strict";
import { InMemorySession } from "../../UniEcosystemCore/core/session/in-memory-session.js";
import { createIdentitySnapshot } from "../../UniEcosystemCore/core/identity-snapshot.js";
import { getInstitutionConfig } from "../config/institution.js";
import { adaptUboIdentityToCoreSnapshot } from "../services/adapters/core-identity-adapter.js";
import { demoUsers } from "../data/users.js";

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");
const teacherCanaryIdentity = Object.freeze({ id: teacher.id, role: "TEACHER" });

function isTeacherCanaryCandidate(identity) {
  return Boolean(identity) && identity.id === teacherCanaryIdentity.id && identity.role === teacherCanaryIdentity.role;
}

function isEquivalentTeacherIdentity(uboIdentity, snapshot) {
  return isTeacherCanaryCandidate(uboIdentity)
    && snapshot?.id === teacherCanaryIdentity.id
    && Array.isArray(snapshot.roles)
    && snapshot.roles.length === 1
    && snapshot.roles[0] === teacherCanaryIdentity.role;
}

function canaryDesignAbort(reason) {
  return Object.freeze({ allowed: false, action: "ABORT_TO_LEGACY", reason });
}

// La prueba describe reglas futuras; no cambia el valor de la bandera ni conecta
// SessionPort a las rutas, guards, login o logout de UBO.
assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
console.log("CANARY_OFF_BY_DEFAULT_OK");

assert.equal(isTeacherCanaryCandidate({ id: teacher.id, role: teacher.role }), true);
assert.equal(isTeacherCanaryCandidate({ id: teacher.id, role: "ADMIN" }), false);
assert.equal(isTeacherCanaryCandidate({ id: "other", role: "TEACHER" }), false);
console.log("TEACHER_CANARY_SCOPE_OK");

assert.equal(isTeacherCanaryCandidate({ id: student.id, role: student.role }), false);
console.log("STUDENT_OUTSIDE_CANARY_OK");
assert.equal(isTeacherCanaryCandidate({ id: admin.id, role: admin.role }), false);
console.log("ADMIN_OUTSIDE_CANARY_OK");

const teacherSnapshot = adaptUboIdentityToCoreSnapshot({ id: teacher.id, role: teacher.role });
assert.equal(isEquivalentTeacherIdentity({ id: teacher.id, role: teacher.role }, teacherSnapshot), true);
assert.equal(teacherSnapshot.id, teacher.id);
console.log("IDENTITY_EQUIVALENCE_OK");
assert.deepEqual(teacherSnapshot.roles, ["TEACHER"]);
assert.equal(teacherSnapshot.roles.length, 1);
console.log("ROLE_EQUIVALENCE_OK");

// Logout futuro exige limpiar el espejo antes de un posible retorno a Legacy.
const logoutPort = new InMemorySession();
logoutPort.setCurrentIdentity(teacherSnapshot);
logoutPort.clear();
assert.equal(logoutPort.getCurrentIdentity(), null);
assert.deepEqual(canaryDesignAbort("LOGOUT_EQUIVALENCE_REQUIRED"), {
  allowed: false,
  action: "ABORT_TO_LEGACY",
  reason: "LOGOUT_EQUIVALENCE_REQUIRED"
});
console.log("LOGOUT_ROLLBACK_RULE_OK");

// Si se abandona Teacher, el posible espejo Teacher se limpia; nunca combina
// roles con Admin o Student.
const transitionPort = new InMemorySession();
transitionPort.setCurrentIdentity(teacherSnapshot);
for (const nextProfile of [admin, student]) {
  assert.equal(isTeacherCanaryCandidate({ id: nextProfile.id, role: nextProfile.role }), false);
  transitionPort.clear();
  assert.equal(transitionPort.getCurrentIdentity(), null);
  transitionPort.setCurrentIdentity(teacherSnapshot);
}
console.log("PROFILE_SWITCH_RULE_OK");

const adapterFailure = (() => {
  try {
    throw new Error("adapter fixture failure");
  } catch (error) {
    return canaryDesignAbort(`ADAPTER_FAILURE:${error.message}`);
  }
})();
assert.equal(adapterFailure.allowed, false);
assert.match(adapterFailure.reason, /ADAPTER_FAILURE/);
console.log("ADAPTER_FAILURE_ABORT_OK");

for (const operation of ["getCurrentIdentity", "setCurrentIdentity", "clear"]) {
  const abort = canaryDesignAbort(`SESSIONPORT_FAILURE:${operation}`);
  assert.equal(abort.allowed, false);
  assert.equal(abort.action, "ABORT_TO_LEGACY");
}
console.log("SESSIONPORT_FAILURE_ABORT_OK");

const mismatchedSnapshot = createIdentitySnapshot({ id: admin.id, roles: ["ADMIN"] });
assert.equal(isEquivalentTeacherIdentity({ id: teacher.id, role: "TEACHER" }, mismatchedSnapshot), false);
assert.equal(canaryDesignAbort("SNAPSHOT_MISMATCH").allowed, false);
console.log("SNAPSHOT_MISMATCH_ABORT_OK");

const roleMismatchedSnapshot = createIdentitySnapshot({ id: teacher.id, roles: ["ADMIN"] });
assert.equal(isEquivalentTeacherIdentity({ id: teacher.id, role: "TEACHER" }, roleMismatchedSnapshot), false);
assert.equal(canaryDesignAbort("ROLE_MISMATCH").allowed, false);
console.log("ROLE_MISMATCH_ABORT_OK");

const stalePort = new InMemorySession();
stalePort.setCurrentIdentity(teacherSnapshot);
stalePort.clear();
assert.equal(stalePort.getCurrentIdentity(), null);
assert.equal(canaryDesignAbort("STALE_SESSION").allowed, false);
console.log("STALE_SESSION_ABORT_OK");

const escalatedTeacherInput = {
  id: teacher.id,
  role: "TEACHER",
  permissions: ["*"],
  isAdmin: true,
  roles: ["ADMIN"],
  extra: "ignored"
};
assert.deepEqual(adaptUboIdentityToCoreSnapshot(escalatedTeacherInput), { id: teacher.id, roles: ["TEACHER"] });
console.log("NO_PRIVILEGE_ESCALATION_OK");

assert.deepEqual(canaryDesignAbort("MANUAL_ROLLBACK"), {
  allowed: false,
  action: "ABORT_TO_LEGACY",
  reason: "MANUAL_ROLLBACK"
});
console.log("CANARY_ROLLBACK_DESIGN_OK");

console.log("CORE_SESSION_CANARY_DESIGN_READY");
console.log("core-session-canary-design.test.js: OK");
