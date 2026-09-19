import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEMO_IDENTITY_SESSION_KEY,
  clearCurrentDemoIdentity,
  getCurrentDemoIdentity,
  setCurrentDemoIdentity
} from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { clearSession } from "../core/session.js";
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
const legacySofiaSession = {
  loggedIn: true,
  username: "sofia.martinez",
  studentData: { email: student.email }
};
const options = { storage, legacySession: legacySofiaSession };

// Logout sin sesión: es seguro, determinista y no reconstruye la adaptación legacy.
clearCurrentDemoIdentity(options);
assert.equal(getCurrentDemoIdentity(options), null);
assert.equal(storage.getItem(DEMO_IDENTITY_SESSION_KEY), null);
console.log("DEMO_LOGOUT_WITHOUT_SESSION_OK");

for (const user of [student, teacher, admin]) {
  assert.deepEqual(setCurrentDemoIdentity(user, options), { id: user.id, role: user.role });
  assert.deepEqual(getCurrentDemoIdentity(options), { id: user.id, role: user.role });
  assert.deepEqual(JSON.parse(storage.getItem(DEMO_IDENTITY_SESSION_KEY)), { id: user.id, role: user.role });

  clearCurrentDemoIdentity(options);
  assert.equal(storage.getItem(DEMO_IDENTITY_SESSION_KEY), null, `${user.role} debe eliminar sessionStorage.`);
  assert.equal(getCurrentDemoIdentity(options), null, `${user.role} no puede reaparecer tras logout.`);
}
console.log("DEMO_LOGOUT_ALL_ROLES_CLEARS_STORAGE_AND_MEMORY_OK");

// Un perfil nuevo sustituye la identidad completa y reinicia solamente el bloqueo
// temporal de fallback provocado por un logout previo.
for (const user of [teacher, admin, teacher, student]) {
  assert.deepEqual(setCurrentDemoIdentity(user, options), { id: user.id, role: user.role });
  assert.deepEqual(getCurrentDemoIdentity(options), { id: user.id, role: user.role });
}
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(options)).allowed, false);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity(options)).allowed, false);
console.log("DEMO_PROFILE_SWITCH_REPLACES_IDENTITY_OK");

setCurrentDemoIdentity(teacher, options);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity(options)).allowed, true);
clearCurrentDemoIdentity(options);
assert.equal(evaluateDemoRouteGuard("TEACHER", getCurrentDemoIdentity(options)).allowed, false);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(options)).allowed, false);

setCurrentDemoIdentity(admin, options);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(options)).allowed, true);
clearCurrentDemoIdentity(options);
assert.equal(evaluateDemoRouteGuard("ADMIN", getCurrentDemoIdentity(options)).allowed, false);
console.log("DEMO_LOGOUT_DENIES_PROTECTED_ROUTES_OK");

// Una identidad válida almacenada sobrevive a la pérdida de memoria durante la
// sesión; el logout explícito posterior siempre prevalece.
setCurrentDemoIdentity(teacher, options);
clearSession();
assert.deepEqual(getCurrentDemoIdentity(options), { id: teacher.id, role: teacher.role });
clearCurrentDemoIdentity(options);
assert.equal(getCurrentDemoIdentity(options), null);
console.log("DEMO_SESSION_RELOAD_AND_LOGOUT_PRECEDENCE_OK");

// El logout legacy debe invocar la frontera central sin duplicar su lógica.
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.match(appSource, /import\s*\{\s*clearCurrentDemoIdentity\s*\}\s*from\s*"\.\/core\/demo-identity-session\.js"/);
assert.match(appSource, /import\s*\{[^}]*logout as logoutFromApi[^}]*\}\s*from\s*"\.\/services\/api\/auth-api-service\.js"/);
assert.match(appSource, /async function logout\(\)\s*\{\s*await logoutFromApi\(\);\s*clearCurrentDemoIdentity\(\);\s*localStorage\.removeItem\("uboSession"\)/);
console.log("LEGACY_LOGOUT_COORDINATES_DEMO_IDENTITY_OK");

clearCurrentDemoIdentity(options);
console.log("demo-logout-session-coordination.test.js: OK");
