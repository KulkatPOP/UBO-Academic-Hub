import assert from "node:assert/strict";
import test from "node:test";
import { getTeacherDashboard } from "../services/api/teacher-dashboard-api-service.js";

const course = { id: "course-db", name: "Bases de Datos", code: "INF-302", description: "LMS" };
const api = (overrides = {}) => ({
  getCoursesImpl: async () => ({ available: true, courses: [course] }),
  getCourseStudentsImpl: async () => ({ available: true, students: [{ id: "student-1", name: "Sofía Martínez", role: "STUDENT" }] }),
  getCourseMaterialsImpl: async () => ({ available: true, materials: [{ id: "material-1", courseId: "course-db" }] }),
  getEvaluationsImpl: async () => ({ available: true, evaluations: [{ id: "evaluation-1", courseId: "course-db" }, { id: "other", courseId: "other" }] }),
  getMessagesImpl: async () => ({ available: true, messages: [{ id: "message-1", courseId: "course-db" }, { id: "other", courseId: "other" }] }),
  getCourseAttendanceImpl: async () => ({ available: true, body: { records: [{ id: "attendance-1", courseId: "course-db" }] } }),
  getTeacherAnalyticsImpl: async () => ({ available: true, body: { source: "LMS", courses: [course] } }),
  getTeacherCourseAnalyticsImpl: async () => ({ available: true, body: { source: "LMS", courses: [course] } }),
  ...overrides
});

test("compone sólo cursos y datos LMS autorizados sin credenciales", async () => {
  const result = await getTeacherDashboard(api());
  assert.equal(result.available, true);
  assert.equal(result.source, "LMS");
  assert.deepEqual(result.courses[0].evaluations.map(item => item.id), ["evaluation-1"]);
  assert.deepEqual(result.courses[0].messages.map(item => item.id), ["message-1"]);
  assert.equal(result.courses[0].students[0].name, "Sofía Martínez");
  assert.equal(JSON.stringify(result).toLowerCase().includes("password"), false);
});

test("conserva el dashboard demo completo cuando Courses API no está disponible", async () => {
  const result = await getTeacherDashboard(api({ getCoursesImpl: async () => ({ available: false, source: "demo-fallback" }) }));
  assert.equal(result.available, false);
  assert.equal(result.source, "demo-fallback");
});

test("mantiene resultados parciales sin inventar valores", async () => {
  const result = await getTeacherDashboard(api({ getCourseAttendanceImpl: async () => ({ available: false, source: "backend" }) }));
  assert.equal(result.available, true);
  assert.equal(result.partial, true);
  assert.equal(result.courses[0].attendance, null);
  assert.equal(result.courses[0].sections.attendance, "UNAVAILABLE");
});
