import assert from "node:assert/strict";
import test from "node:test";
import { askTutor } from "../services/api/tutor-api-service.js";

const storage = { getItem: key => key === "uboAcademicSession" ? JSON.stringify({ userId: "student-id", name: "Sofía", role: "STUDENT", source: "backend" }) : null };
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("envía sólo pregunta, curso y x-user-id; recibe contexto LMS", async () => {
  let call;
  const result = await askTutor("¿Qué debo revisar?", "course-id", { storage, fetchImpl: async (url, options) => { call = { url, options }; return response(200, { answer: "Respuesta", source: "LMS", context: { source: "LMS", signals: [], recommendedActions: [] } }); } });
  assert.equal(call.options.headers["x-user-id"], "student-id");
  assert.equal(JSON.parse(call.options.body).courseId, "course-id");
  assert.doesNotMatch(call.options.body, /password|userId|role/i);
  assert.equal(result.context.source, "LMS");
});

test("fallback queda reservado para red y no enmascara 401/403", async () => {
  const fallback = { answer: "Tutor DEMO" };
  const offline = await askTutor("hola", "course", { storage, fallback, fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(offline.tutor.answer, "Tutor DEMO");
  const denied = await askTutor("hola", "course", { storage, fallback, fetchImpl: async () => response(403, { message: "No autorizado" }) });
  assert.equal(denied.tutor, null);
});
