import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInstitutionConfig } from "../config/institution.js";
import { observeCoreIdentityCanary } from "../services/adapters/core-identity-canary-runtime.js";
import { createIdentitySnapshot } from "../../UniEcosystemCore/core/identity-snapshot.js";
import { clearCurrentDemoIdentity, getCurrentDemoIdentity, setCurrentDemoIdentity } from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { demoUsers } from "../data/users.js";

const teacher = demoUsers.find(user => user.id === "teacher-carlos-perez" && user.role === "TEACHER");
const student = demoUsers.find(user => user.role === "STUDENT");
const admin = demoUsers.find(user => user.role === "ADMIN");
const teacherIdentity = Object.freeze({ id: teacher.id, role: teacher.role });
const serviceWorker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const teacherShell = readFileSync(new URL("../modules/professor/teacher-dashboard.js", import.meta.url), "utf8");
const runtimeFiles = [
  "../app.js",
  "../modules/professor/teacher-dashboard.js",
  "../modules/admin/admin-dashboard.js",
  "../core/demo-route-guard.js",
  "../core/demo-identity-session.js",
  "../services/adapters/core-identity-canary-runtime.js"
].map(path => readFileSync(new URL(path, import.meta.url), "utf8"));

const flags = getInstitutionConfig().featureFlags;
assert.deepEqual(flags, {
  USE_CANONICAL_CAREER: false,
  USE_CANONICAL_ROOM: false,
  USE_CORE_SESSION: false,
  USE_CORE_IDENTITY_CANARY: false
});
console.log("CANARY_FLAG_OFF_FINAL_OK");

let coreLoaderCalls = 0;
const off = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: false,
  loadCoreModule: () => { coreLoaderCalls += 1; return { createIdentitySnapshot }; }
});
assert.equal(off.result, "CANARY_OFF_LEGACY_PATH_OK");
assert.equal(coreLoaderCalls, 0);
assert.deepEqual(teacherIdentity, { id: teacher.id, role: teacher.role });
console.log("CANARY_OFF_FULLY_ISOLATED");

const match = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => ({ createIdentitySnapshot })
});
assert.equal(match.result, "IDENTITY_CANARY_MATCH");
assert.deepEqual(teacherIdentity, { id: teacher.id, role: teacher.role });
console.log("IDENTITY_CANARY_MATCH");

for (const user of [student, admin]) {
  let outOfScopeCalls = 0;
  const result = await observeCoreIdentityCanary({ id: user.id, role: user.role }, {
    enabled: true,
    loadCoreModule: () => { outOfScopeCalls += 1; return { createIdentitySnapshot }; }
  });
  assert.equal(result.result, "CORE_IDENTITY_CANARY_OUT_OF_SCOPE");
  assert.equal(outOfScopeCalls, 0);
}
console.log("STUDENT_ISOLATION_OK");
console.log("ADMIN_ISOLATION_OK");
console.log("CANARY_SCOPE_TEACHER_OK");

const mismatch = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => ({ createIdentitySnapshot: () => ({ id: teacher.id, roles: ["ADMIN"] }) })
});
assert.equal(mismatch.result, "IDENTITY_CANARY_MISMATCH");

for (const [expected, options] of [
  ["CORE_BROWSER_UNAVAILABLE", { loadCoreModule: () => Promise.reject(Object.assign(new Error("offline"), { canaryCategory: "CORE_BROWSER_UNAVAILABLE" })) }],
  ["CORE_CORS_ERROR", { loadCoreModule: () => Promise.reject(Object.assign(new Error("cors"), { canaryCategory: "CORE_CORS_ERROR" })) }],
  ["CORE_TIMEOUT", { loadCoreModule: () => new Promise(() => {}), timeoutMs: 1 }],
  ["IDENTITY_ADAPTER_ERROR", { adaptIdentity: () => { throw new Error("invalid adapter"); } }],
  ["IDENTITY_SNAPSHOT_INVALID", { loadCoreModule: () => ({ createIdentitySnapshot: () => ({ id: teacher.id, roles: [] }) }) }]
]) {
  const result = await observeCoreIdentityCanary(teacherIdentity, { enabled: true, ...options });
  assert.equal(result.result, expected);
  assert.deepEqual(teacherIdentity, { id: teacher.id, role: teacher.role });
}
console.log("CANARY_FAILURE_NON_BLOCKING");
console.log("NO_PRIVILEGE_ESCALATION");

const values = new Map();
const storage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key)
};
const sessionOptions = { storage, legacySession: null };
for (const user of [teacher, admin, teacher]) {
  setCurrentDemoIdentity(user, sessionOptions);
  const result = await observeCoreIdentityCanary(getCurrentDemoIdentity(sessionOptions), {
    enabled: true,
    loadCoreModule: () => ({ createIdentitySnapshot })
  });
  assert.equal(result.result, user.role === "TEACHER" ? "IDENTITY_CANARY_MATCH" : "CORE_IDENTITY_CANARY_OUT_OF_SCOPE");
}
console.log("CANARY_PROFILE_SWITCH_CLEAN");

clearCurrentDemoIdentity(sessionOptions);
assert.equal(getCurrentDemoIdentity(sessionOptions), null);
assert.equal(evaluateDemoRouteGuard("TEACHER", null).allowed, false);
assert.equal(evaluateDemoRouteGuard("TEACHER", { id: student.id, role: student.role }).allowed, false);
assert.equal(evaluateDemoRouteGuard("TEACHER", { id: admin.id, role: admin.role }).allowed, false);
console.log("CANARY_LOGOUT_CLEAN");
console.log("UBO_GUARDS_REMAIN_AUTHORITY");

assert.match(teacherShell, /USE_CORE_IDENTITY_CANARY/);
assert.match(teacherShell, /teacherRouteGuard\.identity/);
for (const source of runtimeFiles) {
  assert.doesNotMatch(source, /SessionPort|InMemorySession|AuthorizationContext|PermissionPolicy/);
}
console.log("CORE_SESSION_RUNTIME_CONSUMERS=0");
console.log("CORE_AUTHORIZATION_RUNTIME_CONSUMERS=0");

assert.match(serviceWorker, /ubo-academic-hub-v145/);
assert.match(serviceWorker, /services\/adapters\/core-identity-adapter\.js/);
assert.doesNotMatch(serviceWorker, /UniEcosystemCore|127\.0\.0\.1:3101|identity-snapshot\.js/);
console.log("PWA_CORE_ISOLATION_OK");
console.log("UBO_REMAINS_AUTHORITY");
console.log("CORE_IDENTITY_CANARY_CHECKPOINT_READY");
console.log("core-identity-canary-checkpoint.test.js: OK");
