import assert from "node:assert/strict";
import {
  adaptUboIdentityToCoreSnapshot
} from "../services/adapters/core-identity-adapter.js";
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
const session = { storage, legacySession: null };

function observeIdentity(identity, adapter = adaptUboIdentityToCoreSnapshot) {
  try {
    return { snapshot: adapter(identity), error: null };
  } catch (error) {
    return { snapshot: null, error };
  }
}

function assertShadowSnapshot(runtimeIdentity, user, marker) {
  assert.deepEqual(runtimeIdentity, { id: user.id, role: user.role });
  const observation = observeIdentity(runtimeIdentity);
  assert.equal(observation.error, null);
  assert.deepEqual(observation.snapshot, { id: user.id, roles: [user.role] });
  if (marker) console.log(marker);
  return observation.snapshot;
}

// Student conserva uboSession como fuente vigente; el adapter recibe solo la
// identidad ya resuelta por la frontera existente y no toca la sesión fixture.
const legacyStudentSession = {
  loggedIn: true,
  studentData: { email: student.email }
};
const legacyStudentBefore = JSON.stringify(legacyStudentSession);
const runtimeStudent = getCurrentDemoIdentity({ storage, legacySession: legacyStudentSession });
assertShadowSnapshot(runtimeStudent, student, "SHADOW_STUDENT_OK");
assert.equal(JSON.stringify(legacyStudentSession), legacyStudentBefore);
assert.equal(evaluateDemoRouteGuard("STUDENT", runtimeStudent).allowed, true);

setCurrentDemoIdentity(teacher, session);
const runtimeTeacher = getCurrentDemoIdentity(session);
assertShadowSnapshot(runtimeTeacher, teacher, "SHADOW_TEACHER_OK");
assert.equal(evaluateDemoRouteGuard("TEACHER", runtimeTeacher).allowed, true);

setCurrentDemoIdentity(admin, session);
const runtimeAdmin = getCurrentDemoIdentity(session);
assertShadowSnapshot(runtimeAdmin, admin, "SHADOW_ADMIN_OK");
assert.equal(evaluateDemoRouteGuard("ADMIN", runtimeAdmin).allowed, true);

clearCurrentDemoIdentity(session);
const absentRuntimeIdentity = getCurrentDemoIdentity({ storage, legacySession: null });
assert.equal(absentRuntimeIdentity, null);
assert.equal(observeIdentity(absentRuntimeIdentity).snapshot, null);
assert.equal(evaluateDemoRouteGuard("ADMIN", absentRuntimeIdentity).allowed, false);
console.log("SHADOW_ABSENT_IDENTITY_OK");

for (const invalid of [
  undefined,
  {},
  { id: "", role: "STUDENT" },
  { id: "unknown", role: "STUDENT" },
  { id: student.id, role: "ADMIN" },
  { id: teacher.id, role: "STUDENT" },
  { id: admin.id, role: "TEACHER" }
]) {
  const observation = observeIdentity(invalid);
  assert.equal(observation.snapshot, null);
  assert.ok(observation.error instanceof TypeError);
}
console.log("SHADOW_INVALID_IDENTITY_OK");

const transitions = [student, teacher, admin, student].map(user => {
  setCurrentDemoIdentity(user, session);
  const runtimeIdentity = getCurrentDemoIdentity(session);
  return assertShadowSnapshot(runtimeIdentity, user, "");
});
assert.deepEqual(transitions.map(snapshot => snapshot.roles), [["STUDENT"], ["TEACHER"], ["ADMIN"], ["STUDENT"]]);
console.log("SHADOW_PROFILE_SWITCH_OK");

// Logout se prueba con las fuentes actuales ya separadas, sin conectarlas a Core.
setCurrentDemoIdentity(teacher, session);
clearCurrentDemoIdentity(session);
assert.equal(getCurrentDemoIdentity({ storage, legacySession: null }), null);
assert.equal(observeIdentity(null).snapshot, null);

setCurrentDemoIdentity(admin, session);
clearCurrentDemoIdentity(session);
assert.equal(getCurrentDemoIdentity({ storage, legacySession: null }), null);
assert.equal(observeIdentity(null).snapshot, null);

const loggedOutStudentSession = null;
assert.equal(getCurrentDemoIdentity({ storage, legacySession: loggedOutStudentSession }), null);
assert.equal(observeIdentity(null).snapshot, null);
console.log("SHADOW_LOGOUT_OK");

const studentWithExtraProperties = {
  id: student.id,
  role: "STUDENT",
  permissions: ["*"],
  isAdmin: true,
  roleClaims: ["ADMIN"]
};
const adminWithExtraProperties = {
  id: admin.id,
  role: "ADMIN",
  permissions: ["teacher.dashboard.read"],
  roleClaims: ["TEACHER"]
};
assert.deepEqual(observeIdentity(studentWithExtraProperties).snapshot, { id: student.id, roles: ["STUDENT"] });
assert.deepEqual(observeIdentity(adminWithExtraProperties).snapshot, { id: admin.id, roles: ["ADMIN"] });
console.log("SHADOW_NO_PRIVILEGE_ESCALATION_OK");

const immutable = observeIdentity({ id: student.id, role: student.role }).snapshot;
assert.equal(Object.isFrozen(immutable), true);
assert.equal(Object.isFrozen(immutable.roles), true);
assert.throws(() => { immutable.id = "other"; }, TypeError);
assert.throws(() => immutable.roles.push("ADMIN"), TypeError);
assert.deepEqual(student.role, "STUDENT");
console.log("SHADOW_IMMUTABILITY_OK");

const input = { id: teacher.id, role: teacher.role };
const expected = observeIdentity(input).snapshot;
for (let attempt = 0; attempt < 5; attempt += 1) {
  assert.deepEqual(observeIdentity(input).snapshot, expected);
}
console.log("SHADOW_DETERMINISM_OK");

// Un fallo aislado del observador nunca escribe identidad ni modifica la decisión
// de los guards actuales: la autorización continúa usando el runtime UBO vigente.
setCurrentDemoIdentity(teacher, session);
const runtimeBeforeFailure = getCurrentDemoIdentity(session);
const failedObservation = observeIdentity(runtimeBeforeFailure, () => {
  throw new Error("shadow adapter fixture failure");
});
assert.equal(failedObservation.snapshot, null);
assert.match(failedObservation.error.message, /fixture failure/);
assert.deepEqual(getCurrentDemoIdentity(session), runtimeBeforeFailure);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity(session)).allowed, true);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(session)).allowed, false);
clearCurrentDemoIdentity(session);
console.log("ADAPTER_FAILURE_DOES_NOT_CONTROL_RUNTIME");

console.log("CORE_IDENTITY_SHADOW_READY");
console.log("core-identity-shadow.test.js: OK");
