import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }]
]);
const course = { id: "course-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" };
const privateCourse = { id: "course-private-id", external_course_id: "course-private-2026-1", name: "Curso privado", code: "PRV-001", teacher_reference: "other-teacher-id", description: "Demo" };
const materials = [{ id: "material-db-id", lms_course_id: course.id, course_id: course.id, external_course_id: course.external_course_id, title: "Modelo relacional", content: "Contenido DEMO", topic: "Modelo", keywords: ["modelo"], created_at: "2026-09-01T00:00:00.000Z" }];

function installFixtureQuery() {
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/FROM users_reference/.test(sql) && !/lms_course_members/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ ...user, password_demo: "never" }] : [] };
    }
    if (/FROM lms_courses\s+WHERE id::text/.test(sql)) {
      const found = [course, privateCourse].find(item => values[0] === item.id || values[0] === item.external_course_id) || null;
      return { rows: found ? [{ ...found }] : [] };
    }
    if (/INNER JOIN lms_course_members/.test(sql)) {
      return { rows: values[0] === "student-id" ? [{ ...course }] : [] };
    }
    if (/FROM learning_materials/.test(sql)) {
      if (/WHERE m.id::text/.test(sql)) return { rows: values[0] === "material-db-id" ? [{ ...materials[0] }] : [] };
      return { rows: (values[0] === course.id || values[0] === course.external_course_id) ? materials.map(material => ({ ...material })) : [] };
    }
    throw new Error(`Consulta de fixture no cubierta: ${sql}`);
  };
  return () => { databasePool.query = originalQuery; };
}

async function withApi(run) {
  const restore = installFixtureQuery();
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); restore(); }
}

test("devuelve sólo materiales del curso autorizado y sin credenciales", async () => {
  await withApi(async url => {
    const response = await fetch(`${url}/api/courses/course-db-2026-1/materials`, { headers: { "x-user-id": "student-id" } });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.materials.length, 1);
    assert.equal(body.materials[0].externalCourseId, "course-db-2026-1");
    assert.equal(Object.hasOwn(body.materials[0], "password_demo"), false);

    const detail = await fetch(`${url}/api/materials/material-db-id`, { headers: { "x-user-id": "teacher-id" } });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).material.id, "material-db-id");
  });
});

test("controla curso y material inexistentes sin filtrar contenido", async () => {
  await withApi(async url => {
    const missingCourse = await fetch(`${url}/api/courses/not-found/materials`, { headers: { "x-user-id": "student-id" } });
    assert.equal(missingCourse.status, 404);
    const missingMaterial = await fetch(`${url}/api/materials/not-found`, { headers: { "x-user-id": "student-id" } });
    assert.equal(missingMaterial.status, 404);
    const foreignCourse = await fetch(`${url}/api/courses/course-private-2026-1/materials`, { headers: { "x-user-id": "student-id" } });
    assert.equal(foreignCourse.status, 403);
  });
});
