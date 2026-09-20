import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getStudentCourseDetail } from "../services/api/course-detail-api-service.js";

const course = { id: "lms-db", name: "Bases de Datos", code: "INF-302", description: "LMS demo", teacherReference: "teacher-1" };
const api = (overrides = {}) => ({
  resolveLegacyCourse: async value => value === "db" ? { lmsCourseId: "lms-db", legacyId: "db" } : null,
  getCourseImpl: async () => ({ available: true, source: "backend", course }),
  getCourseMaterialsImpl: async () => ({ available: true, materials: [{ id: "material-1", courseId: "lms-db", title: "Modelo relacional" }] }),
  getEvaluationsImpl: async () => ({ available: true, evaluations: [{ id: "evaluation-1", courseId: "lms-db", title: "Quiz" }, { id: "other", courseId: "other-course" }] }),
  getStudentCourseProgressImpl: async () => ({ available: true, progress: { course: { courseId: "lms-db", overall: null, materials: { status: "INSUFFICIENT_DATA" } } } }),
  getStudentAttendanceImpl: async () => ({ available: true, body: { records: [{ id: "attendance-1", courseId: "lms-db" }] } }),
  getRecommendationsImpl: async () => ({ available: true, recommendations: [{ id: "recommendation-1", courseId: "lms-db" }, { id: "other", courseId: "other-course" }] }),
  getMessagesImpl: async () => ({ available: true, messages: [{ id: "message-1", courseId: "lms-db" }, { id: "other", courseId: "other-course" }] }),
  ...overrides
});

test("compone el detalle LMS, filtra por curso y no inventa overall", async () => {
  const result = await getStudentCourseDetail("db", api());
  assert.equal(result.available, true);
  assert.equal(result.source, "LMS");
  assert.deepEqual(result.evaluations.map(item => item.id), ["evaluation-1"]);
  assert.deepEqual(result.recommendations.map(item => item.id), ["recommendation-1"]);
  assert.deepEqual(result.messages.map(item => item.id), ["message-1"]);
  assert.equal(result.progress.overall, null);
});

test("conserva el fallback cuando la identidad legacy no está confirmada", async () => {
  const result = await getStudentCourseDetail("iot", api({ resolveLegacyCourse: async () => null }));
  assert.equal(result.available, false);
  assert.equal(result.reason, "IDENTITY_UNRESOLVED");
});

test("usa DEMO cuando English, IoT o Cyber reciben el 404 específico de identidad", async () => {
  for (const legacyId of ["english", "iot", "cyber"]) {
    const result = await getStudentCourseDetail(legacyId, api({
      resolveLegacyCourse: async () => ({ available: false, source: "demo-fallback", status: 404, reason: "IDENTITY_NOT_FOUND", identity: null })
    }));
    assert.equal(result.available, false);
    assert.equal(result.source, "demo-fallback");
    assert.equal(result.reason, "IDENTITY_NOT_FOUND");
  }
});

test("no convierte 401, 403 ni 500 de identidad en fallback DEMO", async () => {
  for (const status of [401, 403, 500]) {
    const result = await getStudentCourseDetail("iot", api({
      resolveLegacyCourse: async () => ({ available: false, source: "backend", status, reason: "IDENTITY_API_ERROR", identity: null })
    }));
    assert.equal(result.available, false);
    assert.equal(result.source, "backend");
    assert.equal(result.status, status);
  }
});

test("conserva la ruta existente de API no disponible para fallos de red", async () => {
  const result = await getStudentCourseDetail("iot", api({
    resolveLegacyCourse: async () => ({ available: false, source: "demo-fallback", status: null, reason: "API_UNAVAILABLE", identity: null })
  }));
  assert.equal(result.available, false);
  assert.equal(result.source, "demo-fallback");
  assert.equal(result.reason, "API_UNAVAILABLE");
});

test("Course Detail sólo solicita y agrega inteligencia después de confirmar LMS", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const hydrate = app.slice(app.indexOf("async function hydrateLmsCourseDetail"), app.indexOf("async function submitLmsCourseTutor"));
  assert.match(app, /function appendLmsCourseIntelligence\(container,intelligence\)/);
  const fallbackReturn = hydrate.indexOf("if(!detail.available)");
  const intelligenceRequest = hydrate.indexOf("getStudentCourseIntelligenceFromApi");
  const appendIntelligence = hydrate.indexOf("appendLmsCourseIntelligence");
  assert.ok(fallbackReturn >= 0);
  assert.ok(intelligenceRequest > fallbackReturn);
  assert.ok(appendIntelligence > intelligenceRequest);
});

test("aísla un fallo parcial sin convertirlo en datos demo o cero", async () => {
  const result = await getStudentCourseDetail("db", api({ getMessagesImpl: async () => ({ available: false, source: "backend" }) }));
  assert.equal(result.available, true);
  assert.equal(result.partial, true);
  assert.equal(result.messages, null);
  assert.equal(result.sections.messages, "UNAVAILABLE");
});

test("usa la recomendación inteligente del LMS para el curso resuelto", async () => {
  let requestedCourseId = null;
  const result = await getStudentCourseDetail("db", api({
    getRecommendationsImpl: null,
    getIntelligentRecommendationsImpl: async ({ courseId }) => {
      requestedCourseId = courseId;
      return {
        available: true,
        recommendations: [{ type: "REVIEW_MATERIAL", resource: { title: "Clave primaria", courseId } }]
      };
    }
  }));
  assert.equal(requestedCourseId, "lms-db");
  assert.equal(result.recommendations[0].type, "REVIEW_MATERIAL");
  assert.equal(result.recommendations[0].resource.title, "Clave primaria");
});
