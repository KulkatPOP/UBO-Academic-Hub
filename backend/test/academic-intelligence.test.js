import assert from "node:assert/strict";
import test from "node:test";
import { getStudentCourseIntelligence, getStudentIntelligence } from "../src/services/academic-intelligence-service.js";

const dbCourse = {
  courseId: "course-db-id", courseName: "Bases de Datos",
  materials: { available: 3, viewed: 1, status: "AVAILABLE" },
  evaluations: { published: 3, submitted: 1, pending: 2, submissionRate: 33.33, status: "AVAILABLE" },
  attendance: { sessions: 4, attended: 2, attendanceRate: 50, status: "AVAILABLE" },
  activity: { events: 1, status: "AVAILABLE" }
};
const algebraCourse = {
  courseId: "course-algebra-id", courseName: "Álgebra",
  materials: { available: 2, viewed: null, status: "INSUFFICIENT_DATA" },
  evaluations: { published: 0, submitted: 0, pending: null, submissionRate: null, status: "INSUFFICIENT_DATA" },
  attendance: { sessions: 0, attended: null, attendanceRate: null, status: "INSUFFICIENT_DATA" },
  activity: { events: null, status: "INSUFFICIENT_DATA" }
};

function sources({ course = dbCourse, denied = null } = {}) {
  return {
    progress: async studentId => studentId === "student-id" ? { authorized: true, source: "LMS", studentId, courses: [dbCourse, algebraCourse] } : { authorized: false, code: "STUDENT_ROLE_REQUIRED" },
    courseProgress: async (studentId, courseId) => denied ? { authorized: false, code: denied } : studentId === "student-id" && courseId === course.courseId ? { authorized: true, source: "LMS", studentId, course } : { authorized: false, code: courseId === "missing" ? "COURSE_NOT_FOUND" : "COURSE_ACCESS_DENIED" },
    analytics: async () => ({ authorized: true, source: "LMS", evaluations: { averageScore: null } }),
    courseAnalytics: async () => ({ authorized: true, source: "LMS", evaluations: { averageScore: null } }),
    recommendations: async () => ({ authorized: true, recommendations: [{ courseId: "course-db-id", courseName: "Bases de Datos", priority: "LOW", resourceReference: "material-1", resourceTitle: "Modelo relacional" }] })
  };
}

test("deriva señales explicables y conserva datos insuficientes sin inventar evidencia", async () => {
  const result = await getStudentIntelligence("student-id", { sources: sources() });
  assert.equal(result.authorized, true);
  assert.equal(result.source, "LMS");
  assert.equal(result.risk.level, "HIGH");
  assert.equal(result.trend.status, "INSUFFICIENT_DATA");
  assert.ok(result.signals.some(item => item.code === "PENDING_EVALUATION"));
  assert.ok(result.signals.some(item => item.code === "LOW_SUBMISSION_RATE"));
  assert.ok(result.signals.some(item => item.code === "LOW_ATTENDANCE_LMS"));
  assert.ok(result.signals.some(item => item.code === "INSUFFICIENT_DATA" && item.courseId === "course-algebra-id"));
  assert.ok(result.strengths.some(item => item.code === "MATERIAL_ENGAGEMENT"));
  assert.ok(result.studyNeeds.some(item => item.code === "COMPLETE_PENDING_EVALUATION"));
  assert.ok(result.recommendedActions.some(item => item.resourceReference === "material-1"));
  assert.doesNotMatch(JSON.stringify(result), /password|token|message body|conversation/i);
});

test("aísla curso, identidad y rol: no acepta datos de query ni cursos ajenos", async () => {
  const own = await getStudentCourseIntelligence("student-id", "course-db-id", { sources: sources() });
  assert.equal(own.authorized, true);
  assert.deepEqual(own.courses.map(course => course.courseId), ["course-db-id"]);
  assert.deepEqual(await getStudentCourseIntelligence("student-id", "course-other-id", { sources: sources() }), { authorized: false, code: "COURSE_ACCESS_DENIED" });
  assert.deepEqual(await getStudentCourseIntelligence("student-id", "missing", { sources: sources() }), { authorized: false, code: "COURSE_NOT_FOUND" });
  assert.deepEqual(await getStudentIntelligence("teacher-id", { sources: sources() }), { authorized: false, code: "STUDENT_ROLE_REQUIRED" });
});

test("sin evidencia suficiente no se convierte en riesgo bajo o alto", async () => {
  const empty = { ...algebraCourse, courseId: "course-empty", courseName: "Curso sin evidencia" };
  const result = await getStudentCourseIntelligence("student-id", "course-empty", { sources: sources({ course: empty }) });
  assert.equal(result.risk.level, "INSUFFICIENT_DATA");
  assert.ok(result.signals.every(item => item.code === "INSUFFICIENT_DATA"));
  assert.equal(result.trend.status, "INSUFFICIENT_DATA");
});
