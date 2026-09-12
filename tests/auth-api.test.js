import assert from "node:assert/strict";
import test from "node:test";
import { ACADEMIC_SESSION_STORAGE_KEY, login, saveAcademicSession } from "../services/api/auth-api-service.js";

function response(status, body) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }
function memoryStorage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }

for (const [username, password, role] of [["msofia", "123456", "STUDENT"], ["pcarlos", "123456", "TEACHER"], ["admin", "admin123", "ADMIN"]]) {
  test(`autentica ${role} mediante API`, async () => {
    const result = await login(username, password, { fetchImpl: async () => response(200, { success: true, user: { id: `${role}-id`, name: role, role } }) });
    assert.deepEqual(result, { success: true, source: "backend", user: { id: `${role}-id`, name: role, role } });
  });
}

test("rechaza contraseña incorrecta y usuario inexistente", async () => {
  const invalidPassword = await login("msofia", "incorrecta", { fetchImpl: async () => response(401, { success: false, message: "Credenciales inválidas" }) });
  const missingUser = await login("nadie", "123456", { fetchImpl: async () => response(401, { success: false, message: "Credenciales inválidas" }) });
  assert.equal(invalidPassword.success, false);
  assert.equal(missingUser.success, false);
});

test("guarda una sesión backend sin contraseña", () => {
  const storage = memoryStorage();
  const session = saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT", password: "no-debe-estar" }, { storage });
  assert.deepEqual(session, { id: "student-id", name: "Sofía Martínez", role: "STUDENT", source: "backend" });
  assert.doesNotMatch(storage.getItem(ACADEMIC_SESSION_STORAGE_KEY), /password/);
});
