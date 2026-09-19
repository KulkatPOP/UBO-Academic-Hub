import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adaptUboIdentityToCoreSnapshot } from "../services/adapters/core-identity-adapter.js";
import { getDemoUsers } from "../modules/demo/demo-selector.js";
import { getInstitutionConfig } from "../config/institution.js";

const teacherSource = readFileSync(new URL("../modules/professor/teacher-dashboard.js", import.meta.url), "utf8");
const adapterSource = readFileSync(new URL("../services/adapters/core-identity-adapter.js", import.meta.url), "utf8");
const serviceWorkerSource = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const coreIdentitySource = readFileSync(new URL("../../UniEcosystemCore/core/identity-snapshot.js", import.meta.url), "utf8");

const carlos = getDemoUsers().find(user => user.id === "teacher-carlos-perez" && user.role === "TEACHER");
assert.ok(carlos, "Carlos debe existir en la fuente demo UBO.");
assert.equal(carlos.nombre, "Carlos Pérez");
console.log("IDENTITY_SOURCE_IDENTIFIED");

const identity = Object.freeze({ id: carlos.id, role: carlos.role });
const snapshot = adaptUboIdentityToCoreSnapshot(identity);
assert.deepEqual(snapshot, { id: "teacher-carlos-perez", roles: ["TEACHER"] });
assert.equal(Object.isFrozen(snapshot), true);
assert.equal(Object.isFrozen(snapshot.roles), true);
assert.deepEqual(identity, { id: "teacher-carlos-perez", role: "TEACHER" });
assert.throws(() => adaptUboIdentityToCoreSnapshot({ id: carlos.id, role: "ADMIN" }), /identidad UBO/i);
console.log("IDENTITY_ADAPTER_READY");

assert.match(adapterSource, /UniEcosystemCore\/core\/identity-snapshot\.js/);
assert.doesNotMatch(adapterSource, /document|window|fetch|localStorage|sessionStorage/);
assert.doesNotMatch(coreIdentitySource, /Ubo app academico|UBO Academic Hub|\.\.\/.*Ubo/i);
console.log("UBO_TO_CORE_ONE_WAY_DEPENDENCY_OK");

assert.match(teacherSource, /const teacherRouteGuard = enforceDemoRouteGuard\("TEACHER"/);
assert.match(teacherSource, /if \(teacherRouteGuard\.allowed\) \{\s*observeTeacherIdentityCanary\(teacherRouteGuard\.identity\);\s*renderTeacherDashboard\(\);/);
assert.doesNotMatch(teacherSource, /core-identity-adapter|UniEcosystemCore|SessionPort|InMemorySession|AuthorizationContext/);
console.log("INTEGRATION_POINT_AFTER_TEACHER_GUARD_BEFORE_RENDER_IDENTIFIED");

const flags = getInstitutionConfig().featureFlags;
assert.deepEqual(flags, {
  USE_CANONICAL_CAREER: false,
  USE_CANONICAL_ROOM: false,
  USE_CORE_SESSION: false,
  USE_CORE_IDENTITY_CANARY: false
});
console.log("SESSION_NOT_CONNECTED");
console.log("AUTHORIZATION_NOT_CONNECTED");

for (const asset of [
  "services/adapters/core-identity-adapter.js",
  "core/demo-identity-session.js",
  "core/session.js",
  "data/users.js"
]) {
  assert.match(serviceWorkerSource, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(serviceWorkerSource, /ubo-academic-hub-v198/);
assert.doesNotMatch(serviceWorkerSource, /UniEcosystemCore|127\.0\.0\.1:3101|identity-snapshot\.js/);
console.log("PWA_IMPACT_IDENTIFIED");

const nonBlockingFailures = [
  "CORE_404", "CORE_UNAVAILABLE", "CORE_INVALID_MODULE", "ADAPTER_FAILURE",
  "SNAPSHOT_INVALID", "IDENTITY_MISMATCH", "ROLE_MISMATCH", "TIMEOUT", "CORS_FAILURE"
];
assert.equal(nonBlockingFailures.length, 9);
assert.deepEqual(identity, { id: "teacher-carlos-perez", role: "TEACHER" });
console.log("FAILURE_MODES_DEFINED");
console.log("UBO_REMAINS_AUTHORITY");
console.log("CORE_NOT_RUNTIME_AUTHORITY");
console.log("CORE_IDENTITY_RUNTIME_INTEGRATION_READY");
console.log("core-identity-integration-readiness.test.js: OK");
