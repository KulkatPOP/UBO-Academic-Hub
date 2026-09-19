import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }],
  ["admin-id", { id: "admin-id", name: "Administrador UBO", role: "ADMIN" }]
]);
const courses = [
  { id: "course-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" },
  { id: "course-algebra-id", external_course_id: "course-algebra-2026-1", name: "Álgebra", code: "MAT-101", teacher_reference: "teacher-id", description: "Demo" },
  { id: "course-private-id", external_course_id: "course-private-2026-1", name: "Curso privado", code: "PRV-001", teacher_reference: "other-teacher-id", description: "Demo" }
];
const memberships = new Map([["student-id", new Set(["course-db-id", "course-algebra-id"])] ]);

function courseFor(value) {
  return courses.find(course => course.id === value || course.external_course_id === value) || null;
}

function installFixtureQuery() {
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/FROM users_reference/.test(sql) && !/lms_course_members/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ ...user, password_demo: "never" }] : [] };
    }
    if (/INNER JOIN lms_course_members/.test(sql)) {
      return { rows: courses.filter(course => memberships.get(values[0])?.has(course.id)).map(course => ({ ...course })) };
    }
    if (/WHERE teacher_reference = \$1/.test(sql)) {
      return { rows: courses.filter(course => course.teacher_reference === values[0]).map(course => ({ ...course })) };
    }
    if (/FROM lms_courses\s+WHERE id::text/.test(sql)) {
      const course = courseFor(values[0]);
      return { rows: course ? [{ ...course }] : [] };
    }
    if (/FROM lms_courses ORDER BY name/.test(sql)) return { rows: courses.map(course => ({ ...course })) };
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

test("aplica aislamiento de cursos por rol resuelto desde users_reference", async () => {
  await withApi(async url => {
    const studentList = await fetch(`${url}/api/courses`, { headers: { "x-user-id": "student-id", "x-role": "ADMIN" } });
    assert.equal(studentList.status, 200);
    assert.deepEqual((await studentList.json()).courses.map(course => course.id), ["course-db-id", "course-algebra-id"]);

    const teacherList = await fetch(`${url}/api/courses`, { headers: { "x-user-id": "teacher-id" } });
    assert.equal(teacherList.status, 200);
    assert.deepEqual((await teacherList.json()).courses.map(course => course.id), ["course-db-id", "course-algebra-id"]);

    const adminList = await fetch(`${url}/api/courses`, { headers: { "x-user-id": "admin-id" } });
    assert.equal(adminList.status, 200);
    assert.equal((await adminList.json()).courses.length, 3);
  });
});

test("rechaza cursos ajenos, usuario inexistente y contexto ausente", async () => {
  await withApi(async url => {
    const studentForeign = await fetch(`${url}/api/courses/course-private-2026-1`, { headers: { "x-user-id": "student-id" } });
    assert.equal(studentForeign.status, 403);
    const teacherForeign = await fetch(`${url}/api/courses/course-private-2026-1`, { headers: { "x-user-id": "teacher-id" } });
    assert.equal(teacherForeign.status, 403);
    const unknownUser = await fetch(`${url}/api/courses`, { headers: { "x-user-id": "missing-id" } });
    assert.equal(unknownUser.status, 404);
    const noContext = await fetch(`${url}/api/courses`);
    assert.equal(noContext.status, 401);
    const missingCourse = await fetch(`${url}/api/courses/not-found`, { headers: { "x-user-id": "admin-id" } });
    assert.equal(missingCourse.status, 404);
  });
});
