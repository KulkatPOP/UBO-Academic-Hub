import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateDemoAttendance,
  calculateDemoAverage,
  calculateGradeDistribution,
  calculateGradeTrend,
  getStudentAcademicAnalytics,
  getTeacherCourseAnalytics
} from "../services/analytics/academic-analytics-service.js";

const teacherId = "teacher-carlos-perez";
const studentId = "student-sofia-martinez";
const db = "course-db-2026-1";
const iot = "course-iot-2026-1";
const course = { id: db, nombre: "Bases de Datos", professorId: teacherId, studentIds: [studentId, "student-antonio-gomez"] };

assert.equal(calculateDemoAverage([{ value: 5 }, { value: 6 }]), 5.5);
assert.deepEqual(calculateGradeDistribution([{ value: 6.2 }, { value: 5 }, { value: 3.8 }]), { good: 1, followUp: 1, risk: 1, total: 3 });
assert.equal(calculateDemoAttendance([{ status: "PRESENT" }, { status: "JUSTIFIED" }, { status: "ABSENT" }]).percentage, 66.7);
assert.equal(calculateGradeTrend([{ id: "a", value: 5, createdAt: "2026-01-01" }, { id: "b", value: 5.6, createdAt: "2026-01-02" }]).code, "IMPROVING");
assert.equal(calculateGradeTrend([{ id: "a", value: 6, createdAt: "2026-01-01" }, { id: "b", value: 5.2, createdAt: "2026-01-02" }]).code, "DECLINING");
assert.equal(calculateGradeTrend([{ id: "a", value: 5, createdAt: "2026-01-01" }, { id: "b", value: 5.1, createdAt: "2026-01-02" }]).code, "STABLE");

const teacherSources = {
  professor: id => id === teacherId ? { id, nombre: "Carlos Pérez", role: "TEACHER" } : null,
  courses: id => id === teacherId ? [course, { ...course, id: "course-other", professorId: "teacher-other" }] : [],
  materials: ({ courseId }) => ({ materials: [{ id: "m", courseId, teacherId, title: "<img src=x>", createdAt: "2026-01-01" }] }),
  grades: ({ courseId }) => ({ grades: [
    { id: "g1", courseId, teacherId, studentId, value: 6.2, createdAt: "2026-01-01" },
    { id: "g2", courseId, teacherId, studentId: "student-antonio-gomez", value: 5, createdAt: "2026-01-02" },
    { id: "g3", courseId, teacherId, studentId: "student-external", value: 1, createdAt: "2026-01-03" }
  ] }),
  attendance: ({ courseId }) => ({ records: [
    { id: "a1", courseId, teacherId, studentId, status: "PRESENT" },
    { id: "a2", courseId, teacherId, studentId: "student-antonio-gomez", status: "ABSENT" },
    { id: "a3", courseId, teacherId, studentId: "student-external", status: "PRESENT" }
  ] }),
  announcements: ({ courseId }) => ({ announcements: [{ id: "n", courseId, teacherId, title: "Aviso" }] })
};
const teacher = getTeacherCourseAnalytics({ teacherId, sources: teacherSources });
assert.equal(teacher.available, true);
assert.equal(teacher.courses.length, 1);
assert.equal(teacher.courses[0].averageDemo, 5.6);
assert.equal(teacher.courses[0].distribution.total, 2);
assert.equal(teacher.courses[0].attendance.percentage, 50);
assert.equal(teacher.courses[0].materialsCount, 1);
assert.equal(teacher.courses[0].announcementsCount, 1);
assert.equal(getTeacherCourseAnalytics({ teacherId: "teacher-invalid", sources: teacherSources }).available, false);
assert.equal(getTeacherCourseAnalytics({ teacherId, courseId: iot, sources: teacherSources }).available, false);

const studentSources = {
  student: id => id === studentId ? { id, nombre: "Sofía Martínez" } : null,
  courses: id => id === studentId ? [course, { id: iot, nombre: "Programación IoT", professorId: teacherId, studentIds: [studentId] }, { id: "course-external", nombre: "Ajeno", studentIds: ["student-external"] }] : [],
  grades: () => ({ grades: [
    { id: "s1", courseId: db, studentId, value: 5, createdAt: "2026-01-01" },
    { id: "s2", courseId: db, studentId, value: 5.8, createdAt: "2026-01-02" },
    { id: "s3", courseId: "course-external", studentId, value: 7, createdAt: "2026-01-03" },
    { id: "s4", courseId: db, studentId: "student-external", value: 1, createdAt: "2026-01-04" }
  ] }),
  attendance: () => ({ courses: [{ courseId: db, registered: 2, percentage: 100 }, { courseId: "course-external", registered: 1, percentage: 0 }] })
};
const student = getStudentAcademicAnalytics({ studentId, sources: studentSources });
assert.equal(student.available, true);
assert.equal(student.courses.length, 2);
assert.equal(student.courses.find(item => item.courseId === db).trend.code, "IMPROVING");
assert.equal(student.courses.find(item => item.courseId === db).grades.length, 2);
assert.equal(getStudentAcademicAnalytics({ studentId: "student-invalid", sources: studentSources }).available, false);
assert.equal(getStudentAcademicAnalytics({ studentId, courseId: "course-external", sources: studentSources }).available, false);
const partial = getStudentAcademicAnalytics({ studentId, sources: { ...studentSources, grades: () => { throw new Error("corrupt"); } } });
assert.equal(partial.available, true);
assert.ok(partial.courses.every(item => item.grades.length === 0));
assert.ok(partial.warnings.some(item => item.source === "notas"));
const empty = getTeacherCourseAnalytics({ teacherId, sources: { ...teacherSources, materials: () => ({ materials: [] }), grades: () => ({ grades: [] }), attendance: () => ({ records: [] }), announcements: () => ({ announcements: [] }) } });
assert.equal(empty.courses[0].averageDemo, null);
assert.equal(empty.courses[0].attendance.percentage, null);
teacher.courses[0].courseName = "alterado";
assert.notEqual(getTeacherCourseAnalytics({ teacherId, sources: teacherSources }).courses[0].courseName, "alterado");
assert.equal(typeof getTeacherCourseAnalytics.createTeacherGrade, "undefined");
assert.equal(typeof getStudentAcademicAnalytics.saveTeacherAttendance, "undefined");

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const renderer = app.slice(app.indexOf("function renderStudentAcademicProgress"), app.indexOf("const phase190RenderScreen"));
assert.match(renderer, /\.textContent\s*=/);
assert.doesNotMatch(renderer, /\.innerHTML\s*=/);
console.log("ACADEMIC_ANALYTICS_OK");
console.log("ACADEMIC_ANALYTICS_READ_ONLY_OK");
console.log("ACADEMIC_ANALYTICS_ISOLATION_OK");
console.log("ACADEMIC_ANALYTICS_METRICS_OK");
console.log("ACADEMIC_ANALYTICS_TREND_OK");
console.log("ACADEMIC_ANALYTICS_XSS_SAFE");
console.log("ACADEMIC_ANALYTICS_DEGRADATION_OK");
console.log("academic-analytics.test.js: OK");
