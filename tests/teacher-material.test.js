import assert from "node:assert/strict";
import {
  TEACHER_MATERIAL_STORAGE_KEY,
  createTeacherMaterial,
  deleteTeacherMaterial,
  getTeacherCourseMaterials,
  validateTeacherMaterial
} from "../services/teacher-actions/teacher-material-management-service.js";
import { demoUsers } from "../data/users.js";

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
const storage = new MemoryStorage();
const dbCourse = "course-db-2026-1";
const iotCourse = "course-iot-2026-1";

assert.equal(validateTeacherMaterial({ courseId: dbCourse, identity: teacher, title: "", type: "DOCUMENTO" }).valid, false);
assert.equal(validateTeacherMaterial({ courseId: dbCourse, identity: student, title: "Guía", type: "GUÍA" }).valid, false);
assert.equal(validateTeacherMaterial({ courseId: dbCourse, identity: admin, title: "Guía", type: "GUÍA" }).valid, false);
assert.equal(validateTeacherMaterial({ courseId: "missing", identity: teacher, title: "Guía", type: "GUÍA" }).valid, false);
assert.equal(validateTeacherMaterial({ courseId: dbCourse, identity: teacher, title: "x".repeat(121), type: "GUÍA" }).valid, false);
console.log("TEACHER_MATERIAL_VALIDATION_OK");

assert.equal(createTeacherMaterial({
  courseId: dbCourse, identity: teacher, title: "Sin almacenamiento", type: "DOCUMENTO", storage: null
}).created, false);
console.log("TEACHER_MATERIAL_STORAGE_UNAVAILABLE_CONTROLLED_OK");

const created = createTeacherMaterial({
  courseId: dbCourse,
  identity: teacher,
  title: "Guía de consultas",
  description: "Práctica para la unidad SQL.",
  type: "GUÍA",
  storage,
  now: "2026-09-09T10:00:00.000Z"
});
assert.equal(created.created, true);
assert.equal(created.material.courseId, dbCourse);
assert.equal(created.material.teacherId, teacher.id);
assert.equal(created.material.type, "GUÍA");
console.log("TEACHER_MATERIAL_CREATION_OK");

const dbMaterials = getTeacherCourseMaterials({ courseId: dbCourse, identity: teacher, storage });
assert.equal(dbMaterials.allowed, true);
assert.equal(dbMaterials.materials.length, 1);
dbMaterials.materials[0].title = "Mutado";
assert.equal(getTeacherCourseMaterials({ courseId: dbCourse, identity: teacher, storage }).materials[0].title, "Guía de consultas");
assert.equal(getTeacherCourseMaterials({ courseId: iotCourse, identity: teacher, storage }).materials.length, 0);
console.log("TEACHER_MATERIAL_PERSISTENCE_OK");
console.log("TEACHER_MATERIAL_COURSE_ISOLATION_OK");

assert.equal(getTeacherCourseMaterials({ courseId: dbCourse, identity: student, storage }).allowed, false);
assert.equal(getTeacherCourseMaterials({ courseId: dbCourse, identity: admin, storage }).allowed, false);
console.log("TEACHER_MATERIAL_ROLE_ISOLATION_OK");

storage.setItem(TEACHER_MATERIAL_STORAGE_KEY, "{corrupt");
assert.equal(getTeacherCourseMaterials({ courseId: dbCourse, identity: teacher, storage }).materials.length, 0);
assert.equal(storage.getItem(TEACHER_MATERIAL_STORAGE_KEY), null);
console.log("TEACHER_MATERIAL_CORRUPT_DATA_RECOVERY_OK");

const removable = createTeacherMaterial({
  courseId: dbCourse,
  identity: teacher,
  title: "Presentación de repaso",
  description: "",
  type: "PRESENTACIÓN",
  storage,
  now: "2026-09-09T10:01:00.000Z"
});
assert.equal(removable.created, true);
assert.equal(deleteTeacherMaterial({ courseId: dbCourse, materialId: removable.material.id, identity: teacher, storage }).deleted, true);
assert.equal(deleteTeacherMaterial({ courseId: dbCourse, materialId: removable.material.id, identity: teacher, storage }).deleted, false);
console.log("TEACHER_MATERIAL_DELETION_OK");
console.log("teacher-material.test.js: OK");
