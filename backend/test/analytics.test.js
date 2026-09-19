import assert from "node:assert/strict";
import test from "node:test";
import { calculateLmsRisk, getAdminOverview, getTeacherAnalytics } from "../src/services/analytics-service.js";

const studentActorQuery = async () => ({ rows: [{ id: "student-id", name: "Sofía", role: "STUDENT" }] });

test("calcula riesgo LMS explicable sin convertir ausencia de datos en riesgo", () => {
  assert.equal(calculateLmsRisk({}).risk, "INSUFFICIENT_DATA");
  const high = calculateLmsRisk({ pendingEvaluations: 2, averageScore: 3.8, attendanceRate: null });
  assert.equal(high.risk, "HIGH");
  assert.equal(high.dataSource, "LMS");
  assert.ok(high.reasons.length);
  assert.equal(high.trend, "INSUFFICIENT_DATA");
  assert.deepEqual(calculateLmsRisk({ pendingEvaluations: 0, averageScore: 5.5, attendanceRate: 90 }).reasons, []);
});

test("las rutas de analítica resuelven el rol desde users_reference y rechazan escalamiento", async () => {
  const adminAttempt = await getAdminOverview("student-id", { query: studentActorQuery });
  assert.deepEqual(adminAttempt, { authorized: false, code: "ADMIN_ROLE_REQUIRED" });
  const teacherAttempt = await getTeacherAnalytics("student-id", null, { query: studentActorQuery });
  assert.deepEqual(teacherAttempt, { authorized: false, code: "TEACHER_ROLE_REQUIRED" });
});

test("la salida docente soporta tópicos débiles y tendencia insuficiente sin inventar métricas", async () => {
  const teacherQuery = async text => {
    if (text.includes("FROM users_reference")) return { rows: [{ id: "teacher-id", name: "Carlos", role: "TEACHER" }] };
    if (text.includes("FROM lms_courses")) return { rows: [{ id: "course-id", external_course_id: "course-db", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" }] };
    return { rows: [] };
  };
  const result = await getTeacherAnalytics("teacher-id", null, { query: teacherQuery });
  assert.equal(result.authorized, true);
  assert.equal(result.source, "LMS");
  assert.deepEqual(result.courses[0].weakTopics, []);
  assert.equal(result.courses[0].trend, "INSUFFICIENT_DATA");
});
