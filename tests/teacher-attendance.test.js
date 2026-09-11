import assert from "node:assert/strict";
import { universityAttendance } from "../data/university/attendance.js";
import {
  TEACHER_ATTENDANCE_STORAGE_KEY,
  getTeacherAttendanceSession,
  getTeacherCourseAttendance,
  saveTeacherAttendance,
  validateTeacherAttendance
} from "../services/teacher-actions/teacher-attendance-management-service.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

const storage = createStorage();
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const student = { id: "student-sofia-martinez", role: "STUDENT" };
const admin = { id: "admin-ubo", role: "ADMIN" };
const dbCourse = "course-db-2026-1";
const iotCourse = "course-iot-2026-1";
const sofia = "student-sofia-martinez";
const antonio = "student-antonio-gomez";
const institutionalBefore = JSON.stringify(universityAttendance);

assert.equal(getTeacherAttendanceSession({ courseId: dbCourse, date: "2026-09-12", identity: teacher, storage }).students.length, 3);
assert.equal(getTeacherAttendanceSession({ courseId: "missing", date: "2026-09-12", identity: teacher, storage }).allowed, false);
assert.equal(getTeacherAttendanceSession({ courseId: dbCourse, date: "2026-02-30", identity: teacher, storage }).allowed, false);
console.log("TEACHER_ATTENDANCE_SESSION_OK");

assert.equal(validateTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-12", status: "PRESENT", identity: teacher }).valid, true);
assert.equal(validateTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "bad-date", status: "PRESENT", identity: teacher }).valid, false);
assert.equal(validateTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-12", status: "LATE", identity: teacher }).valid, false);
assert.equal(validateTeacherAttendance({ courseId: dbCourse, studentId: "external", date: "2026-09-12", status: "PRESENT", identity: teacher }).valid, false);
assert.equal(validateTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-12", status: "PRESENT", identity: student }).valid, false);
assert.equal(validateTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-12", status: "PRESENT", identity: admin }).valid, false);
console.log("TEACHER_ATTENDANCE_VALIDATION_OK");

const present = saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-12", status: "PRESENT", identity: teacher, storage, now: "2026-09-12T10:00:00.000Z" });
const absent = saveTeacherAttendance({ courseId: dbCourse, studentId: antonio, date: "2026-09-12", status: "ABSENT", identity: teacher, storage, now: "2026-09-12T10:01:00.000Z" });
assert.equal(present.created, true);
assert.equal(absent.created, true);
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, date: "2026-09-12", identity: teacher, storage }).summary.unregistered, 1);
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, date: "2026-09-12", identity: teacher, storage }).summary.present, 1);
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, date: "2026-09-12", identity: teacher, storage }).summary.absent, 1);
console.log("TEACHER_ATTENDANCE_MANAGEMENT_OK");

const justified = saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-13", status: "JUSTIFIED", identity: teacher, storage, now: "2026-09-13T10:00:00.000Z" });
assert.equal(justified.created, true);
const updated = saveTeacherAttendance({ courseId: dbCourse, studentId: antonio, date: "2026-09-12", status: "JUSTIFIED", identity: teacher, storage, now: "2026-09-12T11:00:00.000Z" });
assert.equal(updated.updated, true);
assert.equal(updated.attendance.id, absent.attendance.id);
const courseAttendance = getTeacherCourseAttendance({ courseId: dbCourse, identity: teacher, storage });
const sofiaStats = courseAttendance.students.find(item => item.studentId === sofia);
assert.deepEqual({ present: sofiaStats.present, justified: sofiaStats.justified, absent: sofiaStats.absent, percentage: sofiaStats.percentage }, { present: 1, justified: 1, absent: 0, percentage: 100 });
console.log("TEACHER_ATTENDANCE_PERCENTAGE_OK");

const read = getTeacherCourseAttendance({ courseId: dbCourse, identity: teacher, storage });
read.records[0].status = "ABSENT";
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, identity: teacher, storage }).records[0].status, "PRESENT");
assert.equal(getTeacherCourseAttendance({ courseId: iotCourse, identity: teacher, storage }).records.length, 0);
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, identity: student, storage }).allowed, false);
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, identity: admin, storage }).allowed, false);
console.log("TEACHER_ATTENDANCE_PERSISTENCE_OK");
console.log("TEACHER_ATTENDANCE_COURSE_ISOLATION_OK");
console.log("TEACHER_ATTENDANCE_ROLE_ISOLATION_OK");

storage.setItem(TEACHER_ATTENDANCE_STORAGE_KEY, "{corrupt");
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, identity: teacher, storage }).records.length, 0);
assert.equal(storage.getItem(TEACHER_ATTENDANCE_STORAGE_KEY), null);
assert.equal(getTeacherCourseAttendance({ courseId: dbCourse, identity: teacher, storage: null }).allowed, true);
assert.equal(saveTeacherAttendance({ courseId: dbCourse, studentId: sofia, date: "2026-09-14", status: "PRESENT", identity: teacher, storage: { getItem() {}, setItem() { throw new Error("blocked"); } } }).saved, false);
assert.equal(JSON.stringify(universityAttendance), institutionalBefore);
console.log("TEACHER_ATTENDANCE_CORRUPT_DATA_RECOVERY_OK");
console.log("INSTITUTIONAL_ATTENDANCE_UNMODIFIED");
console.log("teacher-attendance.test.js: OK");
