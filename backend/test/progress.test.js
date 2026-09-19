import assert from "node:assert/strict";
import test from "node:test";
import { getStudentCourseProgress, getStudentProgress } from "../src/services/progress-service.js";

const student = { id: "student-id", name: "Sofía Martínez", role: "STUDENT" };
const course = { id: "course-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "" };
async function query(sql, params = []) {
  if (sql.includes("SELECT id, name, role") && sql.includes("FROM users_reference")) return { rows: params[0] === "student-id" ? [{ ...student }] : params[0] === "teacher-id" ? [{ id: "teacher-id", name: "Carlos", role: "TEACHER" }] : [] };
  if (sql.includes("FROM lms_courses") && sql.includes("WHERE id::text")) return { rows: params[0] === "course-id" ? [{ ...course }] : [] };
  if (sql.includes("FROM lms_courses c")) return { rows: [{ ...course }] };
  if (sql.includes("FROM learning_materials")) return { rows: [{ count: 2 }] };
  if (sql.includes("event_count")) return { rows: [{ event_count: 0, viewed_count: 0 }] };
  if (sql.includes("FROM lms_evaluations") && sql.includes("COUNT")) return { rows: [{ count: 1 }] };
  if (sql.includes("FROM lms_submissions")) return { rows: [{ count: 1 }] };
  if (sql.includes("FROM lms_attendance_sessions")) return { rows: [{ count: 0 }] };
  if (sql.includes("FROM lms_attendance_records")) return { rows: [{ count: 0 }] };
  if (sql.includes("FROM analytics_events")) return { rows: [{ count: 0 }] };
  throw new Error(`Consulta no cubierta: ${sql}`);
}

test("deriva progreso LMS sin inventar visualización, asistencia ni overall", async () => {
  const result = await getStudentProgress("student-id", { query });
  assert.equal(result.authorized, true); assert.equal(result.source, "LMS"); assert.equal(result.overall, null);
  const progress = result.courses[0]; assert.equal(progress.materials.available, 2); assert.equal(progress.materials.viewed, null); assert.equal(progress.materials.status, "INSUFFICIENT_DATA");
  assert.equal(progress.evaluations.submitted, 1); assert.equal(progress.evaluations.pending, 0); assert.equal(progress.evaluations.submissionRate, 100);
  assert.equal(progress.attendance.attendanceRate, null); assert.equal(progress.activity.events, null);
});
test("protege curso no matriculado, curso ausente y rol no estudiante", async () => {
  const allowed = await getStudentCourseProgress("student-id", "course-id", { query }); assert.equal(allowed.authorized, true);
  const absent = await getStudentCourseProgress("student-id", "missing", { query }); assert.equal(absent.code, "COURSE_NOT_FOUND");
  const role = await getStudentProgress("teacher-id", { query }); assert.equal(role.authorized, false); assert.equal(role.code, "STUDENT_ROLE_REQUIRED");
});
