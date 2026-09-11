import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { InMemorySession } from "../../UniEcosystemCore/core/session/in-memory-session.js";
import { isSessionPort } from "../../UniEcosystemCore/core/ports/session-port.js";
import { getInstitutionConfig } from "../config/institution.js";
import {
  clearCurrentDemoIdentity,
  getCurrentDemoIdentity,
  setCurrentDemoIdentity
} from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { adaptUboIdentityToCoreSnapshot } from "../services/adapters/core-identity-adapter.js";
import { demoUsers } from "../data/users.js";

class MemoryStorage {
  #values = new Map();

  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const design = readFileSync(new URL("../docs/CORE_SESSION_MIGRATION_DESIGN.md", import.meta.url), "utf8");
const flags = getInstitutionConfig().featureFlags;

assert.deepEqual(flags, {
  USE_CANONICAL_CAREER: false,
  USE_CANONICAL_ROOM: false,
  USE_CORE_SESSION: false,
  USE_CORE_IDENTITY_CANARY: false
});
console.log("CORE_SESSION_FLAGS_OFF_FINAL_OK");

// La fuente legacy persiste la sesión completa del estudiante y sigue siendo la
// autoridad. El contrato futuro no debe cambiarla ni trasladar datos académicos.
assert.match(appSource, /function session\(\)\{const value=json\("uboSession",null\);return value\?\.loggedIn&&value\.username&&value\.studentData\?value:null\}/);
assert.match(appSource, /localStorage\.setItem\("uboSession",JSON\.stringify\(\{loggedIn:true,username,studentData:data\}\)\)/);
assert.match(appSource, /function logout\(\)\{clearCurrentDemoIdentity\(\);localStorage\.removeItem\("uboSession"\)/);
console.log("UBO_SESSION_LEGACY_AUTHORITY_OK");

// El contrato Core es efímero y recibe únicamente un IdentitySnapshot.
const port = new InMemorySession();
assert.equal(isSessionPort(port), true);
assert.equal(port.getCurrentIdentity(), null);
const snapshot = adaptUboIdentityToCoreSnapshot({ id: teacher.id, role: teacher.role });
assert.deepEqual(port.setCurrentIdentity(snapshot), { id: teacher.id, roles: ["TEACHER"] });
port.clear();
assert.equal(port.getCurrentIdentity(), null);
console.log("CORE_SESSION_CONTRACT_ANALYZED");

const storage = new MemoryStorage();
const options = { storage, legacySession: null };

// Student permanece legacy: la adaptación conceptual solo deriva id/rol y no
// toca la carga academicamente rica de uboSession.
const legacyStudentSession = {
  loggedIn: true,
  username: "sofia.martinez",
  studentData: { email: student.email, career: "Ingeniería Informática", semester: "5° semestre" }
};
const legacyBefore = JSON.stringify(legacyStudentSession);
const studentIdentity = getCurrentDemoIdentity({ storage, legacySession: legacyStudentSession });
assert.deepEqual(studentIdentity, { id: student.id, role: "STUDENT" });
assert.equal(JSON.stringify(legacyStudentSession), legacyBefore);
assert.equal(evaluateDemoRouteGuard("STUDENT", studentIdentity).allowed, true);
console.log("STUDENT_LEGACY_RETAINED");

// Teacher y Admin se analizan como identidades mínimas; la bandera apagada evita
// que cualquiera de ellas active SessionPort en el runtime.
for (const user of [teacher, admin]) {
  assert.deepEqual(setCurrentDemoIdentity(user, options), { id: user.id, role: user.role });
  assert.deepEqual(getCurrentDemoIdentity(options), { id: user.id, role: user.role });
  assert.equal(evaluateDemoRouteGuard(user.role, getCurrentDemoIdentity(options)).allowed, true);
}
assert.equal(flags.USE_CORE_SESSION, false);
console.log("TEACHER_SESSION_CANARY_NOT_ACTIVATED");
console.log("ADMIN_SESSION_CANARY_NOT_ACTIVATED");

// Cambio de perfil y logout sustituyen o limpian toda la identidad demo. El
// diseño futuro exige la misma operación de clear sobre un espejo Core, nunca
// roles combinados ni recuperación silenciosa.
const lifecyclePort = new InMemorySession();
for (const user of [teacher, admin, teacher]) {
  setCurrentDemoIdentity(user, options);
  lifecyclePort.clear();
  lifecyclePort.setCurrentIdentity(adaptUboIdentityToCoreSnapshot(getCurrentDemoIdentity(options)));
  assert.deepEqual(lifecyclePort.getCurrentIdentity(), { id: user.id, roles: [user.role] });
}
clearCurrentDemoIdentity(options);
lifecyclePort.clear();
assert.equal(getCurrentDemoIdentity(options), null);
assert.equal(lifecyclePort.getCurrentIdentity(), null);
assert.equal(evaluateDemoRouteGuard("TEACHER", null).allowed, false);
assert.equal(evaluateDemoRouteGuard("ADMIN", null).allowed, false);
console.log("PROFILE_SWITCH_AND_LOGOUT_DESIGN_OK");

// No se integra Authorization, Career ni Room: una sesión válida no aporta
// permisos, navegación ni datos académicos adicionales.
assert.doesNotMatch(appSource, /SessionPort|InMemorySession|AuthorizationContext|PermissionPolicy/);
assert.equal(flags.USE_CANONICAL_CAREER, false);
assert.equal(flags.USE_CANONICAL_ROOM, false);
console.log("SESSION_AUTHORIZATION_SEPARATION_OK");
console.log("CAREER_ROOM_OUTSIDE_SESSION_SCOPE_OK");

for (const heading of [
  "## Estado actual", "## uboSession", "## Demo Identity", "## SessionPort", "## IdentitySnapshot",
  "## Comparación", "## Contrato mínimo", "## Student", "## Teacher", "## Admin", "## Login",
  "## Logout", "## Cambio de perfil", "## Corrupción", "## Failure modes", "## Seguridad",
  "## Coexistencia", "## Rollback", "## Persistencia", "## PWA", "## Browser", "## Arquitectura",
  "## Authorization", "## Propuesta de migración", "## Riesgos", "## Beneficios",
  "## Criterios para detener", "## Recomendación final"
]) assert.match(design, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

for (const requiredTerm of [
  "FALLBACK FUNCIONAL", "FALLBACK DE SEGURIDAD", "MODE 0", "MODE 1", "MODE 2", "MODE 3",
  "NO MIGRAR SESSION TODAVÍA", "UBO → Adapter → Core", "Session != Authorization"
]) assert.match(design, new RegExp(requiredTerm));
console.log("SESSION_ROLLBACK_DESIGN_OK");
console.log("CORE_SESSION_MIGRATION_DESIGN_READY");
console.log("core-session-migration-design.test.js: OK");
