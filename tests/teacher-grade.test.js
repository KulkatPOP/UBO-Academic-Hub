import assert from "node:assert/strict";
import { universityEvaluations } from "../data/university/grades.js";
import { demoUsers } from "../data/users.js";
import {
  TEACHER_GRADE_STORAGE_KEY,
  createTeacherGrade,
  deleteTeacherGrade,
  getTeacherCourseGrades,
  normalizeTeacherGrade,
  updateTeacherGrade,
  validateTeacherGrade
} from "../services/teacher-actions/teacher-grade-management-service.js";

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

const byRole = role => demoUsers.find(user => user.role === role);
const teacher = byRole("TEACHER");
const student = byRole("STUDENT");
const admin = byRole("ADMIN");
const dbCourse = "course-db-2026-1";
const iotCourse = "course-iot-2026-1";
const sofia = "student-sofia-martinez";
const storage = new MemoryStorage();
const institutionalBefore = JSON.stringify(universityEvaluations);

assert.equal(normalizeTeacherGrade("5"), 5);
assert.equal(normalizeTeacherGrade("5.0"), 5);
assert.equal(normalizeTeacherGrade("5,5"), 5.5);
assert.equal(normalizeTeacherGrade("7,0"), 7);
for (const invalid of ["", "0", "0.5", "7.1", "10", "texto", "NaN", "Infinity", "5.55"]) assert.equal(normalizeTeacherGrade(invalid), null);
assert.equal(validateTeacherGrade({ courseId: "missing", studentId: sofia, assessmentName: "Prueba 1", value: "5,5", identity: teacher }).valid, false);
assert.equal(validateTeacherGrade({ courseId: dbCourse, studentId: "missing", assessmentName: "Prueba 1", value: "5,5", identity: teacher }).valid, false);
assert.equal(validateTeacherGrade({ courseId: dbCourse, studentId: sofia, assessmentName: "Prueba 1", value: "5,5", identity: student }).valid, false);
assert.equal(validateTeacherGrade({ courseId: dbCourse, studentId: sofia, assessmentName: "Prueba 1", value: "5,5", identity: admin }).valid, false);
console.log("TEACHER_GRADE_VALIDATION_OK");

const created = createTeacherGrade({ courseId: dbCourse, studentId: sofia, assessmentName: "Prueba demo 1", value: "5,5", identity: teacher, storage, now: "2026-09-10T12:00:00.000Z" });
assert.equal(created.created, true);
assert.equal(created.grade.value, 5.5);
assert.equal(JSON.stringify(universityEvaluations), institutionalBefore);
console.log("TEACHER_GRADE_CREATION_OK");

const read = getTeacherCourseGrades({ courseId: dbCourse, identity: teacher, storage });
assert.equal(read.grades.length, 1);
read.grades[0].value = 1;
assert.equal(getTeacherCourseGrades({ courseId: dbCourse, identity: teacher, storage }).grades[0].value, 5.5);
assert.equal(getTeacherCourseGrades({ courseId: iotCourse, identity: teacher, storage }).grades.length, 0);
console.log("TEACHER_GRADE_PERSISTENCE_OK");
console.log("TEACHER_GRADE_COURSE_ISOLATION_OK");

assert.equal(createTeacherGrade({ courseId: dbCourse, studentId: sofia, assessmentName: "prueba DEMO 1", value: "6,0", identity: teacher, storage }).created, false);
const updated = updateTeacherGrade({ id: created.grade.id, courseId: dbCourse, studentId: sofia, assessmentName: "Prueba demo 1", value: "6,0", identity: teacher, storage, now: "2026-09-10T13:00:00.000Z" });
assert.equal(updated.updated, true);
assert.equal(updated.grade.value, 6);
assert.notEqual(updated.grade.updatedAt, created.grade.updatedAt);
console.log("TEACHER_GRADE_EDIT_OK");

assert.equal(getTeacherCourseGrades({ courseId: dbCourse, identity: student, storage }).allowed, false);
assert.equal(getTeacherCourseGrades({ courseId: dbCourse, identity: admin, storage }).allowed, false);
console.log("TEACHER_GRADE_ROLE_ISOLATION_OK");

assert.equal(deleteTeacherGrade({ id: updated.grade.id, courseId: dbCourse, identity: teacher, storage }).deleted, true);
assert.equal(getTeacherCourseGrades({ courseId: dbCourse, identity: teacher, storage }).grades.length, 0);
assert.equal(deleteTeacherGrade({ id: updated.grade.id, courseId: dbCourse, identity: teacher, storage }).deleted, false);
console.log("TEACHER_GRADE_DELETION_OK");

storage.setItem(TEACHER_GRADE_STORAGE_KEY, "{corrupt");
assert.equal(getTeacherCourseGrades({ courseId: dbCourse, identity: teacher, storage }).grades.length, 0);
assert.equal(storage.getItem(TEACHER_GRADE_STORAGE_KEY), null);
assert.equal(JSON.stringify(universityEvaluations), institutionalBefore);
console.log("TEACHER_GRADE_CORRUPT_DATA_RECOVERY_OK");
console.log("INSTITUTIONAL_GRADES_UNMODIFIED");
console.log("teacher-grade.test.js: OK");
