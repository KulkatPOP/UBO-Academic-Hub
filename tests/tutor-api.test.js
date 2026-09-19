import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { askTutor, getTutorHistory } from "../services/api/tutor-api-service.js";

function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }
function response(status, body) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }

test("consulta Tutor API sin enviar contraseña y devuelve fuentes", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return url.endsWith("/history")
      ? response(200, { history: [{ id: "conversation-id", question: "Pregunta", answer: "Respuesta", sources: [] }] })
      : response(200, { answer: "Respuesta", sources: [{ title: "Claves", source: "Modelo" }], topics: ["Clave primaria"], courseId: "course-id", conversationId: "conversation-id" });
  };
  const tutor = await askTutor("¿Qué es una clave primaria?", "course-id", { storage: sessionStorage, fetchImpl });
  const history = await getTutorHistory({ storage: sessionStorage, fetchImpl });
  assert.equal(tutor.available, true);
  assert.equal(tutor.tutor.sources[0].title, "Claves");
  assert.equal(history.history[0].id, "conversation-id");
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id"));
  assert.doesNotMatch(JSON.stringify(calls), /password/);
});

test("preserva fallback si Tutor API no está disponible", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const fallback = { answered: true, response: "Tutor DEMO", sources: ["Local"] };
  const result = await askTutor("Pregunta", "course-id", { storage: sessionStorage, fetchImpl: async () => { throw new TypeError("offline"); }, fallback });
  result.tutor.sources.push("Mutado");
  assert.equal(result.source, "demo-fallback");
  assert.deepEqual(fallback.sources, ["Local"]);
});
