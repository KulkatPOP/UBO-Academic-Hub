import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { generateRecommendations, getRecommendations } from "../services/api/recommendation-api-service.js";

function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }
function response(status, body) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }
const recommendation = { id: "recommendation-id", title: "Revisar material", description: "Descripción", resourceReference: "material-id" };

test("consume recomendaciones API sin enviar contraseña ni identidad en query/body", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return url.endsWith("/generate")
      ? response(200, { generated: true, dataSufficient: true, recommendations: [recommendation], warnings: [] })
      : response(200, { recommendations: [recommendation] });
  };
  const listed = await getRecommendations({ storage: sessionStorage, fetchImpl });
  const generated = await generateRecommendations({ storage: sessionStorage, fetchImpl });
  assert.equal(listed.recommendations[0].id, "recommendation-id");
  assert.equal(generated.generated, true);
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id"));
  assert.doesNotMatch(JSON.stringify(calls), /password|studentId|role/);
});

test("mantiene fallback, respuesta vacía y sesión inexistente de forma controlada", async () => {
  const fallback = [{ title: "Demo local" }];
  const noSession = await getRecommendations({ fallback, storage: storage(), fetchImpl: async () => { throw new Error("no debe llamar"); } });
  assert.deepEqual(noSession.recommendations, fallback);
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const empty = await getRecommendations({ storage: sessionStorage, fetchImpl: async () => response(200, { recommendations: [] }) });
  assert.deepEqual(empty.recommendations, []);
  const offline = await generateRecommendations({ fallback, storage: sessionStorage, fetchImpl: async () => { throw new TypeError("offline"); } });
  offline.recommendations[0].title = "Mutado";
  assert.equal(fallback[0].title, "Demo local");
});
