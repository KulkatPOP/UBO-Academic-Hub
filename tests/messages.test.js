import assert from "node:assert/strict";
import {
  DEMO_MESSAGES_STORAGE_KEY,
  getCourseMessages,
  getStudentMessageById,
  getStudentMessages,
  markStudentMessageRead,
  sendCourseMessage
} from "../services/message-service.js";
import { getStudentAcademicAlerts } from "../services/student-actions/student-alert-service.js";

function storage() { const values = new Map(); return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)) }; }

const local = storage();
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const sent = sendCourseMessage({ courseId: "course-db-2026-1", subject: "Proyecto final", message: "Recuerden entregar avance.", identity: teacher, now: "2026-09-11T10:00:00.000Z", storage: local });
assert.equal(sent.sent, true);
assert.equal(sent.messages.length, 3);
assert.equal(getCourseMessages({ courseId: "course-db-2026-1", identity: teacher, storage: local }).messages.length, 3);
const sofia = getStudentMessages({ studentId: "student-sofia-martinez", storage: local });
assert.equal(sofia.messages.length, 1);
assert.equal(sofia.messages[0].subject, "Proyecto final");
assert.equal(getStudentMessages({ studentId: "student-daniela-rios", storage: local }).messages.length, 0);
assert.equal(getCourseMessages({ courseId: "course-iot-2026-1", identity: teacher, storage: local }).messages.length, 0);
assert.equal(getStudentMessageById({ messageId: sofia.messages[0].id, studentId: "student-daniela-rios", storage: local }).message, null);
assert.equal(markStudentMessageRead({ messageId: sofia.messages[0].id, studentId: "student-sofia-martinez", storage: local }).message.read, true);
assert.equal(getStudentMessageById({ messageId: "message-inexistente", studentId: "student-sofia-martinez", storage: local }).message, null);

const unreadLocal = storage();
const unread = sendCourseMessage({ courseId: "course-db-2026-1", subject: "Recordatorio", message: "Revisa el proyecto.", identity: teacher, now: "2026-09-11T11:00:00.000Z", storage: unreadLocal });
const alerts = getStudentAcademicAlerts({
  studentId: "student-sofia-martinez",
  sources: {
    grades: () => ({ grades: [] }), attendance: () => ({ courses: [] }), materials: () => ({ materials: [] }), announcements: () => ({ announcements: [] }),
    messages: params => getStudentMessages({ ...params, storage: unreadLocal })
  }
});
assert.ok(unread.sent);
assert.ok(alerts.alerts.some(alert => alert.type === "MESSAGE_INFO"));
assert.ok(local.getItem(DEMO_MESSAGES_STORAGE_KEY));
console.log("MESSAGING_DEMO_SECURITY_OK");
