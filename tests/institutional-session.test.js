import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoUsers } from "../data/users.js";
import {
  INSTITUTIONAL_SESSION_STORAGE_KEY,
  clearInstitutionalSession,
  createInstitutionalSession,
  getInstitutionalSession,
  setInstitutionalSession
} from "../services/institutional-session-service.js";

class MemoryStorage {
  #values = new Map();

  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

const byRole = role => demoUsers.find(user => user.role === role);
const storage = new MemoryStorage();

for (const role of ["STUDENT", "TEACHER", "ADMIN"]) {
  const user = byRole(role);
  const saved = setInstitutionalSession(user, { storage });

  assert.deepEqual(saved, {
    username: user.username,
    nombre: user.displayName || user.nombre,
    name: user.displayName || user.nombre,
    role: user.role,
    profile: user.profile,
    email: user.displayEmail || user.email
  });
  assert.equal(Object.hasOwn(saved, "password"), false, "La sesión nunca debe guardar contraseñas.");

  saved.nombre = "Mutación local";
  assert.equal(getInstitutionalSession({ storage }).nombre, user.displayName || user.nombre, "La lectura debe devolver una copia segura.");
  console.log(`${role}_SESSION_PERSISTENCE_OK`);
}

storage.setItem(INSTITUTIONAL_SESSION_STORAGE_KEY, "{invalido");
assert.equal(getInstitutionalSession({ storage }), null, "Una sesión corrupta debe resolverse de forma controlada.");

setInstitutionalSession(byRole("STUDENT"), { storage });
clearInstitutionalSession({ storage });
assert.equal(getInstitutionalSession({ storage }), null, "El logout debe limpiar la sesión institucional.");
assert.equal(createInstitutionalSession({ username: "x", nombre: "X", role: "UNKNOWN", profile: "x" }), null);

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const teacherSource = readFileSync(new URL("../modules/professor/teacher-dashboard.js", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("../modules/admin/admin-dashboard.js", import.meta.url), "utf8");
const studentHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const teacherHtml = readFileSync(new URL("../modules/professor/teacher-dashboard.html", import.meta.url), "utf8");
const adminHtml = readFileSync(new URL("../modules/admin/admin-dashboard.html", import.meta.url), "utf8");

assert.match(appSource, /setInstitutionalSession\(user\)/);
assert.match(appSource, /clearInstitutionalSession\(\)/);
assert.match(appSource, /profileUsername\.textContent/);
assert.match(teacherSource, /clearInstitutionalSession\(\)/);
assert.match(teacherSource, /renderTeacherAccountProfile/);
assert.match(adminSource, /clearInstitutionalSession\(\)/);
assert.match(adminSource, /renderAccountProfile/);
assert.match(studentHtml, /id="profile-session-title">Mi perfil/);
assert.match(studentHtml, /id="logout-btn" class="logout" type="button">Cerrar sesión/);
assert.match(teacherHtml, /id="teacher-account-title">Mi perfil/);
assert.match(adminHtml, /id="admin-account-title">Mi perfil/);

console.log("INSTITUTIONAL_SESSION_PROFILE_LOGOUT_OK");
