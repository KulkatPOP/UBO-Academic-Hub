import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { universityCourses } from "../data/university/courses.js";
import { createTeacherAnnouncement } from "../services/teacher-actions/teacher-announcement-management-service.js";
import { saveTeacherAttendance } from "../services/teacher-actions/teacher-attendance-management-service.js";
import { createTeacherGrade, TEACHER_GRADE_STORAGE_KEY } from "../services/teacher-actions/teacher-grade-management-service.js";
import { createTeacherMaterial } from "../services/teacher-actions/teacher-material-management-service.js";
import { getStudentAcademicSummary } from "../services/student-actions/student-academic-summary-service.js";

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

const local = storage();
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const sofia = "student-sofia-martinez";
const coursesBefore = JSON.stringify(universityCourses);

assert.equal(createTeacherAnnouncement({ courseId: "course-db-2026-1", title: "<script>alert(1)</script>", content: "Aviso SQL", identity: teacher, storage: local, now: "2026-09-10T10:00:00.000Z" }).created, true);
assert.equal(createTeacherMaterial({ courseId: "course-db-2026-1", title: "<img src=x onerror=alert(1)>", description: "Material SQL", type: "GUÍA", identity: teacher, storage: local, now: "2026-09-11T10:00:00.000Z" }).created, true);
assert.equal(createTeacherGrade({ courseId: "course-db-2026-1", studentId: sofia, assessmentName: "<script>alert(1)</script>", value: "6,2", identity: teacher, storage: local, now: "2026-09-12T10:00:00.000Z" }).created, true);
assert.equal(saveTeacherAttendance({ courseId: "course-db-2026-1", studentId: sofia, date: "2026-09-12", status: "PRESENT", identity: teacher, storage: local, now: "2026-09-12T11:00:00.000Z" }).created, true);
assert.equal(createTeacherGrade({ courseId: "course-db-2026-1", studentId: "student-antonio-gomez", assessmentName: "Nota externa", value: "7,0", identity: teacher, storage: local, now: "2026-09-13T10:00:00.000Z" }).created, true);

let result = getStudentAcademicSummary({ studentId: sofia, storage: local });
assert.equal(result.available, true);
assert.equal(result.summary.demo.activeCourses, 2);
assert.equal(result.summary.demo.gradesRegistered, 1);
assert.equal(result.summary.demo.materialsAvailable, 1);
assert.equal(result.summary.demo.announcementsRecent, 1);
assert.equal(result.summary.demo.attendanceCourses, 1);
const db = result.summary.courses.find(course => course.courseId === "course-db-2026-1");
const iot = result.summary.courses.find(course => course.courseId === "course-iot-2026-1");
assert.equal(db.latestGrade.value, 6.2);
assert.equal(db.latestGrade.assessmentName, "<script>alert(1)</script>");
assert.equal(db.attendance.percentage, 100);
assert.equal(db.materialCount, 1);
assert.equal(db.announcementCount, 1);
assert.equal(iot.latestGrade, null);
assert.equal(iot.attendance, null);
assert.equal(iot.materialCount, 0);
assert.equal(iot.announcementCount, 0);
assert.deepEqual(getStudentAcademicSummary({ studentId: sofia, storage: local }), result);
assert.equal(JSON.stringify(universityCourses), coursesBefore);
console.log("STUDENT_ACADEMIC_SUMMARY_OK");
console.log("STUDENT_ACADEMIC_SUMMARY_INSTITUTIONAL_DATA_UNMODIFIED");
console.log("STUDENT_ACADEMIC_SUMMARY_DEMO_SEPARATION_OK");
console.log("STUDENT_ACADEMIC_SUMMARY_STUDENT_ISOLATION_OK");
console.log("STUDENT_ACADEMIC_SUMMARY_COURSE_ISOLATION_OK");
console.log("STUDENT_ACADEMIC_SUMMARY_XSS_SAFE");

result.summary.courses[0].courseName = "alterado";
assert.notEqual(getStudentAcademicSummary({ studentId: sofia, storage: local }).summary.courses[0].courseName, "alterado");
assert.equal(typeof getStudentAcademicSummary.createTeacherGrade, "undefined");
assert.equal(typeof getStudentAcademicSummary.saveTeacherAttendance, "undefined");
assert.equal(typeof getStudentAcademicSummary.createTeacherMaterial, "undefined");
assert.equal(typeof getStudentAcademicSummary.createTeacherAnnouncement, "undefined");
console.log("STUDENT_ACADEMIC_SUMMARY_READ_ONLY_OK");
console.log("STUDENT_ACADEMIC_SUMMARY_PERSISTENCE_OK");

local.setItem(TEACHER_GRADE_STORAGE_KEY, "{corrupt");
const partial = getStudentAcademicSummary({ studentId: sofia, storage: local });
assert.equal(partial.summary.demo.gradesRegistered, 0);
assert.equal(partial.summary.demo.materialsAvailable, 1);
assert.equal(partial.summary.demo.announcementsRecent, 1);
assert.equal(partial.summary.demo.attendanceCourses, 1);
assert.ok(partial.warnings.some(item => item.source === "notas"));
assert.equal(local.getItem(TEACHER_GRADE_STORAGE_KEY), "{corrupt");
const unavailable = getStudentAcademicSummary({ studentId: sofia, storage: null });
assert.equal(unavailable.available, true);
assert.ok(unavailable.warnings.length);
assert.equal(getStudentAcademicSummary({ studentId: "missing", storage: local }).available, false);
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const renderer = appSource.slice(appSource.indexOf("function summaryMetric"), appSource.indexOf("function renderInternationalization"));
assert.match(renderer, /\.textContent=value/);
assert.doesNotMatch(renderer, /\.innerHTML/);
console.log("STUDENT_ACADEMIC_SUMMARY_CORRUPT_DATA_CONTROLLED_OK");
console.log("student-academic-summary.test.js: OK");
