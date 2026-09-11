import assert from "node:assert/strict";
import { adaptUboIdentityToCoreSnapshot } from "../services/adapters/core-identity-adapter.js";
import {
  clearCurrentDemoIdentity,
  getCurrentDemoIdentity,
  setCurrentDemoIdentity
} from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { demoUsers } from "../data/users.js";

const CANARY_PROFILE = Object.freeze({ id: "teacher-carlos-perez", role: "TEACHER" });
const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");

class MemoryStorage {
  #values = new Map();

  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

function cloneIdentity(identity) {
  return identity ? { id: identity.id, role: identity.role } : null;
}

function isKnownDemoIdentity(identity) {
  return Boolean(identity && demoUsers.some(user => user.id === identity.id && user.role === identity.role));
}

// Harness de observación: no se importa desde runtime, no conserva snapshots y
// jamás entrega una decisión a sesión, guard, login, logout o navegación.
function observeTeacherIdentityCanary(uboIdentity, options = {}) {
  const { adapter = adaptUboIdentityToCoreSnapshot, coreAvailable = true } = options;
  const identity = cloneIdentity(uboIdentity);

  if (!coreAvailable) return Object.freeze({ status: "IDENTITY_CANARY_NOT_RUN", identity, errorType: null });
  if (!identity) return Object.freeze({ status: "IDENTITY_CANARY_NOT_RUN", identity, errorType: null });
  if (!isKnownDemoIdentity(identity)) {
    return Object.freeze({ status: "IDENTITY_CANARY_INVALID", identity, errorType: null });
  }
  if (identity.id !== CANARY_PROFILE.id || identity.role !== CANARY_PROFILE.role) {
    return Object.freeze({ status: "IDENTITY_CANARY_NOT_RUN", identity, errorType: null });
  }

  try {
    const snapshot = adapter(identity);
    if (!snapshot || snapshot.id !== identity.id || !Array.isArray(snapshot.roles) || snapshot.roles.length !== 1) {
      return Object.freeze({ status: "IDENTITY_CANARY_INVALID", identity, errorType: null });
    }
    if (snapshot.roles[0] !== identity.role) {
      return Object.freeze({ status: "IDENTITY_CANARY_MISMATCH", identity, errorType: null });
    }
    return Object.freeze({ status: "IDENTITY_CANARY_MATCH", identity, errorType: null });
  } catch (error) {
    return Object.freeze({
      status: "IDENTITY_CANARY_ADAPTER_ERROR",
      identity,
      errorType: error instanceof Error ? error.name : "UnknownError"
    });
  }
}

assert.deepEqual(CANARY_PROFILE, { id: teacher.id, role: teacher.role });

const teacherRuntime = { id: teacher.id, role: teacher.role };
const teacherBefore = JSON.stringify(teacherRuntime);
const teacherObservation = observeTeacherIdentityCanary(teacherRuntime);
assert.equal(teacherObservation.status, "IDENTITY_CANARY_MATCH");
assert.deepEqual(teacherRuntime, JSON.parse(teacherBefore));
assert.equal(Object.isFrozen(teacherObservation), true);
console.log("IDENTITY_CANARY_MATCH");

// Student y Admin quedan explícitamente fuera del scope productivo del canario.
assert.equal(observeTeacherIdentityCanary({ id: student.id, role: student.role }).status, "IDENTITY_CANARY_NOT_RUN");
assert.equal(observeTeacherIdentityCanary({ id: admin.id, role: admin.role }).status, "IDENTITY_CANARY_NOT_RUN");
console.log("CANARY_PROFILE_SCOPE_OK");

for (const invalidIdentity of [
  { id: "teacher-incorrect", role: "TEACHER" },
  { id: teacher.id, role: "ADMIN" },
  { id: teacher.id, role: "STUDENT" },
  { id: "admin-ubo", role: "TEACHER" }
]) {
  assert.equal(observeTeacherIdentityCanary(invalidIdentity).status, "IDENTITY_CANARY_INVALID");
}

const mismatch = observeTeacherIdentityCanary(teacherRuntime, {
  adapter: () => Object.freeze({ id: teacher.id, roles: Object.freeze(["ADMIN"]) })
});
assert.equal(mismatch.status, "IDENTITY_CANARY_MISMATCH");
assert.deepEqual(teacherRuntime, { id: teacher.id, role: teacher.role });
console.log("IDENTITY_CANARY_MISMATCH");

const corruptSnapshot = observeTeacherIdentityCanary(teacherRuntime, { adapter: () => ({ id: teacher.id, roles: [] }) });
assert.equal(corruptSnapshot.status, "IDENTITY_CANARY_INVALID");

const adapterFailure = observeTeacherIdentityCanary(teacherRuntime, {
  adapter: () => { throw new Error("adapter fixture failure"); }
});
assert.equal(adapterFailure.status, "IDENTITY_CANARY_ADAPTER_ERROR");
assert.equal(adapterFailure.errorType, "Error");
assert.deepEqual(teacherRuntime, { id: teacher.id, role: teacher.role });
console.log("CANARY_FAILURE_NON_BLOCKING");

let absentAdapterCalled = false;
const coreAbsent = observeTeacherIdentityCanary(teacherRuntime, {
  coreAvailable: false,
  adapter: () => { absentAdapterCalled = true; return null; }
});
assert.equal(coreAbsent.status, "IDENTITY_CANARY_NOT_RUN");
assert.equal(absentAdapterCalled, false);

const escalationCandidate = { id: teacher.id, role: teacher.role, permissions: ["*"], isAdmin: true, roles: ["ADMIN"] };
assert.equal(observeTeacherIdentityCanary(escalationCandidate).status, "IDENTITY_CANARY_MATCH");
assert.deepEqual(adaptUboIdentityToCoreSnapshot(escalationCandidate), { id: teacher.id, roles: [teacher.role] });
console.log("NO_PRIVILEGE_ESCALATION");

for (let attempt = 0; attempt < 5; attempt += 1) {
  assert.deepEqual(observeTeacherIdentityCanary(teacherRuntime), teacherObservation);
}

const storage = new MemoryStorage();
const options = { storage, legacySession: null };
for (const user of [teacher, admin, teacher]) {
  setCurrentDemoIdentity(user, options);
  const runtimeIdentity = getCurrentDemoIdentity(options);
  const observation = observeTeacherIdentityCanary(runtimeIdentity);
  assert.equal(observation.status, user.role === "TEACHER" ? "IDENTITY_CANARY_MATCH" : "IDENTITY_CANARY_NOT_RUN");
}
console.log("CANARY_PROFILE_SWITCH_OK");

setCurrentDemoIdentity(teacher, options);
assert.equal(observeTeacherIdentityCanary(getCurrentDemoIdentity(options)).status, "IDENTITY_CANARY_MATCH");
clearCurrentDemoIdentity(options);
assert.equal(getCurrentDemoIdentity(options), null);
assert.equal(observeTeacherIdentityCanary(null).status, "IDENTITY_CANARY_NOT_RUN");
assert.equal(evaluateDemoRouteGuard("TEACHER", null).allowed, false);
console.log("CANARY_LOGOUT_CLEAN");

assert.equal(evaluateDemoRouteGuard("TEACHER", { id: teacher.id, role: teacher.role }).allowed, true);
assert.equal(evaluateDemoRouteGuard("ADMIN", { id: teacher.id, role: teacher.role }).allowed, false);
console.log("UBO_RUNTIME_UNCHANGED");
console.log("CORE_RUNTIME_UNCHANGED");
console.log("CORE_IDENTITY_CANARY_READY");
console.log("core-identity-canary.test.js: OK");
