import assert from "node:assert/strict";
import {
  DEMO_IDENTITY_SESSION_KEY,
  clearCurrentDemoIdentity,
  getCurrentDemoIdentity,
  normalizeDemoIdentity,
  setCurrentDemoIdentity
} from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { demoUsers } from "../data/users.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");
const storage = new MemoryStorage();
const session = { storage, legacySession: null };

function assertDeniedStoredValue(value, label) {
  storage.setItem(DEMO_IDENTITY_SESSION_KEY, value);
  assert.equal(getCurrentDemoIdentity(session), null, `${label} debe denegar identidad.`);
  assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(session)).allowed, false, `${label} no puede acceder a Admin.`);
}

for (const user of [student, teacher, admin]) {
  assert.deepEqual(normalizeDemoIdentity(user), { id: user.id, role: user.role });
}
assert.equal(normalizeDemoIdentity(null), null);
assert.equal(normalizeDemoIdentity({}), null);
assert.equal(normalizeDemoIdentity({ id: student.id, role: "ADMIN" }), null);
assert.equal(normalizeDemoIdentity({ id: teacher.id, role: "STUDENT" }), null);
assert.equal(normalizeDemoIdentity({ id: admin.id, role: "TEACHER" }), null);
console.log("DEMO_IDENTITY_VALIDATION_OK");

for (const [label, value] of [
  ["null", "null"],
  ["undefined", "undefined"],
  ["empty object", "{}"],
  ["array", "[]"],
  ["role string", '"ADMIN"'],
  ["role only", '{"role":"ADMIN"}'],
  ["id only", '{"id":"admin-ubo"}'],
  ["unknown id", '{"id":"unknown","role":"ADMIN"}'],
  ["student admin mismatch", '{"id":"student-sofia-martinez","role":"ADMIN"}'],
  ["teacher student mismatch", '{"id":"teacher-carlos-perez","role":"STUDENT"}']
]) {
  assertDeniedStoredValue(value, label);
}
console.log("SESSION_STORAGE_CORRUPTION_DENIED");

assert.deepEqual(setCurrentDemoIdentity({ ...student, isAdmin: true, permissions: ["admin.dashboard.read"] }, session), { id: student.id, role: "STUDENT" });
assert.deepEqual(JSON.parse(storage.getItem(DEMO_IDENTITY_SESSION_KEY)), { id: student.id, role: "STUDENT" });
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(session)).allowed, false);
assert.equal(evaluateDemoRouteGuard("STUDENT", getCurrentDemoIdentity(session)).allowed, true);
console.log("NO_PRIVILEGE_ESCALATION_OK");

for (const user of [student, teacher, admin, student]) {
  assert.deepEqual(setCurrentDemoIdentity({ ...user, retained: "must-not-persist" }, session), { id: user.id, role: user.role });
  assert.deepEqual(getCurrentDemoIdentity(session), { id: user.id, role: user.role });
  assert.deepEqual(JSON.parse(storage.getItem(DEMO_IDENTITY_SESSION_KEY)), { id: user.id, role: user.role });
}
console.log("PROFILE_SWITCH_REPLACES_IDENTITY_OK");

setCurrentDemoIdentity(teacher, session);
clearCurrentDemoIdentity(session);
assert.equal(getCurrentDemoIdentity(session), null);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity(session)).allowed, false);
setCurrentDemoIdentity(admin, session);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(session)).allowed, true);
clearCurrentDemoIdentity(session);
setCurrentDemoIdentity(student, session);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(session)).allowed, false);
console.log("SESSION_CLEARING_NO_STALE_IDENTITY_OK");

const deterministicIdentity = { role: "ADMIN", id: admin.id, ignored: true };
assert.deepEqual(evaluateDemoRouteGuard("ADMIN", deterministicIdentity), evaluateDemoRouteGuard("ADMIN", { id: admin.id, role: "ADMIN" }));
assert.equal(evaluateDemoRouteGuard("TEACHER", deterministicIdentity).allowed, false);
console.log("DEMO_SESSION_DETERMINISM_OK");

clearCurrentDemoIdentity(session);
console.log("demo-session-hardening.test.js: OK");
