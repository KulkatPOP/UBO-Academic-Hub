import assert from "node:assert/strict";
import test from "node:test";
import { getIntelligentRecommendations } from "../src/services/intelligent-recommendation-service.js";

const course = { courseId: "course-db", courseName: "Bases de Datos" };
const pending = { code: "PENDING_EVALUATION", severity: "WARNING", reason: "Existe una evaluación publicada sin entrega registrada.", evidence: { published: 2, submitted: 0, pending: 2 }, courseId: "course-db", courseName: "Bases de Datos", dataSource: "LMS" };
const intelligence = { authorized: true, source: "LMS", risk: { level: "HIGH" }, courses: [course], signals: [pending] };
const source = ({ materials = [], evaluations = [] } = {}) => ({
  intelligence: async () => intelligence,
  courseIntelligence: async () => intelligence,
  materials: async () => ({ authorized: true, materials }),
  evaluations: async () => ({ authorized: true, evaluations }),
  persisted: async () => ({ authorized: true, recommendations: [] })
});

test("recomienda una evaluación publicada real con razón, evidencia y prioridad explicable", async () => {
  const result = await getIntelligentRecommendations("student", { courseId: "course-db", sources: source({ evaluations: [{ id: "evaluation-real", courseId: "course-db", title: "Prueba publicada", status: "PUBLISHED" }] }) });
  assert.equal(result.source, "LMS");
  assert.equal(result.recommendations[0].type, "COMPLETE_EVALUATION");
  assert.equal(result.recommendations[0].priority, "HIGH");
  assert.equal(result.recommendations[0].resource.reference, "evaluation-real");
  assert.equal(result.recommendations[0].evidence.pending, 2);
});

test("usa material real y curso autorizado, sin inventar recursos", async () => {
  const attendance = { ...pending, code: "LOW_ATTENDANCE_LMS", severity: "HIGH", reason: "La asistencia LMS está bajo el umbral.", evidence: { attendanceRate: 50 } };
  const input = { ...intelligence, signals: [attendance] };
  const readers = source({ materials: [{ id: "material-real", title: "Unidad 1" }] });
  readers.courseIntelligence = async () => input;
  const result = await getIntelligentRecommendations("student", { courseId: "course-db", sources: readers });
  assert.deepEqual(result.recommendations[0].resource, { type: "MATERIAL", reference: "material-real", title: "Unidad 1", courseId: "course-db" });
});

test("sin recurso o sin evidencia devuelve estado conservador y no persiste", async () => {
  const none = await getIntelligentRecommendations("student", { courseId: "course-db", sources: source() });
  assert.equal(none.recommendations.length, 0);
  assert.equal(none.recommendationStatus, "INSUFFICIENT_DATA");
  const denied = await getIntelligentRecommendations("student", { courseId: "other", sources: { ...source(), courseIntelligence: async () => ({ authorized: false, code: "COURSE_ACCESS_DENIED" }) } });
  assert.equal(denied.authorized, false);
  assert.equal(denied.code, "COURSE_ACCESS_DENIED");
});
