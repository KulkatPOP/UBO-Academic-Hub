import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createTeacherGrade,
  deleteTeacherGrade,
  TEACHER_GRADE_STORAGE_KEY,
  updateTeacherGrade
} from "../services/teacher-actions/teacher-grade-management-service.js";
import { getStudentGrades } from "../services/student-actions/student-grade-service.js";

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

const older = createTeacherGrade({
  courseId: "course-db-2026-1", studentId: sofia, assessmentName: "Control SQL", value: "5,2",
  identity: teacher, storage: local, now: "2026-09-10T10:00:00.000Z"
});
const newer = createTeacherGrade({
  courseId: "course-iot-2026-1", studentId: sofia, assessmentName: "<script>alert(1)</script>", value: "6,2",
  identity: teacher, storage: local, now: "2026-09-12T10:00:00.000Z"
});
const otherStudent = createTeacherGrade({
  courseId: "course-db-2026-1", studentId: "student-antonio-gomez", assessmentName: "Control Antonio", value: "6,0",
  identity: teacher, storage: local, now: "2026-09-13T10:00:00.000Z"
});
assert.equal(older.created, true);
assert.equal(newer.created, true);
assert.equal(otherStudent.created, true);

let result = getStudentGrades({ studentId: sofia, storage: local });
assert.equal(result.available, true);
assert.equal(result.grades.length, 2);
assert.equal(result.grades[0].id, newer.grade.id);
assert.equal(result.grades[0].courseName, "Programación IoT");
assert.equal(result.grades[0].assessmentName, "<script>alert(1)</script>");
assert.equal(result.grades[0].value, 6.2);
assert.deepEqual(getStudentGrades({ studentId: sofia, courseId: "course-db-2026-1", storage: local }).grades.map(grade => grade.id), [older.grade.id]);
assert.equal(getStudentGrades({ studentId: sofia, courseId: "missing", storage: local }).available, false);
assert.equal(getStudentGrades({ studentId: "missing", storage: local }).available, false);
console.log("STUDENT_GRADES_OK");
console.log("STUDENT_GRADES_STUDENT_ISOLATION_OK");
console.log("STUDENT_GRADES_COURSE_ISOLATION_OK");
console.log("STUDENT_GRADES_ORDER_OK");
console.log("STUDENT_GRADES_XSS_SAFE");

result.grades[0].assessmentName = "alterado";
assert.equal(getStudentGrades({ studentId: sofia, storage: local }).grades[0].assessmentName, "<script>alert(1)</script>");
assert.equal(typeof getStudentGrades.createTeacherGrade, "undefined");
assert.equal(typeof getStudentGrades.updateTeacherGrade, "undefined");
assert.equal(typeof getStudentGrades.deleteTeacherGrade, "undefined");
console.log("STUDENT_GRADES_READ_ONLY_OK");

const updated = updateTeacherGrade({
  id: older.grade.id, courseId: "course-db-2026-1", studentId: sofia, assessmentName: "Control SQL", value: "6,2",
  identity: teacher, storage: local, now: "2026-09-14T10:00:00.000Z"
});
assert.equal(updated.updated, true);
assert.equal(getStudentGrades({ studentId: sofia, storage: local }).grades.find(grade => grade.id === older.grade.id).value, 6.2);
assert.equal(deleteTeacherGrade({ id: newer.grade.id, courseId: "course-iot-2026-1", identity: teacher, storage: local }).deleted, true);
assert.equal(getStudentGrades({ studentId: sofia, storage: local }).grades.some(grade => grade.id === newer.grade.id), false);
console.log("TEACHER_GRADE_REGRESSION_OK");
console.log("STUDENT_GRADES_PERSISTENCE_OK");

const records = JSON.parse(local.getItem(TEACHER_GRADE_STORAGE_KEY));
local.setItem(TEACHER_GRADE_STORAGE_KEY, JSON.stringify([...records, {
  id: "foreign-grade", courseId: "course-foreign", studentId: sofia, teacherId: teacher.id,
  assessmentName: "Fuera de curso", value: 5, createdAt: "2026-09-15T10:00:00.000Z", updatedAt: "2026-09-15T10:00:00.000Z"
}, {
  id: "invalid-grade", courseId: "course-db-2026-1", studentId: sofia, teacherId: teacher.id,
  assessmentName: "Fuera de rango", value: 8, createdAt: "2026-09-15T10:00:00.000Z", updatedAt: "2026-09-15T10:00:00.000Z"
}]));
assert.equal(getStudentGrades({ studentId: sofia, storage: local }).grades.some(grade => grade.id === "foreign-grade"), false);
assert.ok(getStudentGrades({ studentId: sofia, storage: local }).warning);

local.setItem(TEACHER_GRADE_STORAGE_KEY, "{corrupt");
const corrupt = getStudentGrades({ studentId: sofia, storage: local });
assert.equal(corrupt.grades.length, 0);
assert.equal(local.getItem(TEACHER_GRADE_STORAGE_KEY), "{corrupt");
const unavailable = getStudentGrades({ studentId: sofia, storage: null });
assert.equal(unavailable.available, true);
assert.ok(unavailable.warning);
assert.match(readFileSync(new URL("../app.js", import.meta.url), "utf8"), /function appendStudentGrades[\s\S]*?\.textContent=item\.assessmentName/);
console.log("STUDENT_GRADES_CORRUPT_DATA_CONTROLLED_OK");
console.log("student-grade.test.js: OK");
