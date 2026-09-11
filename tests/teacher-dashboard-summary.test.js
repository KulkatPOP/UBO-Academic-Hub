import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTeacherDashboardSummary } from "../services/teacher-actions/teacher-dashboard-summary-service.js";

const teacherId = "teacher-carlos-perez";
const db = "course-db-2026-1";
const iot = "course-iot-2026-1";
const sources = {
  professor: id => id === teacherId ? { id, nombre: "Carlos Pérez", role: "TEACHER", department: "Ingeniería" } : null,
  courses: id => id === teacherId ? [
    { id: db, nombre: "Bases de Datos", codigo: "INF-302", professorId: teacherId, studentIds: ["student-sofia-martinez", "student-antonio-gomez"] },
    { id: iot, nombre: "Programación IoT", codigo: "INF-415", professorId: teacherId, studentIds: ["student-sofia-martinez"] },
    { id: "course-other", nombre: "Ajeno", professorId: "teacher-other", studentIds: ["student-external"] }
  ] : [],
  students: courseId => courseId === db
    ? [{ id: "student-sofia-martinez" }, { id: "student-antonio-gomez" }, { id: "student-external" }]
    : courseId === iot ? [{ id: "student-sofia-martinez" }] : [],
  materials: ({ courseId }) => ({ allowed: true, materials: [
    { id: "material-db", courseId, teacherId, title: "<script>alert(1)</script>", createdAt: "2026-09-12T10:00:00.000Z" },
    { id: "material-other", courseId, teacherId: "teacher-other", title: "Ajeno", createdAt: "2026-09-15T10:00:00.000Z" }
  ] }),
  grades: ({ courseId }) => ({ allowed: true, grades: [
    { id: "grade-1", courseId, teacherId, studentId: "student-sofia-martinez", value: 5.0, assessmentName: "Prueba 1", createdAt: "2026-09-13T10:00:00.000Z" },
    { id: "grade-2", courseId, teacherId, studentId: "student-external", value: 7.0, createdAt: "2026-09-14T10:00:00.000Z" }
  ] }),
  attendance: ({ courseId }) => ({ allowed: true, records: [
    { id: "attendance-1", courseId, teacherId, studentId: "student-sofia-martinez", status: "PRESENT", createdAt: "2026-09-14T10:00:00.000Z" },
    { id: "attendance-2", courseId, teacherId, studentId: "student-antonio-gomez", status: "ABSENT", createdAt: "2026-09-15T10:00:00.000Z" },
    { id: "attendance-3", courseId, teacherId, studentId: "student-external", status: "PRESENT", createdAt: "2026-09-16T10:00:00.000Z" }
  ] }),
  announcements: ({ courseId }) => ({ allowed: true, announcements: [
    { id: "announcement-1", courseId, teacherId, title: "Aviso", createdAt: "2026-09-16T10:00:00.000Z" },
    { id: "announcement-other", courseId, teacherId: "teacher-other", title: "Ajeno", createdAt: "2026-09-17T10:00:00.000Z" }
  ] })
};

const result = getTeacherDashboardSummary({ teacherId, sources });
assert.equal(result.available, true);
assert.equal(result.teacher.id, teacherId);
assert.equal(result.courses.length, 2);
assert.ok(result.courses.every(course => [db, iot].includes(course.courseId)));
const database = result.courses.find(course => course.courseId === db);
assert.equal(database.studentsCount, 2);
assert.equal(database.materialsCount, 1);
assert.equal(database.gradesCount, 1);
assert.equal(database.announcementsCount, 1);
assert.equal(database.attendancePercentage, 50);
assert.equal(database.averageDemo, 5);
assert.equal(getTeacherDashboardSummary({ teacherId: "teacher-invalid", sources }).available, false);
assert.deepEqual(getTeacherDashboardSummary({ teacherId, sources }), result);

const partial = getTeacherDashboardSummary({ teacherId, sources: { ...sources, grades: () => { throw new Error("corrupt"); } } });
assert.equal(partial.available, true);
assert.ok(partial.courses.every(course => course.gradesCount === 0));
assert.ok(partial.warnings.some(item => item.source === "notas"));
const empty = getTeacherDashboardSummary({ teacherId, sources: { ...sources, materials: () => ({ allowed: true, materials: [] }), grades: () => ({ allowed: true, grades: [] }), attendance: () => ({ allowed: true, records: [] }), announcements: () => ({ allowed: true, announcements: [] }) } });
assert.ok(empty.courses.every(course => course.materialsCount === 0 && course.gradesCount === 0 && course.attendancePercentage === null && course.announcementsCount === 0));
result.courses[0].courseName = "alterado";
assert.notEqual(getTeacherDashboardSummary({ teacherId, sources }).courses[0].courseName, "alterado");
assert.equal(typeof getTeacherDashboardSummary.createTeacherGrade, "undefined");
assert.equal(typeof getTeacherDashboardSummary.saveTeacherAttendance, "undefined");

const dashboardSource = readFileSync(new URL("../modules/professor/teacher-dashboard.js", import.meta.url), "utf8");
assert.match(dashboardSource, /\.textContent\s*=/);
const courseRenderer = dashboardSource.slice(dashboardSource.indexOf("function createElement"), dashboardSource.indexOf("function renderActions"));
assert.doesNotMatch(courseRenderer, /\.innerHTML\s*=/);
console.log("TEACHER_DASHBOARD_SUMMARY_OK");
console.log("TEACHER_DASHBOARD_READ_ONLY_OK");
console.log("TEACHER_DASHBOARD_ISOLATION_OK");
console.log("TEACHER_DASHBOARD_METRICS_OK");
console.log("TEACHER_DASHBOARD_XSS_SAFE");
console.log("TEACHER_DASHBOARD_DEGRADATION_OK");
console.log("teacher-dashboard-summary.test.js: OK");
