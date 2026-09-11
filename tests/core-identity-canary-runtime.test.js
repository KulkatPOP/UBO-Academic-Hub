import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adaptUboIdentityToCoreSnapshot } from "../services/adapters/core-identity-adapter.js";
import { observeCoreIdentityCanary } from "../services/adapters/core-identity-canary-runtime.js";
import { getInstitutionConfig } from "../config/institution.js";
import { createIdentitySnapshot } from "../../UniEcosystemCore/core/identity-snapshot.js";
import { clearCurrentDemoIdentity, getCurrentDemoIdentity, setCurrentDemoIdentity } from "../core/demo-identity-session.js";
import { demoUsers } from "../data/users.js";

const teacherIdentity = Object.freeze({ id: "teacher-carlos-perez", role: "TEACHER" });
const serviceWorker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const teacherShell = readFileSync(new URL("../modules/professor/teacher-dashboard.js", import.meta.url), "utf8");

const precacheAssets = [...serviceWorker.matchAll(/["']([^"']+)["']/g)].map(([, asset]) => asset.replace(/^\.\//, ""));
const prospectiveAdapterAsset = "services/adapters/core-identity-adapter.js";

assert.equal(precacheAssets.includes("modules/professor/teacher-dashboard.js"), true);
assert.equal(precacheAssets.includes(prospectiveAdapterAsset), true);
assert.match(teacherShell, /import\("\.\.\/\.\.\/services\/adapters\/core-identity-canary-runtime\.js"\)/);
assert.doesNotMatch(teacherShell, /SessionPort|InMemorySession|AuthorizationContext/);

const prospectiveGraph = new Set(["modules/professor/teacher-dashboard.js", prospectiveAdapterAsset]);
const missingPrecacheAssets = [...prospectiveGraph].filter(asset => !precacheAssets.includes(asset));
assert.deepEqual(missingPrecacheAssets, []);
console.log("ADAPTER_PRECACHE_READY");

const nodeSnapshot = adaptUboIdentityToCoreSnapshot(teacherIdentity);
assert.deepEqual(nodeSnapshot, { id: teacherIdentity.id, roles: [teacherIdentity.role] });
assert.equal(Object.isFrozen(nodeSnapshot), true);
console.log("IDENTITY_CANARY_MATCH_NODE_ONLY");

const mismatchSnapshot = Object.freeze({ id: teacherIdentity.id, roles: Object.freeze(["ADMIN"]) });
assert.notDeepEqual(mismatchSnapshot, nodeSnapshot);
assert.deepEqual(teacherIdentity, { id: "teacher-carlos-perez", role: "TEACHER" });
console.log("IDENTITY_CANARY_MISMATCH_NON_BLOCKING_FIXTURE_OK");

const flags = getInstitutionConfig().featureFlags;
assert.deepEqual(flags, {
  USE_CANONICAL_CAREER: false,
  USE_CANONICAL_ROOM: false,
  USE_CORE_SESSION: false,
  USE_CORE_IDENTITY_CANARY: false
});
assert.equal(await observeCoreIdentityCanary(teacherIdentity, {
  enabled: false,
  loadCoreModule: () => { throw new Error("El loader no debe ejecutarse con flag OFF"); }
}).then(result => result.result), "CANARY_OFF_LEGACY_PATH_OK");
console.log("CANARY_OFF_LEGACY_PATH_OK");

const coreModule = { createIdentitySnapshot };
const match = await observeCoreIdentityCanary(teacherIdentity, { enabled: true, loadCoreModule: () => coreModule });
assert.equal(match.result, "IDENTITY_CANARY_MATCH");
assert.deepEqual(teacherIdentity, { id: "teacher-carlos-perez", role: "TEACHER" });
console.log("IDENTITY_CANARY_MATCH");
console.log("CANARY_ON_TEACHER_OK");

const student = demoUsers.find(user => user.role === "STUDENT");
const admin = demoUsers.find(user => user.role === "ADMIN");
for (const user of [student, admin]) {
  const outOfScope = await observeCoreIdentityCanary({ id: user.id, role: user.role }, {
    enabled: true,
    loadCoreModule: () => { throw new Error("Fuera de scope no consulta Core"); }
  });
  assert.equal(outOfScope.result, "CORE_IDENTITY_CANARY_OUT_OF_SCOPE");
}
console.log("CANARY_SCOPE_TEACHER_OK");

const mismatch = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => ({ createIdentitySnapshot: () => Object.freeze({ id: teacherIdentity.id, roles: Object.freeze(["ADMIN"]) }) })
});
assert.equal(mismatch.result, "IDENTITY_CANARY_MISMATCH");
assert.deepEqual(teacherIdentity, { id: "teacher-carlos-perez", role: "TEACHER" });

const unavailable = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => Promise.reject(Object.assign(new Error("offline"), { canaryCategory: "CORE_BROWSER_UNAVAILABLE" }))
});
assert.equal(unavailable.result, "CORE_BROWSER_UNAVAILABLE");
assert.equal(unavailable.errorCategory, "CORE_BROWSER_UNAVAILABLE");

const cors = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => Promise.reject(Object.assign(new Error("CORS denied"), { canaryCategory: "CORE_CORS_ERROR" }))
});
assert.equal(cors.result, "CORE_CORS_ERROR");

const timeout = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => new Promise(() => {}),
  timeoutMs: 1
});
assert.equal(timeout.result, "CORE_TIMEOUT");

const adapterError = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  adaptIdentity: () => { throw new Error("adapter failure"); }
});
assert.equal(adapterError.result, "IDENTITY_ADAPTER_ERROR");

const invalidSnapshot = await observeCoreIdentityCanary(teacherIdentity, {
  enabled: true,
  loadCoreModule: () => ({ createIdentitySnapshot: () => ({ id: teacherIdentity.id, roles: [] }) })
});
assert.equal(invalidSnapshot.result, "IDENTITY_SNAPSHOT_INVALID");
console.log("CANARY_FAILURE_NON_BLOCKING");
console.log("NO_PRIVILEGE_ESCALATION");

const storage = new Map();
const memoryStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
const identityOptions = { storage: memoryStorage, legacySession: null };
for (const user of [demoUsers.find(user => user.role === "TEACHER"), admin, demoUsers.find(user => user.role === "TEACHER")]) {
  setCurrentDemoIdentity(user, identityOptions);
  const current = getCurrentDemoIdentity(identityOptions);
  const result = await observeCoreIdentityCanary(current, { enabled: true, loadCoreModule: () => coreModule });
  assert.equal(result.result, user.role === "TEACHER" ? "IDENTITY_CANARY_MATCH" : "CORE_IDENTITY_CANARY_OUT_OF_SCOPE");
}
console.log("CANARY_PROFILE_SWITCH_OK");

clearCurrentDemoIdentity(identityOptions);
assert.equal(getCurrentDemoIdentity(identityOptions), null);
assert.equal((await observeCoreIdentityCanary(null, { enabled: true })).result, "CORE_IDENTITY_CANARY_OUT_OF_SCOPE");
console.log("CANARY_LOGOUT_CLEAN");
console.log("UBO_RUNTIME_UNCHANGED");
console.log("CORE_IDENTITY_CANARY_RUNTIME_OK");
console.log("core-identity-canary-runtime.test.js: OK");
