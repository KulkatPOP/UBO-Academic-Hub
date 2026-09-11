import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTeacherMaterial, deleteTeacherMaterial, TEACHER_MATERIAL_STORAGE_KEY } from "../services/teacher-actions/teacher-material-management-service.js";
import { getStudentMaterials } from "../services/student-actions/student-material-service.js";

function storage() { const values = new Map(); return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }
const local = storage(), teacher = { id: "teacher-carlos-perez", role: "TEACHER" }, sofia = "student-sofia-martinez";
const older = createTeacherMaterial({ courseId: "course-db-2026-1", title: "Guía SQL", description: "Guía de práctica", type: "GUÍA", identity: teacher, storage: local, now: "2026-09-10T10:00:00.000Z" });
const newer = createTeacherMaterial({ courseId: "course-iot-2026-1", title: "<script>alert(1)</script>", description: "<img src=x onerror=alert(1)>", type: "DOCUMENTO", identity: teacher, storage: local, now: "2026-09-12T10:00:00.000Z" });
assert.equal(older.created, true); assert.equal(newer.created, true);
let result = getStudentMaterials({ studentId: sofia, storage: local });
assert.equal(result.available, true); assert.equal(result.materials.length, 2); assert.equal(result.materials[0].id, newer.material.id); assert.equal(result.materials[0].courseName, "Programación IoT"); assert.equal(result.materials[0].title, "<script>alert(1)</script>"); assert.equal(result.materials[0].description, "<img src=x onerror=alert(1)>");
assert.equal(getStudentMaterials({ studentId: sofia, courseId: "course-db-2026-1", storage: local }).materials.length, 1); assert.equal(getStudentMaterials({ studentId: sofia, courseId: "missing", storage: local }).available, false);
console.log("STUDENT_MATERIAL_OK"); console.log("STUDENT_MATERIAL_COURSE_ISOLATION_OK"); console.log("STUDENT_MATERIAL_XSS_SAFE");
result.materials[0].title = "alterado"; assert.equal(getStudentMaterials({ studentId: sofia, storage: local }).materials[0].title, "<script>alert(1)</script>");
assert.equal(typeof getStudentMaterials.createTeacherMaterial, "undefined"); assert.equal(typeof getStudentMaterials.deleteTeacherMaterial, "undefined"); console.log("STUDENT_MATERIAL_READ_ONLY_OK");
assert.equal(deleteTeacherMaterial({ courseId: "course-iot-2026-1", materialId: newer.material.id, identity: teacher, storage: local }).deleted, true); assert.equal(getStudentMaterials({ studentId: sofia, storage: local }).materials.length, 1); console.log("TEACHER_MATERIAL_REGRESSION_OK"); console.log("STUDENT_MATERIAL_PERSISTENCE_OK");
local.setItem(TEACHER_MATERIAL_STORAGE_KEY, "{broken"); assert.equal(getStudentMaterials({ studentId: sofia, storage: local }).materials.length, 0); assert.equal(local.getItem(TEACHER_MATERIAL_STORAGE_KEY), null);
const unavailable = getStudentMaterials({ studentId: sofia, storage: null }); assert.equal(unavailable.available, true); assert.ok(unavailable.warning);
assert.match(readFileSync(new URL("../app.js", import.meta.url), "utf8"), /function appendStudentMaterials[\s\S]*?\.textContent=item\.description/);
console.log("STUDENT_MATERIAL_CORRUPT_DATA_RECOVERY_OK"); console.log("student-material.test.js: OK");
