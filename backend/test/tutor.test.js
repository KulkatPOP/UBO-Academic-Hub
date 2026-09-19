import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["student-id", { id: "student-id", external_id: "student-demo-001", name: "Sofía Martínez", role: "STUDENT" }],
  ["student-other-id", { id: "student-other-id", external_id: "student-demo-002", name: "Otro Estudiante", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", external_id: "teacher-demo-001", name: "Carlos Pérez", role: "TEACHER" }]
]);
const course = { id: "course-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" };
const privateCourse = { id: "course-private-id", external_course_id: "course-private-2026-1", name: "Álgebra", code: "MAT-101", teacher_reference: "teacher-id", description: "Demo" };
const conversations = [{ id: "conversation-own", student_reference: "student-demo-001", question: "Pregunta propia", response: "Respuesta propia", sources: [], created_at: "2026-09-01T00:00:00.000Z" }, { id: "conversation-other", student_reference: "student-demo-002", question: "Pregunta ajena", response: "Respuesta ajena", sources: [], created_at: "2026-09-02T00:00:00.000Z" }];

function installFixtureQuery() {
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/SELECT id, name, role\s+FROM users_reference/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ id: user.id, name: user.name, role: user.role, password_demo: "never" }] : [] };
    }
    if (/SELECT id, external_id, role\s+FROM users_reference/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ id: user.id, external_id: user.external_id, role: user.role }] : [] };
    }
    if (/course_identity_mapping/.test(sql)) {
      const value = values[0];
      const found = value === "db" || value === "database" || value === course.id || value === course.external_course_id ? course : value === privateCourse.id || value === privateCourse.external_course_id ? privateCourse : null;
      return { rows: found ? [{ ...found, lms_course_id: found.id, legacy_course_id: found === course ? (value === "database" ? "database" : "db") : null, mapped_external_course_id: found.external_course_id }] : [] };
    }
    if (/FROM lms_courses\s+WHERE id::text/.test(sql)) {
      const found = [course, privateCourse].find(item => item.id === values[0] || item.external_course_id === values[0]);
      return { rows: found ? [{ ...found }] : [] };
    }
    if (/INNER JOIN lms_course_members/.test(sql)) return { rows: values[0] === "student-id" ? [{ ...course }] : [] };
    if (/FROM knowledge_base/.test(sql)) return { rows: values[0] === course.id ? [{ id: "kb-db-1", title: "Claves primarias", content: "Una clave primaria identifica un registro.", topic: "Clave primaria", keywords: ["clave primaria"], material_title: "Modelo relacional" }] : [] };
    if (/FROM learning_materials/.test(sql)) return { rows: values[0] === course.id ? [{ id: "material-db-1", course_id: course.id, external_course_id: course.external_course_id, title: "Modelo relacional", content: "Contenido", topic: "Modelo", keywords: ["modelo"], created_at: "2026-09-01T00:00:00.000Z" }] : [] };
    if (/INSERT INTO tutor_conversations/.test(sql)) {
      conversations.unshift({ id: "conversation-new", student_reference: values[0], question: values[1], response: values[2], sources: JSON.parse(values[3]), created_at: "2026-09-03T00:00:00.000Z" });
      return { rows: [{ id: "conversation-new" }] };
    }
    if (/FROM tutor_conversations/.test(sql)) return { rows: conversations.filter(item => item.student_reference === values[0]).map(item => ({ ...item })) };
    throw new Error(`Consulta no cubierta: ${sql}`);
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

test("resuelve el alias legacy db hacia LMS/RAG y persiste conversación sin credenciales", async () => {
  await withApi(async url => {
    const response = await fetch(`${url}/api/tutor/ask`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id", "x-role": "ADMIN" }, body: JSON.stringify({ query: "¿Qué es una clave primaria?", courseId: "db" }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.answer, /clave primaria/i);
    assert.equal(body.sources[0].source, "Modelo relacional");
    assert.equal(Object.hasOwn(body, "password_demo"), false);
  });
});

test("controla pregunta vacía, curso ajeno y rol no estudiante", async () => {
  await withApi(async url => {
    const empty = await fetch(`${url}/api/tutor/ask`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id" }, body: JSON.stringify({ query: "", courseId: "course-db-2026-1" }) });
    assert.equal(empty.status, 400);
    const foreign = await fetch(`${url}/api/tutor/ask`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id" }, body: JSON.stringify({ query: "álgebra", courseId: "course-private-2026-1" }) });
    assert.equal(foreign.status, 403);
    const teacher = await fetch(`${url}/api/tutor/ask`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "teacher-id" }, body: JSON.stringify({ query: "clave", courseId: "course-db-2026-1" }) });
    assert.equal(teacher.status, 403);
  });
});

test("el historial ignora userId externo y sólo entrega conversaciones propias", async () => {
  await withApi(async url => {
    const response = await fetch(`${url}/api/tutor/history?userId=student-other-id`, { headers: { "x-user-id": "student-id" } });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.history.every(item => item.id !== "conversation-other"));
    assert.ok(body.history.some(item => item.id === "conversation-own"));
  });
});
