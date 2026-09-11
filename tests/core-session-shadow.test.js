import assert from "node:assert/strict";
import { InMemorySession } from "../../UniEcosystemCore/core/session/in-memory-session.js";
import { isSessionPort } from "../../UniEcosystemCore/core/ports/session-port.js";
import { getInstitutionConfig } from "../config/institution.js";
import { adaptUboIdentityToCoreSnapshot } from "../services/adapters/core-identity-adapter.js";
import {
  clearCurrentDemoIdentity,
  getCurrentDemoIdentity,
  setCurrentDemoIdentity
} from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { demoUsers } from "../data/users.js";

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }
}

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");
const storage = new MemoryStorage();
const sessionOptions = { storage, legacySession: null };

function observeInCoreSession(runtimeIdentity, observedSession = new InMemorySession(), adapter = adaptUboIdentityToCoreSnapshot) {
  try {
    const snapshot = adapter(runtimeIdentity);
    if (snapshot === null) observedSession.clear();
    else observedSession.setCurrentIdentity(snapshot);

    return { snapshot, observedIdentity: observedSession.getCurrentIdentity(), error: null };
  } catch (error) {
    // El observador no transforma un fallo en sesión, permiso ni navegación.
    return { snapshot: null, observedIdentity: observedSession.getCurrentIdentity(), error };
  }
}

function assertObservedProfile(runtimeIdentity, user, marker) {
  const observedSession = new InMemorySession();
  assert.equal(isSessionPort(observedSession), true);
  const result = observeInCoreSession(runtimeIdentity, observedSession);
  assert.equal(result.error, null);
  assert.deepEqual(result.snapshot, { id: user.id, roles: [user.role] });
  assert.deepEqual(result.observedIdentity, { id: user.id, roles: [user.role] });
  console.log(marker);
}

const config = getInstitutionConfig();
assert.equal(config.featureFlags.USE_CORE_SESSION, false);
console.log("CORE_SESSION_FLAG_OFF_OK");

// Student sigue siendo legacy: la prueba recibe su identidad ya resuelta y no
// escribe ni inspecciona almacenamiento directamente desde el adapter.
const legacyStudentSession = {
  loggedIn: true,
  studentData: { email: student.email }
};
const legacyBefore = JSON.stringify(legacyStudentSession);
const runtimeStudent = getCurrentDemoIdentity({ storage, legacySession: legacyStudentSession });
assertObservedProfile(runtimeStudent, student, "CORE_SESSION_SHADOW_STUDENT_OK");
assert.equal(JSON.stringify(legacyStudentSession), legacyBefore);
assert.equal(evaluateDemoRouteGuard("STUDENT", runtimeStudent).allowed, true);

setCurrentDemoIdentity(teacher, sessionOptions);
const runtimeTeacher = getCurrentDemoIdentity(sessionOptions);
assertObservedProfile(runtimeTeacher, teacher, "CORE_SESSION_SHADOW_TEACHER_OK");
assert.equal(evaluateDemoRouteGuard("TEACHER", runtimeTeacher).allowed, true);

setCurrentDemoIdentity(admin, sessionOptions);
const runtimeAdmin = getCurrentDemoIdentity(sessionOptions);
assertObservedProfile(runtimeAdmin, admin, "CORE_SESSION_SHADOW_ADMIN_OK");
assert.equal(evaluateDemoRouteGuard("ADMIN", runtimeAdmin).allowed, true);

clearCurrentDemoIdentity(sessionOptions);
const absentRuntimeIdentity = getCurrentDemoIdentity({ storage, legacySession: null });
const absentObservedSession = new InMemorySession();
absentObservedSession.setCurrentIdentity({ id: teacher.id, roles: [teacher.role] });
const absentResult = observeInCoreSession(absentRuntimeIdentity, absentObservedSession);
assert.equal(absentRuntimeIdentity, null);
assert.equal(absentResult.snapshot, null);
assert.equal(absentResult.observedIdentity, null);
assert.equal(evaluateDemoRouteGuard("TEACHER", absentRuntimeIdentity).allowed, false);
console.log("CORE_SESSION_SHADOW_ABSENT_OK");

for (const invalid of [
  undefined,
  {},
  { id: "", role: "STUDENT" },
  { id: "unknown", role: "STUDENT" },
  { id: student.id, role: "ADMIN" },
  { id: teacher.id, role: "STUDENT" }
]) {
  const result = observeInCoreSession(invalid);
  assert.equal(result.snapshot, null);
  assert.equal(result.observedIdentity, null);
  assert.ok(result.error instanceof TypeError);
}
console.log("CORE_SESSION_SHADOW_INVALID_OK");

const profileSession = new InMemorySession();
const profileSnapshots = [student, teacher, admin, student].map(user => {
  setCurrentDemoIdentity(user, sessionOptions);
  const runtimeIdentity = getCurrentDemoIdentity(sessionOptions);
  const result = observeInCoreSession(runtimeIdentity, profileSession);
  assert.equal(result.error, null);
  return result.observedIdentity;
});
assert.deepEqual(profileSnapshots.map(snapshot => snapshot.roles), [["STUDENT"], ["TEACHER"], ["ADMIN"], ["STUDENT"]]);
console.log("CORE_SESSION_SHADOW_PROFILE_SWITCH_OK");

setCurrentDemoIdentity(teacher, sessionOptions);
const teacherObservedSession = new InMemorySession();
observeInCoreSession(getCurrentDemoIdentity(sessionOptions), teacherObservedSession);
clearCurrentDemoIdentity(sessionOptions);
assert.equal(observeInCoreSession(getCurrentDemoIdentity({ storage, legacySession: null }), teacherObservedSession).observedIdentity, null);

setCurrentDemoIdentity(admin, sessionOptions);
const adminObservedSession = new InMemorySession();
observeInCoreSession(getCurrentDemoIdentity(sessionOptions), adminObservedSession);
clearCurrentDemoIdentity(sessionOptions);
assert.equal(observeInCoreSession(getCurrentDemoIdentity({ storage, legacySession: null }), adminObservedSession).observedIdentity, null);

const studentObservedSession = new InMemorySession();
observeInCoreSession(runtimeStudent, studentObservedSession);
assert.equal(observeInCoreSession(null, studentObservedSession).observedIdentity, null);
console.log("CORE_SESSION_SHADOW_LOGOUT_OK");

const extraStudent = { id: student.id, role: "STUDENT", permissions: ["*"], isAdmin: true };
const extraAdmin = { id: admin.id, role: "ADMIN", permissions: ["teacher.dashboard.read"], isTeacher: true };
assert.deepEqual(observeInCoreSession(extraStudent).observedIdentity, { id: student.id, roles: ["STUDENT"] });
assert.deepEqual(observeInCoreSession(extraAdmin).observedIdentity, { id: admin.id, roles: ["ADMIN"] });
console.log("CORE_SESSION_SHADOW_NO_PRIVILEGE_ESCALATION_OK");

const immutableResult = observeInCoreSession({ id: student.id, role: "STUDENT" });
assert.equal(Object.isFrozen(immutableResult.observedIdentity), true);
assert.equal(Object.isFrozen(immutableResult.observedIdentity.roles), true);
assert.throws(() => { immutableResult.observedIdentity.id = "changed"; }, TypeError);
assert.throws(() => immutableResult.observedIdentity.roles.push("ADMIN"), TypeError);
console.log("CORE_SESSION_SHADOW_IMMUTABILITY_OK");

const deterministicSession = new InMemorySession();
const deterministicInput = { id: teacher.id, role: "TEACHER" };
const expected = observeInCoreSession(deterministicInput, deterministicSession).observedIdentity;
for (let attempt = 0; attempt < 5; attempt += 1) {
  assert.deepEqual(observeInCoreSession(deterministicInput, deterministicSession).observedIdentity, expected);
}
console.log("CORE_SESSION_SHADOW_DETERMINISM_OK");

// Un fallo aislado no puede cerrar, abrir ni alterar la sesión UBO actual.
setCurrentDemoIdentity(teacher, sessionOptions);
const runtimeBeforeFailure = getCurrentDemoIdentity(sessionOptions);
const failureResult = observeInCoreSession(runtimeBeforeFailure, new InMemorySession(), () => {
  throw new Error("session shadow adapter fixture failure");
});
assert.equal(failureResult.snapshot, null);
assert.equal(failureResult.observedIdentity, null);
assert.match(failureResult.error.message, /fixture failure/);
assert.deepEqual(getCurrentDemoIdentity(sessionOptions), runtimeBeforeFailure);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity(sessionOptions)).allowed, true);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(sessionOptions)).allowed, false);
clearCurrentDemoIdentity(sessionOptions);
console.log("ADAPTER_FAILURE_DOES_NOT_CONTROL_SESSION");

console.log("CORE_SESSION_SHADOW_READY");
console.log("core-session-shadow.test.js: OK");
