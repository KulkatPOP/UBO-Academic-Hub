import assert from "node:assert/strict";
import {
  TEACHER_ANNOUNCEMENT_STORAGE_KEY,
  createTeacherAnnouncement,
  deleteTeacherAnnouncement,
  getTeacherCourseAnnouncements,
  updateTeacherAnnouncement,
  validateTeacherAnnouncement
} from "../services/teacher-actions/teacher-announcement-management-service.js";

function storage() { const values = new Map(); return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }
const local = storage();
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const student = { id: "student-sofia-martinez", role: "STUDENT" };
const admin = { id: "admin-ubo", role: "ADMIN" };
const db = "course-db-2026-1", iot = "course-iot-2026-1";

assert.equal(validateTeacherAnnouncement({ courseId: db, title: " Aviso ", content: " Texto ", identity: teacher }).valid, true);
assert.equal(validateTeacherAnnouncement({ courseId: db, title: "", content: "Texto", identity: teacher }).valid, false);
assert.equal(validateTeacherAnnouncement({ courseId: db, title: "Título", content: "", identity: teacher }).valid, false);
assert.equal(validateTeacherAnnouncement({ courseId: db, title: 4, content: {}, identity: teacher }).valid, false);
assert.equal(validateTeacherAnnouncement({ courseId: db, title: "x".repeat(121), content: "Texto", identity: teacher }).valid, false);
assert.equal(validateTeacherAnnouncement({ courseId: "missing", title: "Título", content: "Texto", identity: teacher }).valid, false);
assert.equal(validateTeacherAnnouncement({ courseId: db, title: "Título", content: "Texto", identity: student }).valid, false);
assert.equal(validateTeacherAnnouncement({ courseId: db, title: "Título", content: "Texto", identity: admin }).valid, false);
console.log("TEACHER_ANNOUNCEMENT_VALIDATION_OK");

const first = createTeacherAnnouncement({ courseId: db, title: " Aviso inicial ", content: " Contenido inicial ", identity: teacher, storage: local, now: "2026-09-14T10:00:00.000Z" });
const second = createTeacherAnnouncement({ courseId: db, title: "Aviso inicial", content: "Una publicación distinta", identity: teacher, storage: local, now: "2026-09-15T10:00:00.000Z" });
assert.equal(first.created, true); assert.equal(second.created, true);
const listed = getTeacherCourseAnnouncements({ courseId: db, identity: teacher, storage: local });
assert.equal(listed.announcements.length, 2); assert.equal(listed.announcements[0].id, second.announcement.id);
assert.equal(first.announcement.title, "Aviso inicial"); assert.equal(first.announcement.content, "Contenido inicial");
console.log("TEACHER_ANNOUNCEMENT_MANAGEMENT_OK"); console.log("TEACHER_ANNOUNCEMENT_ORDER_OK");

listed.announcements[0].title = "alterado";
assert.equal(getTeacherCourseAnnouncements({ courseId: db, identity: teacher, storage: local }).announcements[0].title, "Aviso inicial");
assert.equal(getTeacherCourseAnnouncements({ courseId: iot, identity: teacher, storage: local }).announcements.length, 0);
const changed = updateTeacherAnnouncement({ id: first.announcement.id, courseId: db, title: "Aviso actualizado", content: "Contenido actualizado", identity: teacher, storage: local, now: "2026-09-16T10:00:00.000Z" });
assert.equal(changed.updated, true); assert.notEqual(changed.announcement.updatedAt, changed.announcement.createdAt);
assert.equal(deleteTeacherAnnouncement({ id: changed.announcement.id, courseId: db, identity: teacher, storage: local }).deleted, true);
assert.equal(deleteTeacherAnnouncement({ id: changed.announcement.id, courseId: db, identity: teacher, storage: local }).deleted, false);
assert.equal(getTeacherCourseAnnouncements({ courseId: db, identity: student, storage: local }).allowed, false);
console.log("TEACHER_ANNOUNCEMENT_PERSISTENCE_OK"); console.log("TEACHER_ANNOUNCEMENT_COURSE_ISOLATION_OK"); console.log("TEACHER_ANNOUNCEMENT_ROLE_ISOLATION_OK");

local.setItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY, "{bad");
assert.equal(getTeacherCourseAnnouncements({ courseId: db, identity: teacher, storage: local }).announcements.length, 0);
assert.equal(local.getItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY), null);
assert.equal(createTeacherAnnouncement({ courseId: db, title: "x", content: "y", identity: teacher, storage: { getItem() { return null; }, setItem() { throw new Error("blocked"); } } }).created, false);
console.log("TEACHER_ANNOUNCEMENT_CORRUPT_DATA_RECOVERY_OK"); console.log("teacher-announcement.test.js: OK");
