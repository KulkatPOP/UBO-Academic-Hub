import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTeacherAnnouncement, deleteTeacherAnnouncement, updateTeacherAnnouncement } from "../services/teacher-actions/teacher-announcement-management-service.js";
import { getStudentAnnouncements } from "../services/student-actions/student-announcement-service.js";
import { TEACHER_ANNOUNCEMENT_STORAGE_KEY } from "../services/teacher-actions/teacher-announcement-management-service.js";

function storage() { const values = new Map(); return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }
const local = storage();
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const sofia = "student-sofia-martinez";

const old = createTeacherAnnouncement({ courseId: "course-db-2026-1", title: "Aviso antiguo", content: "Contenido antiguo", identity: teacher, storage: local, now: "2026-09-10T10:00:00.000Z" });
const latest = createTeacherAnnouncement({ courseId: "course-iot-2026-1", title: "<script>alert(1)</script>", content: "<img src=x onerror=alert(1)>", identity: teacher, storage: local, now: "2026-09-12T10:00:00.000Z" });
assert.equal(old.created, true); assert.equal(latest.created, true);
let read = getStudentAnnouncements({ studentId: sofia, storage: local });
assert.equal(read.available, true); assert.equal(read.announcements.length, 2); assert.equal(read.announcements[0].id, latest.announcement.id);
assert.equal(read.announcements[0].title, "<script>alert(1)</script>");
assert.equal(read.announcements[0].content, "<img src=x onerror=alert(1)>");
assert.equal(read.announcements[0].courseName, "Programación IoT");
console.log("STUDENT_ANNOUNCEMENTS_OK"); console.log("STUDENT_ANNOUNCEMENTS_COURSE_ISOLATION_OK"); console.log("STUDENT_ANNOUNCEMENTS_XSS_SAFE");

read.announcements[0].title = "alterado";
assert.equal(getStudentAnnouncements({ studentId: sofia, storage: local }).announcements[0].title, "<script>alert(1)</script>");
assert.equal(typeof getStudentAnnouncements.createTeacherAnnouncement, "undefined");
assert.equal(typeof getStudentAnnouncements.updateTeacherAnnouncement, "undefined");
assert.equal(typeof getStudentAnnouncements.deleteTeacherAnnouncement, "undefined");
console.log("STUDENT_ANNOUNCEMENTS_READ_ONLY_OK");

const updated = updateTeacherAnnouncement({ id: latest.announcement.id, courseId: "course-iot-2026-1", title: "Aviso actualizado", content: "Contenido actualizado", identity: teacher, storage: local, now: "2026-09-13T10:00:00.000Z" });
assert.equal(updated.updated, true); assert.equal(getStudentAnnouncements({ studentId: sofia, storage: local }).announcements[0].content, "Contenido actualizado");
assert.equal(deleteTeacherAnnouncement({ id: latest.announcement.id, courseId: "course-iot-2026-1", identity: teacher, storage: local }).deleted, true);
assert.equal(getStudentAnnouncements({ studentId: sofia, storage: local }).announcements.length, 1);
console.log("TEACHER_ANNOUNCEMENT_REGRESSION_OK"); console.log("STUDENT_ANNOUNCEMENTS_PERSISTENCE_OK");

assert.equal(getStudentAnnouncements({ studentId: "missing", storage: local }).available, false);
local.setItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY, "{broken");
assert.equal(getStudentAnnouncements({ studentId: sofia, storage: local }).announcements.length, 0);
assert.equal(local.getItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY), null);
assert.match(readFileSync(new URL("../app.js", import.meta.url), "utf8"), /function renderHomeAnnouncements\(\)[\s\S]*?\.textContent=item\.content/);
console.log("STUDENT_ANNOUNCEMENTS_CORRUPT_DATA_RECOVERY_OK"); console.log("student-announcements.test.js: OK");
