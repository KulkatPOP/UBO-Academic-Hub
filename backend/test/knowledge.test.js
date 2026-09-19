import assert from "node:assert/strict";
import test from "node:test";
import { getKnowledgeByCourse, searchKnowledgeForStudent } from "../src/services/knowledge-service.js";
import { getMaterialsByCourseForStudent } from "../src/services/material-service.js";

const users = new Map([
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }]
]);
const course = { id: "course-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" };
const privateCourse = { id: "course-private-id", external_course_id: "course-private-2026-1", name: "Álgebra", code: "MAT-101", teacher_reference: "teacher-id", description: "Demo" };
const knowledgeRows = [{ id: "kb-db-1", title: "Claves primarias", content: "Una clave primaria identifica de manera única un registro.", topic: "Clave primaria", keywords: ["clave primaria", "registro"], material_title: "Modelo relacional" }];
const materialRows = [{ id: "material-db-1", course_id: "course-db-id", external_course_id: "course-db-2026-1", title: "Modelo relacional", content: "Contenido", topic: "Modelo", keywords: ["modelo"], created_at: "2026-09-01T00:00:00.000Z" }];

function query(sql, values = []) {
  if (/SELECT id, name, role\s+FROM users_reference/.test(sql)) {
    const user = users.get(values[0]);
    return Promise.resolve({ rows: user ? [{ ...user, password_demo: "never" }] : [] });
  }
  if (/course_identity_mapping/.test(sql)) {
    const value = values[0];
    const found = value === "db" || value === "database" || value === course.id || value === course.external_course_id ? course : value === privateCourse.id || value === privateCourse.external_course_id ? privateCourse : null;
    return Promise.resolve({ rows: found ? [{ ...found, lms_course_id: found.id, legacy_course_id: found === course ? (value === "database" ? "database" : "db") : null, mapped_external_course_id: found.external_course_id }] : [] });
  }
  if (/FROM lms_courses\s+WHERE id::text/.test(sql)) {
    const found = [course, privateCourse].find(item => item.id === values[0] || item.external_course_id === values[0]);
    return Promise.resolve({ rows: found ? [{ ...found }] : [] });
  }
  if (/INNER JOIN lms_course_members/.test(sql)) {
    return Promise.resolve({ rows: values[0] === "student-id" ? [{ ...course }] : [] });
  }
  if (/FROM knowledge_base/.test(sql)) return Promise.resolve({ rows: values[0] === course.id ? knowledgeRows.map(row => ({ ...row })) : [] });
  if (/FROM learning_materials/.test(sql)) return Promise.resolve({ rows: values[0] === course.id ? materialRows.map(row => ({ ...row })) : [] });
  throw new Error(`Consulta no cubierta: ${sql}`);
}

test("recupera conocimiento y material solamente del curso autorizado", async () => {
  const found = await searchKnowledgeForStudent("student-id", "¿Qué es una clave primaria?", "db", { databaseQuery: query });
  assert.equal(found.authorized, true);
  assert.equal(found.knowledge.length, 1);
  assert.equal(found.knowledge[0].source, "Modelo relacional");
  assert.equal(Object.hasOwn(found.knowledge[0], "password_demo"), false);

  const materials = await getMaterialsByCourseForStudent("student-id", "db", { query });
  assert.equal(materials.authorized, true);
  assert.equal(materials.materials[0].title, "Modelo relacional");
});

test("rechaza cursos no autorizados, estudiantes inexistentes y fuentes sin resultados", async () => {
  const foreignCourse = await searchKnowledgeForStudent("student-id", "álgebra", "course-private-2026-1", { databaseQuery: query });
  assert.deepEqual(foreignCourse, { authorized: false, code: "COURSE_ACCESS_DENIED", course: null, knowledge: [] });
  const nonStudent = await getKnowledgeByCourse("teacher-id", "course-db-2026-1", { databaseQuery: query });
  assert.equal(nonStudent.code, "STUDENT_ROLE_REQUIRED");
  const missingStudent = await getKnowledgeByCourse("missing-id", "course-db-2026-1", { databaseQuery: query });
  assert.equal(missingStudent.code, "STUDENT_NOT_FOUND");
  const noSource = await searchKnowledgeForStudent("student-id", "astronomía", "course-db-2026-1", { databaseQuery: query });
  assert.equal(noSource.authorized, true);
  assert.deepEqual(noSource.knowledge, []);
});
