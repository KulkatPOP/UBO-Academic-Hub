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

  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

class FailingSessionPort {
  getCurrentIdentity() { throw new Error("SessionPort fixture get failure"); }
  setCurrentIdentity() { throw new Error("SessionPort fixture set failure"); }
  clear() { throw new Error("SessionPort fixture clear failure"); }
}

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");
const storage = new MemoryStorage();
const sessionOptions = { storage, legacySession: null };

function observe(runtimeIdentity, port = new InMemorySession(), adapter = adaptUboIdentityToCoreSnapshot) {
  try {
    const snapshot = adapter(runtimeIdentity);
    if (snapshot === null) port.clear();
    else port.setCurrentIdentity(snapshot);
    return { snapshot, observed: port.getCurrentIdentity(), error: null };
  } catch (error) {
    return { snapshot: null, observed: null, error };
  }
}

function assertRuntimeAuthority(requiredRole, expectedIdentity) {
  const actual = getCurrentDemoIdentity(sessionOptions);
  assert.deepEqual(actual, expectedIdentity);
  assert.equal(evaluateDemoRouteGuard(requiredRole, actual).allowed, true);
}

assert.equal(getInstitutionConfig().featureFlags.USE_CORE_SESSION, false);
console.log("CORE_SESSION_OFF_BY_DEFAULT_OK");

// Mientras la bandera está apagada, la fuente UBO y los guards vigentes son la
// autoridad. La observación no escribe ni reemplaza esa fuente.
const legacyStudent = { loggedIn: true, studentData: { email: student.email } };
const studentSourceBefore = JSON.stringify(legacyStudent);
const runtimeStudent = getCurrentDemoIdentity({ storage, legacySession: legacyStudent });
assert.deepEqual(runtimeStudent, { id: student.id, role: "STUDENT" });
assert.equal(JSON.stringify(legacyStudent), studentSourceBefore);
assert.deepEqual(observe(runtimeStudent).observed, { id: student.id, roles: ["STUDENT"] });
assert.equal(evaluateDemoRouteGuard("STUDENT", runtimeStudent).allowed, true);
console.log("UBO_SESSION_REMAINS_AUTHORITY_OK");
console.log("STUDENT_COEXISTENCE_OK");

setCurrentDemoIdentity(teacher, sessionOptions);
assertRuntimeAuthority("TEACHER", { id: teacher.id, role: "TEACHER" });
assert.deepEqual(observe(getCurrentDemoIdentity(sessionOptions)).observed, { id: teacher.id, roles: ["TEACHER"] });
console.log("TEACHER_COEXISTENCE_OK");

setCurrentDemoIdentity(admin, sessionOptions);
assertRuntimeAuthority("ADMIN", { id: admin.id, role: "ADMIN" });
assert.deepEqual(observe(getCurrentDemoIdentity(sessionOptions)).observed, { id: admin.id, roles: ["ADMIN"] });
console.log("ADMIN_COEXISTENCE_OK");

clearCurrentDemoIdentity(sessionOptions);
const absent = getCurrentDemoIdentity({ storage, legacySession: null });
assert.equal(absent, null);
assert.equal(observe(absent).observed, null);
assert.equal(evaluateDemoRouteGuard("ADMIN", absent).allowed, false);
console.log("ABSENT_IDENTITY_COEXISTENCE_OK");

for (const invalid of [undefined, {}, { id: "", role: "STUDENT" }, { id: "unknown", role: "STUDENT" }, { id: student.id, role: "ADMIN" }]) {
  const result = observe(invalid);
  assert.equal(result.observed, null);
  assert.ok(result.error instanceof TypeError);
}
console.log("INVALID_IDENTITY_COEXISTENCE_OK");

const profilePort = new InMemorySession();
const profileHistory = [student, teacher, admin, student].map(user => {
  setCurrentDemoIdentity(user, sessionOptions);
  const runtime = getCurrentDemoIdentity(sessionOptions);
  const result = observe(runtime, profilePort);
  assert.equal(result.error, null);
  return result.observed;
});
assert.deepEqual(profileHistory.map(identity => identity.roles), [["STUDENT"], ["TEACHER"], ["ADMIN"], ["STUDENT"]]);
console.log("PROFILE_SWITCH_COEXISTENCE_OK");

const logoutPort = new InMemorySession();
setCurrentDemoIdentity(teacher, sessionOptions);
observe(getCurrentDemoIdentity(sessionOptions), logoutPort);
clearCurrentDemoIdentity(sessionOptions);
assert.equal(observe(getCurrentDemoIdentity({ storage, legacySession: null }), logoutPort).observed, null);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity({ storage, legacySession: null })).allowed, false);
console.log("LOGOUT_COEXISTENCE_OK");

const extraStudent = { id: student.id, role: "STUDENT", permissions: ["*"], isAdmin: true };
assert.deepEqual(observe(extraStudent).observed, { id: student.id, roles: ["STUDENT"] });
console.log("NO_PRIVILEGE_ESCALATION_OK");

const deterministicInput = { id: teacher.id, role: "TEACHER" };
const deterministicExpected = observe(deterministicInput).observed;
for (let attempt = 0; attempt < 5; attempt += 1) {
  assert.deepEqual(observe(deterministicInput).observed, deterministicExpected);
}
console.log("DETERMINISTIC_COEXISTENCE_OK");

// Los fallos nuevos son solo hallazgos de observación: no controlan la sesión
// UBO, los guards ni rutas mientras USE_CORE_SESSION permanezca apagada.
setCurrentDemoIdentity(teacher, sessionOptions);
const runtimeBeforeAdapterFailure = getCurrentDemoIdentity(sessionOptions);
const adapterFailure = observe(runtimeBeforeAdapterFailure, new InMemorySession(), () => {
  throw new Error("Adapter fixture failure");
});
assert.ok(adapterFailure.error instanceof Error);
assertRuntimeAuthority("TEACHER", runtimeBeforeAdapterFailure);
console.log("ADAPTER_FAILURE_ISOLATED_OK");

const failingPort = new FailingSessionPort();
assert.equal(isSessionPort(failingPort), true);
const portFailure = observe(runtimeBeforeAdapterFailure, failingPort);
assert.ok(portFailure.error instanceof Error);
assertRuntimeAuthority("TEACHER", runtimeBeforeAdapterFailure);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(sessionOptions)).allowed, false);

// Un clear fallido en el puerto observado tampoco puede revivir ni retener la
// identidad UBO después del logout real de la fuente vigente.
clearCurrentDemoIdentity(sessionOptions);
const observedLogoutFailure = observe(getCurrentDemoIdentity({ storage, legacySession: null }), new FailingSessionPort());
assert.ok(observedLogoutFailure.error instanceof Error);
assert.equal(getCurrentDemoIdentity({ storage, legacySession: null }), null);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity({ storage, legacySession: null })).allowed, false);
console.log("SESSIONPORT_FAILURE_ISOLATED_OK");
console.log("CORE_SESSION_DOES_NOT_CONTROL_RUNTIME_OK");

// Aun si la observación recibe un snapshot inconsistente o el clear observado
// falla, el rollback formal consiste en mantener la bandera OFF y la fuente UBO.
const mismatchedSnapshot = { id: admin.id, roles: ["ADMIN"] };
assert.notDeepEqual(mismatchedSnapshot, adaptUboIdentityToCoreSnapshot(runtimeBeforeAdapterFailure));
assert.equal(getCurrentDemoIdentity({ storage, legacySession: null }), null);
console.log("NO_STALE_IDENTITY_OK");
console.log("ROLLBACK_DESIGN_OK");

console.log("CORE_SESSION_COEXISTENCE_READY");
console.log("core-session-coexistence.test.js: OK");
