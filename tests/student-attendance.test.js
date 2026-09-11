import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  saveTeacherAttendance,
  TEACHER_ATTENDANCE_STORAGE_KEY
} from "../services/teacher-actions/teacher-attendance-management-service.js";
import { getStudentAttendance } from "../services/student-actions/student-attendance-service.js";

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
const dbCourse = "course-db-2026-1";

const sofiaRecords = [];
for (let day = 1; day <= 10; day += 1) {
  sofiaRecords.push(saveTeacherAttendance({
    courseId: dbCourse, studentId: sofia, date: `2026-09-${String(day).padStart(2, "0")}`, status: "PRESENT",
    identity: teacher, storage: local, now: `2026-09-${String(day).padStart(2, "0")}T10:00:00.000Z`
  }));
}
const absent = saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-11", status: "ABSENT", identity: teacher, storage: local, now: "2026-09-11T10:00:00.000Z" });
const justified = saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-12", status: "JUSTIFIED", identity: teacher, storage: local, now: "2026-09-12T10:00:00.000Z" });
const otherStudent = saveTeacherAttendance({ courseId: dbCourse, studentId: "student-antonio-gomez", date: "2026-09-13", status: "PRESENT", identity: teacher, storage: local, now: "2026-09-13T10:00:00.000Z" });
assert.ok(sofiaRecords.every(result => result.created));
assert.equal(absent.created, true);
assert.equal(justified.created, true);
assert.equal(otherStudent.created, true);

let result = getStudentAttendance({ studentId: sofia, storage: local });
const summary = result.courses.find(course => course.courseId === dbCourse);
assert.equal(result.available, true);
assert.equal(summary.present, 10);
assert.equal(summary.absent, 1);
assert.equal(summary.justified, 1);
assert.equal(summary.registered, 12);
assert.equal(summary.percentage, 91.7);
assert.equal(summary.records[0].date, "2026-09-12");
assert.equal(summary.records[0].status, "JUSTIFIED");
assert.equal(summary.records.some(record => record.studentId === "student-antonio-gomez"), false);
assert.equal(getStudentAttendance({ studentId: sofia, courseId: dbCourse, storage: local }).courses.length, 1);
assert.equal(getStudentAttendance({ studentId: sofia, courseId: "missing", storage: local }).available, false);
assert.equal(getStudentAttendance({ studentId: "missing", storage: local }).available, false);
assert.equal(getStudentAttendance({ studentId: sofia, courseId: "course-iot-2026-1", storage: local }).courses[0].percentage, null);
console.log("STUDENT_ATTENDANCE_OK");
console.log("STUDENT_ATTENDANCE_STUDENT_ISOLATION_OK");
console.log("STUDENT_ATTENDANCE_COURSE_ISOLATION_OK");
console.log("STUDENT_ATTENDANCE_PERCENTAGE_OK");
console.log("STUDENT_ATTENDANCE_ORDER_OK");

summary.records[0].status = "ABSENT";
assert.equal(getStudentAttendance({ studentId: sofia, storage: local }).courses.find(course => course.courseId === dbCourse).records[0].status, "JUSTIFIED");
assert.equal(typeof getStudentAttendance.saveTeacherAttendance, "undefined");
assert.equal(typeof getStudentAttendance.createAttendance, "undefined");
assert.equal(typeof getStudentAttendance.updateAttendance, "undefined");
assert.equal(typeof getStudentAttendance.deleteAttendance, "undefined");
console.log("STUDENT_ATTENDANCE_READ_ONLY_OK");

const changedAbsent = saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-01", status: "ABSENT", identity: teacher, storage: local, now: "2026-09-14T10:00:00.000Z" });
assert.equal(changedAbsent.updated, true);
assert.equal(getStudentAttendance({ studentId: sofia, storage: local }).courses.find(course => course.courseId === dbCourse).present, 9);
const changedJustified = saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-01", status: "JUSTIFIED", identity: teacher, storage: local, now: "2026-09-15T10:00:00.000Z" });
const afterUpdate = getStudentAttendance({ studentId: sofia, storage: local }).courses.find(course => course.courseId === dbCourse);
assert.equal(changedJustified.updated, true);
assert.equal(afterUpdate.registered, 12);
assert.equal(afterUpdate.justified, 2);
assert.equal(afterUpdate.percentage, 91.7);
console.log("TEACHER_ATTENDANCE_REGRESSION_OK");
console.log("STUDENT_ATTENDANCE_PERSISTENCE_OK");

const records = JSON.parse(local.getItem(TEACHER_ATTENDANCE_STORAGE_KEY));
local.setItem(TEACHER_ATTENDANCE_STORAGE_KEY, JSON.stringify([...records, {
  id: "foreign-attendance", courseId: "course-foreign", studentId: sofia, teacherId: teacher.id,
  date: "2026-09-16", status: "PRESENT", createdAt: "2026-09-16T10:00:00.000Z", updatedAt: "2026-09-16T10:00:00.000Z"
}, {
  id: "invalid-attendance", courseId: dbCourse, studentId: sofia, teacherId: teacher.id,
  date: "2026-09-16", status: "LATE", createdAt: "2026-09-16T10:00:00.000Z", updatedAt: "2026-09-16T10:00:00.000Z"
}]));
assert.equal(getStudentAttendance({ studentId: sofia, storage: local }).attendance.some(record => record.id === "foreign-attendance"), false);
assert.ok(getStudentAttendance({ studentId: sofia, storage: local }).warning);

local.setItem(TEACHER_ATTENDANCE_STORAGE_KEY, "{corrupt");
const corrupt = getStudentAttendance({ studentId: sofia, storage: local });
assert.equal(corrupt.attendance.length, 0);
assert.equal(local.getItem(TEACHER_ATTENDANCE_STORAGE_KEY), "{corrupt");
const unavailable = getStudentAttendance({ studentId: sofia, storage: null });
assert.equal(unavailable.available, true);
assert.ok(unavailable.warning);
assert.match(readFileSync(new URL("../app.js", import.meta.url), "utf8"), /function appendStudentAttendance[\s\S]*?\.textContent=course\.courseName/);
console.log("STUDENT_ATTENDANCE_CORRUPT_DATA_CONTROLLED_OK");
console.log("student-attendance.test.js: OK");
