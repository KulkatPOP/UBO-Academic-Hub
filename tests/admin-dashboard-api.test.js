import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { getAdminOverview } from "../services/api/analytics-api-service.js";

const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
const response = (status, body) => ({ ok: status >= 200 && status < 300, json: async () => body });

test("consulta overview LMS con x-user-id y sólo recibe datos agregados", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "admin-id", name: "Administrador UBO", role: "ADMIN" }, { storage: sessionStorage });
  let call;
  const result = await getAdminOverview({ storage: sessionStorage, fetchImpl: async (url, options) => {
    call = { url, options };
    return response(200, { source: "LMS", overview: { users: { total: 3 }, messages: { total: 2 }, activity: { eventTypes: [] } } });
  } });
  assert.equal(result.available, true);
  assert.equal(result.body.source, "LMS");
  assert.match(call.url, /\/api\/analytics\/admin\/overview$/);
  assert.equal(call.options.headers["x-user-id"], "admin-id");
  assert.doesNotMatch(JSON.stringify(call), /password|token|teacherId|userId/i);
  assert.doesNotMatch(JSON.stringify(result.body), /subject|body|answer/i);
});

test("mantiene fallback controlado sin sesión, red o respuesta HTTP", async () => {
  const absent = await getAdminOverview({ storage: storage(), fetchImpl: async () => response(200, {}) });
  assert.deepEqual(absent, { available: false, source: "demo-fallback" });
  const sessionStorage = storage();
  saveAcademicSession({ id: "admin-id", name: "Administrador UBO", role: "ADMIN" }, { storage: sessionStorage });
  const offline = await getAdminOverview({ storage: sessionStorage, fetchImpl: async () => { throw Error("offline"); } });
  const denied = await getAdminOverview({ storage: sessionStorage, fetchImpl: async () => response(403, { error: "ADMIN_ROLE_REQUIRED" }) });
  assert.equal(offline.source, "demo-fallback");
  assert.equal(denied.available, false);
  assert.equal(denied.source, "backend");
});
