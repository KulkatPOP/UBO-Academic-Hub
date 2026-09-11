import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getAdminDashboardSummary } from "../services/admin-actions/admin-dashboard-summary-service.js";

const teacherId = "teacher-carlos-perez";
const courseId = "course-db-2026-1";
const studentId = "student-sofia-martinez";
const course = { id: courseId, nombre: "Bases de Datos", professorId: teacherId, studentIds: [studentId] };
const sources = {
  users: () => [
    { id: studentId, role: "STUDENT" }, { id: teacherId, role: "TEACHER" }, { id: "admin-ubo", role: "ADMIN" }
  ],
  courses: () => [course, { id: "course-other", nombre: "Ajeno", professorId: "teacher-other", studentIds: ["student-other"] }],
  students: () => [{ id: studentId }],
  materials: ({ courseId: id }) => ({ materials: [{ id: "material-1", courseId: id, teacherId, title: "<script>alert(1)</script>", createdAt: "2026-01-01T10:00:00.000Z" }] }),
  grades: ({ courseId: id }) => ({ grades: [{ id: "grade-1", courseId: id, teacherId, studentId, assessmentName: "Prueba", value: 5.5, createdAt: "2026-01-02T10:00:00.000Z" }] }),
  attendance: ({ courseId: id }) => ({ records: [{ id: "attendance-1", courseId: id, teacherId, studentId, status: "PRESENT", createdAt: "2026-01-03T10:00:00.000Z" }] }),
  announcements: ({ courseId: id }) => ({ announcements: [{ id: "announcement-1", courseId: id, teacherId, title: "Aviso", createdAt: "2026-01-04T10:00:00.000Z" }] }),
  alerts: ({ studentId: id }) => ({ alerts: id === studentId ? [{ id: "alert-1", courseId, title: "Revisar" }] : [] })
};

const result = getAdminDashboardSummary({ sources });
assert.equal(result.available, true);
assert.equal(result.metrics.usersCount, 3);
assert.equal(result.metrics.studentsCount, 1);
assert.equal(result.metrics.teachersCount, 1);
assert.equal(result.metrics.coursesCount, 2);
assert.equal(result.metrics.materialsCount, 1);
assert.equal(result.metrics.gradesCount, 1);
assert.equal(result.metrics.attendanceRecordsCount, 1);
assert.equal(result.metrics.announcementsCount, 1);
assert.equal(result.metrics.alertsCount, 1);
assert.equal(result.status.coursesWithActivity, 1);
assert.equal(result.activity.length, 4);
assert.ok(result.activity.every(item => item.courseId === courseId));
assert.deepEqual(getAdminDashboardSummary({ sources }), result);

const partial = getAdminDashboardSummary({ sources: { ...sources, grades: () => { throw new Error("corrupt"); } } });
assert.equal(partial.available, true);
assert.equal(partial.metrics.gradesCount, 0);
assert.equal(partial.metrics.materialsCount, 1);
assert.ok(partial.warnings.some(item => item.source === "notas"));
const empty = getAdminDashboardSummary({ sources: { ...sources, users: () => [], courses: () => [], students: () => [] } });
assert.equal(empty.metrics.usersCount, 0);
assert.equal(empty.metrics.coursesCount, 0);
assert.equal(empty.activity.length, 0);
result.activity[0].title = "alterado";
assert.notEqual(getAdminDashboardSummary({ sources }).activity[0].title, "alterado");
assert.equal(typeof getAdminDashboardSummary.createTeacherMaterial, "undefined");
assert.equal(typeof getAdminDashboardSummary.saveTeacherAttendance, "undefined");

const source = readFileSync(new URL("../modules/admin/admin-dashboard.js", import.meta.url), "utf8");
const renderer = source.slice(source.indexOf("function createSummaryElement"), source.indexOf("function renderAdminDashboard"));
assert.match(renderer, /\.textContent\s*=/);
assert.doesNotMatch(renderer, /\.innerHTML\s*=/);
console.log("ADMIN_DASHBOARD_SUMMARY_OK");
console.log("ADMIN_DASHBOARD_READ_ONLY_OK");
console.log("ADMIN_DASHBOARD_METRICS_OK");
console.log("ADMIN_DASHBOARD_ISOLATION_OK");
console.log("ADMIN_DASHBOARD_XSS_SAFE");
console.log("ADMIN_DASHBOARD_DEGRADATION_OK");
console.log("admin-dashboard-summary.test.js: OK");
