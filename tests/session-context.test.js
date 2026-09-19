import assert from "node:assert/strict";
import test from "node:test";
import { ACADEMIC_SESSION_STORAGE_KEY, clearAcademicSession, getAcademicSession, getCurrentSession, getCurrentUserId, getSessionSource, saveAcademicSession } from "../services/api/auth-api-service.js";
import { hydrateCurrentSession } from "../services/api/user-api-service.js";

const storage = () => { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) }; };
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("normaliza una sola sesión backend con userId, id, role y source", () => {
  const target = storage();
  const session = saveAcademicSession({ id: "backend-sofia", name: "Sofía", role: "STUDENT", password: "omit" }, { storage: target });
  assert.deepEqual(session, { id: "backend-sofia", userId: "backend-sofia", name: "Sofía", role: "STUDENT", source: "backend" });
  assert.equal(getCurrentUserId({ storage: target }), "backend-sofia");
  assert.equal(getSessionSource({ storage: target }), "backend");
  assert.equal(getAcademicSession({ storage: target }).userId, "backend-sofia");
  assert.doesNotMatch(target.getItem(ACADEMIC_SESSION_STORAGE_KEY), /password/i);
});

test("sesión demo no puede usarse como contexto de API y una sesión corrupta se controla", () => {
  const target = storage();
  saveAcademicSession({ id: "demo-sofia", name: "Sofía", role: "STUDENT" }, { storage: target, source: "demo" });
  assert.equal(getCurrentSession({ storage: target }).source, "demo");
  assert.equal(getAcademicSession({ storage: target }), null);
  target.setItem(ACADEMIC_SESSION_STORAGE_KEY, "{corrupta");
  assert.equal(getCurrentSession({ storage: target }), null);
});

test("restaura perfil backend, conserva userId y sólo limpia identidad inválida 404", async () => {
  const target = storage();
  saveAcademicSession({ id: "admin-id", name: "Anterior", role: "ADMIN" }, { storage: target });
  const restored = await hydrateCurrentSession({ storage: target, fetchImpl: async (_url, options) => {
    assert.equal(options.headers["x-user-id"], "admin-id");
    return response(200, { user: { id: "admin-id", name: "Administrador UBO", role: "ADMIN" } });
  } });
  assert.equal(restored.success, true);
  assert.equal(getCurrentSession({ storage: target }).userId, "admin-id");
  assert.equal(getCurrentSession({ storage: target }).name, "Administrador UBO");

  const missing = await hydrateCurrentSession({ storage: target, fetchImpl: async () => response(404, { message: "Usuario no encontrado" }) });
  assert.equal(missing.success, false);
  assert.equal(getCurrentSession({ storage: target }), null);
});

test("401 y 403 no activan fallback ni cambian la sesión backend; caída conserva sesión", async () => {
  for (const status of [401, 403]) {
    const target = storage();
    saveAcademicSession({ id: "teacher-id", name: "Carlos", role: "TEACHER" }, { storage: target });
    const result = await hydrateCurrentSession({ storage: target, fetchImpl: async () => response(status, { message: "No autorizado" }) });
    assert.equal(result.source, "backend");
    assert.equal(getCurrentSession({ storage: target }).source, "backend");
  }
  const target = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía", role: "STUDENT" }, { storage: target });
  const offline = await hydrateCurrentSession({ storage: target, fetchImpl: async () => { throw Error("offline"); } });
  assert.equal(offline.source, "demo-fallback");
  assert.equal(getCurrentSession({ storage: target }).userId, "student-id");
  clearAcademicSession({ storage: target });
  assert.equal(getCurrentSession({ storage: target }), null);
});
