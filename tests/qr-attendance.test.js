import assert from "node:assert/strict";
import {
  QR_ATTENDANCE_RECORDS_STORAGE_KEY,
  QR_ATTENDANCE_SESSIONS_STORAGE_KEY,
  generateQrAttendanceSession,
  getQrAttendanceRecords,
  getQrAttendanceSessions,
  registerQrAttendance,
  validateQrAttendanceRegistration
} from "../services/qr-attendance-service.js";

function storage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}

const local = storage();
const now = new Date("2026-09-11T10:00:00.000Z");
const generated = generateQrAttendanceSession({ courseId: "course-db-2026-1", teacherId: "teacher-carlos-perez", now, storage: local });
assert.equal(generated.created, true);
assert.deepEqual(JSON.parse(generated.payload), { sessionId: generated.session.id, courseId: "course-db-2026-1" });
assert.equal(getQrAttendanceSessions({ storage: local }).sessions.length, 1);

const valid = validateQrAttendanceRegistration({ code: generated.payload, studentId: "student-sofia-martinez", now, storage: local });
assert.equal(valid.valid, true);
assert.equal(validateQrAttendanceRegistration({ code: "qr-session-inexistente", studentId: "student-sofia-martinez", now, storage: local }).code, "SESSION_NOT_FOUND");
const wrongCourse = validateQrAttendanceRegistration({ code: generated.payload, studentId: "student-daniela-rios", now, storage: local });
assert.equal(wrongCourse.code, "COURSE_NOT_ENROLLED");
const recorded = registerQrAttendance({ code: generated.payload, studentId: "student-sofia-martinez", now, storage: local });
assert.equal(recorded.registered, true);
assert.equal(recorded.record.status, "PRESENT");
assert.equal(registerQrAttendance({ code: generated.payload, studentId: "student-sofia-martinez", now, storage: local }).code, "DUPLICATE_RECORD");
assert.equal(validateQrAttendanceRegistration({ code: generated.payload, studentId: "student-antonio-gomez", now: new Date("2026-09-11T10:16:00.000Z"), storage: local }).code, "SESSION_EXPIRED");

const records = getQrAttendanceRecords({ storage: local }).records;
records[0].status = "ABSENT";
assert.equal(getQrAttendanceRecords({ storage: local }).records[0].status, "PRESENT");
assert.ok(local.getItem(QR_ATTENDANCE_SESSIONS_STORAGE_KEY));
assert.ok(local.getItem(QR_ATTENDANCE_RECORDS_STORAGE_KEY));
console.log("QR_ATTENDANCE_DEMO_FLOW_OK");
