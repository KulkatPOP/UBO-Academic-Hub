import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentUser } from "../services/api/user-api-service.js";
import { saveAcademicSession } from "../services/api/auth-api-service.js";

function response(status, body) {
  return { ok: status >= 200 && status < 300, json: async () => body };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

for (const [id, name, role] of [
  ["student-id", "Sofía Martínez", "STUDENT"],
  ["teacher-id", "Carlos Pérez", "TEACHER"],
  ["admin-id", "Administrador UBO", "ADMIN"]
]) {
  test(`obtiene contexto público ${role} mediante /api/users/me`, async () => {
    const storage = memoryStorage();
    saveAcademicSession({ id, name, role }, { storage });
    let requestedUserId = null;
    const result = await getCurrentUser({
      storage,
      fetchImpl: async (url, options) => {
        assert.equal(url, "http://localhost:3001/api/users/me");
        requestedUserId = options.headers["x-user-id"];
        return response(200, { user: { id, name, role, password_demo: "nunca" } });
      }
    });
    assert.equal(requestedUserId, id);
    assert.deepEqual(result, { success: true, source: "backend", user: { id, name, role } });
    assert.equal(Object.hasOwn(result.user, "password_demo"), false);
  });
}

test("resuelve usuario inexistente sin exponer datos ni lanzar error", async () => {
  const storage = memoryStorage();
  saveAcademicSession({ id: "missing-id", name: "Desconocido", role: "STUDENT" }, { storage });
  const result = await getCurrentUser({ storage, fetchImpl: async () => response(404, { message: "Usuario no encontrado." }) });
  assert.equal(result.success, false);
  assert.equal(result.source, "backend");
});

test("mantiene fallback de perfil cuando la API no responde", async () => {
  const storage = memoryStorage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage });
  const result = await getCurrentUser({ storage, fetchImpl: async () => { throw new TypeError("offline"); } });
  assert.deepEqual(result, { success: false, source: "demo-fallback", message: "El perfil backend no está disponible." });
});
