import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }],
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }]
]);
const courses = [
  { id: "course-own-id", external_course_id: "course-own", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Curso LMS" },
  { id: "course-other-id", external_course_id: "course-other", name: "Curso ajeno", code: "INF-999", teacher_reference: "other-teacher-id", description: "Aislado" }
];

function installFixtureQuery() {
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/FROM users_reference/.test(sql) && !/lms_course_members/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ ...user, password_demo: "not-exposed" }] : [] };
    }
    if (/FROM lms_courses\s+WHERE id::text/.test(sql)) {
      const course = courses.find(item => item.id === values[0] || item.external_course_id === values[0]);
      return { rows: course ? [{ ...course }] : [] };
    }
    if (/FROM lms_course_members m/.test(sql) && /INNER JOIN users_reference/.test(sql)) {
      return { rows: values[0] === "course-own-id" ? [{ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }] : [] };
    }
    if (/WHERE teacher_reference = \$1/.test(sql)) {
      return { rows: courses.filter(course => course.teacher_reference === values[0]) };
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

test("el docente obtiene solamente sus cursos y estudiantes públicos, ignorando spoofing", async () => {
  await withApi(async url => {
    const coursesResponse = await fetch(`${url}/api/courses?teacherId=student-id&role=ADMIN`, {
      headers: { "x-user-id": "teacher-id", "x-role": "STUDENT" }
    });
    assert.equal(coursesResponse.status, 200);
    assert.deepEqual((await coursesResponse.json()).courses.map(course => course.id), ["course-own-id"]);

    const studentsResponse = await fetch(`${url}/api/courses/course-own/students?teacherId=student-id&role=ADMIN`, {
      headers: { "x-user-id": "teacher-id" }
    });
    assert.equal(studentsResponse.status, 200);
    const body = await studentsResponse.json();
    assert.deepEqual(body.students, [{ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }]);
    assert.equal(JSON.stringify(body).includes("password_demo"), false);
  });
});

test("protege estudiantes del curso ante Student y docente sin ownership", async () => {
  await withApi(async url => {
    const studentResponse = await fetch(`${url}/api/courses/course-own/students`, { headers: { "x-user-id": "student-id" } });
    assert.equal(studentResponse.status, 403);
    const foreignResponse = await fetch(`${url}/api/courses/course-other/students`, { headers: { "x-user-id": "teacher-id" } });
    assert.equal(foreignResponse.status, 403);
    const missingResponse = await fetch(`${url}/api/courses/missing/students`, { headers: { "x-user-id": "teacher-id" } });
    assert.equal(missingResponse.status, 404);
  });
});
