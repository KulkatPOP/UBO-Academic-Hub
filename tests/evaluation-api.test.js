import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { createEvaluation, getEvaluations, getSubmission, gradeSubmission, publishEvaluation, submitEvaluation } from "../services/api/evaluation-api-service.js";

function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }
function response(status, body) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }

test("el cliente LMS usa la sesión como contexto y nunca transmite credenciales", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }, { storage: sessionStorage });
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return response(201, { evaluation: { id: "evaluation-id", title: "Prueba" } }); };
  const created = await createEvaluation({ courseId: "course-db-2026-1", title: "Prueba", dueAt: "2027-12-31T23:59:59.000Z", questions: [{}] }, { storage: sessionStorage, fetchImpl });
  assert.equal(created.evaluation.id, "evaluation-id");
  assert.equal(calls[0].options.headers["x-user-id"], "teacher-id");
  assert.doesNotMatch(JSON.stringify(calls), /password|123456/);
});

test("mantiene fallback controlado y soporta consultas y acciones LMS", async () => {
  const fallback = [{ id: "local-evaluation" }];
  const noSession = await getEvaluations({ fallback, storage: storage(), fetchImpl: async () => { throw new Error("not called"); } });
  assert.deepEqual(noSession.evaluations, fallback);
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const fetchImpl = async (url, options) => {
    if (url.endsWith("/publish")) return response(200, { evaluation: { id: "evaluation-id" } });
    if (url.endsWith("/submit")) return response(201, { submission: { id: "submission-id", status: "AUTO_GRADED" } });
    if (url.endsWith("/submission")) return response(200, { submission: { id: "submission-id" } });
    if (url.includes("/api/submissions/")) return response(200, { submission: { id: "submission-id", score: 6 } });
    return response(200, { evaluations: [{ id: "evaluation-id" }] });
  };
  assert.equal((await getEvaluations({ storage: sessionStorage, fetchImpl })).evaluations[0].id, "evaluation-id");
  assert.equal((await publishEvaluation("evaluation-id", { storage: sessionStorage, fetchImpl })).evaluation.id, "evaluation-id");
  assert.equal((await submitEvaluation("evaluation-id", { q1: 0 }, { storage: sessionStorage, fetchImpl })).submission.status, "AUTO_GRADED");
  assert.equal((await getSubmission("evaluation-id", { storage: sessionStorage, fetchImpl })).submission.id, "submission-id");
  assert.equal((await gradeSubmission("submission-id", { score: 6 }, { storage: sessionStorage, fetchImpl })).submission.score, 6);
});
