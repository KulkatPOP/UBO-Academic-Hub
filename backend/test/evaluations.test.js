import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["teacher-id", { id: "teacher-id", external_id: "teacher-demo-001", name: "Carlos Pérez", role: "TEACHER" }],
  ["teacher-other-id", { id: "teacher-other-id", external_id: "teacher-demo-002", name: "Otra profesora", role: "TEACHER" }],
  ["student-id", { id: "student-id", external_id: "student-demo-001", name: "Sofía Martínez", role: "STUDENT" }],
  ["student-other-id", { id: "student-other-id", external_id: "student-demo-002", name: "Otro estudiante", role: "STUDENT" }],
  ["admin-id", { id: "admin-id", external_id: "admin-demo-001", name: "Administrador UBO", role: "ADMIN" }]
]);
const databaseCourse = { id: "course-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" };
const privateCourse = { id: "course-private-id", external_course_id: "course-private-2026-1", name: "Curso privado", code: "PRV-001", teacher_reference: "teacher-other-id", description: "Demo" };

function installFixture() {
  const originalQuery = databasePool.query;
  const evaluations = [];
  const questions = [];
  const submissions = [];
  databasePool.query = async (sql, values = []) => {
    if (/SELECT id, name, role\s+FROM users_reference/.test(sql)) {
      const value = users.get(values[0]);
      return { rows: value ? [{ id: value.id, name: value.name, role: value.role }] : [] };
    }
    if (/SELECT external_id\s+FROM users_reference/.test(sql)) {
      const value = users.get(values[0]);
      return { rows: value?.role === "STUDENT" ? [{ external_id: value.external_id }] : [] };
    }
    if (/FROM lms_courses\s+WHERE id::text/.test(sql)) {
      const value = [databaseCourse, privateCourse].find(item => item.id === values[0] || item.external_course_id === values[0]);
      return { rows: value ? [{ ...value }] : [] };
    }
    if (/FROM lms_courses c\s+INNER JOIN lms_course_members/.test(sql)) {
      return { rows: values[0] === "student-id" ? [{ ...databaseCourse }] : values[0] === "student-other-id" ? [{ ...privateCourse }] : [] };
    }
    if (/INSERT INTO lms_evaluations/.test(sql)) {
      const item = { id: `evaluation-${evaluations.length + 1}`, course_id: values[1], teacher_reference: values[2], title: values[3], description: values[4], status: "DRAFT", due_at: values[5], published_at: null };
      evaluations.push(item);
      return { rows: [{ ...item }] };
    }
    if (/INSERT INTO evaluation_questions/.test(sql)) {
      const item = { id: `question-${questions.length + 1}`, evaluation_id: values[0], question_type: values[2], prompt: values[3], options: JSON.parse(values[4]), correct_answer: JSON.parse(values[5]), points: values[6], topic: values[7] };
      questions.push(item);
      return { rows: [] };
    }
    if (/FROM lms_evaluations e\s+INNER JOIN lms_courses c/.test(sql) && /WHERE e.id::text/.test(sql)) {
      const item = evaluations.find(value => value.id === values[0]);
      const course = [databaseCourse, privateCourse].find(value => value.id === item?.course_id);
      return { rows: item ? [{ ...item, course_name: course.name }] : [] };
    }
    if (/FROM lms_evaluations e\s+INNER JOIN lms_courses c/.test(sql) && /m.student_reference/.test(sql)) {
      return { rows: evaluations.filter(item => item.status === "PUBLISHED" && item.course_id === databaseCourse.id).map(item => ({ ...item, course_name: databaseCourse.name })) };
    }
    if (/FROM lms_evaluations e\s+INNER JOIN lms_courses c/.test(sql) && /ORDER BY e.created_at/.test(sql) && !/WHERE e.teacher_reference/.test(sql)) {
      return { rows: evaluations.map(item => ({ ...item, course_name: item.course_id === databaseCourse.id ? databaseCourse.name : privateCourse.name })) };
    }
    if (/FROM lms_evaluations e\s+INNER JOIN lms_courses c/.test(sql) && /e.teacher_reference/.test(sql)) {
      return { rows: evaluations.filter(item => item.teacher_reference === values[0]).map(item => ({ ...item, course_name: item.course_id === databaseCourse.id ? databaseCourse.name : privateCourse.name })) };
    }
    if (/FROM evaluation_questions/.test(sql)) return { rows: questions.filter(item => item.evaluation_id === values[0]).map(item => ({ ...item })) };
    if (/UPDATE lms_evaluations SET status='PUBLISHED'/.test(sql)) {
      const item = evaluations.find(value => value.id === values[0]);
      item.status = "PUBLISHED";
      item.published_at = "2026-12-01T10:00:00.000Z";
      return { rows: [{ ...item }] };
    }
    if (/INSERT INTO lms_submissions/.test(sql)) {
      if (submissions.some(item => item.evaluation_id === values[0] && item.student_reference === values[1])) { const error = new Error("duplicate"); error.code = "23505"; throw error; }
      const item = { id: `submission-${submissions.length + 1}`, evaluation_id: values[0], student_reference: values[1], answer: JSON.parse(values[2]), submitted_at: "2026-12-01T11:00:00.000Z", status: values[3], score: values[4], auto_grade: JSON.parse(values[5]), feedback: "", reviewed_at: null };
      submissions.push(item);
      return { rows: [{ ...item }] };
    }
    if (/FROM lms_submissions WHERE evaluation_id/.test(sql)) {
      return { rows: submissions.filter(item => item.evaluation_id === values[0] && item.student_reference === values[1]).map(item => ({ ...item })) };
    }
    if (/FROM lms_submissions s\s+WHERE s.evaluation_id/.test(sql)) return { rows: submissions.filter(item => item.evaluation_id === values[0]).map(item => ({ ...item })) };
    if (/FROM lms_submissions s\s+INNER JOIN lms_evaluations/.test(sql)) {
      const item = submissions.find(value => value.id === values[0]);
      const evaluation = evaluations.find(value => value.id === item?.evaluation_id);
      return { rows: item ? [{ ...item, teacher_reference: evaluation.teacher_reference }] : [] };
    }
    if (/UPDATE lms_submissions SET score/.test(sql)) {
      const item = submissions.find(value => value.id === values[0]);
      Object.assign(item, { score: values[1], feedback: values[2], status: "GRADED", reviewed_at: "2026-12-01T12:00:00.000Z" });
      return { rows: [{ ...item }] };
    }
    throw new Error(`Consulta no cubierta: ${sql}`);
  };
  return { evaluations, submissions, restore: () => { databasePool.query = originalQuery; } };
}

async function withApi(run) {
  const fixture = installFixture();
  const server = createServer(createApp());
  await new Promise(resolve => server.listen(0, resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`, fixture); }
  finally { await new Promise(resolve => server.close(resolve)); fixture.restore(); }
}

const futureDate = "2027-12-31T23:59:59.000Z";
const payload = () => ({ courseId: "course-db-2026-1", title: "Prueba de normalización", description: "LMS DEMO", dueAt: futureDate, questions: [{ type: "MULTIPLE_CHOICE", prompt: "¿Qué reduce la redundancia?", options: ["Normalización", "Duplicación"], correctAnswer: 0, points: 1, topic: "Normalización" }, { type: "SHORT_ANSWER", prompt: "Explica 3FN", points: 1, topic: "Normalización" }] });

test("el profesor crea y publica una evaluación LMS; el estudiante inscrito la consulta", async () => {
  await withApi(async url => {
    const created = await fetch(`${url}/api/evaluations`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "teacher-id" }, body: JSON.stringify(payload()) });
    const createdBody = await created.json();
    assert.equal(created.status, 201);
    assert.equal(createdBody.evaluation.status, "DRAFT");
    assert.equal(createdBody.evaluation.questions[0].correctAnswer, 0);
    const published = await fetch(`${url}/api/evaluations/${createdBody.evaluation.id}/publish`, { method: "POST", headers: { "x-user-id": "teacher-id" } });
    assert.equal(published.status, 200);
    const studentList = await fetch(`${url}/api/evaluations`, { headers: { "x-user-id": "student-id" } });
    const list = await studentList.json();
    assert.equal(list.evaluations.length, 1);
    assert.equal(Object.hasOwn(list.evaluations[0].questions[0], "correctAnswer"), false);
    const adminList = await fetch(`${url}/api/evaluations`, { headers: { "x-user-id": "admin-id" } });
    assert.equal((await adminList.json()).evaluations.length, 1);
  });
});

test("la entrega LMS respeta inscripción, vencimiento, duplicados y revisión manual", async () => {
  await withApi(async (url, fixture) => {
    const created = await fetch(`${url}/api/evaluations`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "teacher-id" }, body: JSON.stringify(payload()) });
    const evaluation = (await created.json()).evaluation;
    await fetch(`${url}/api/evaluations/${evaluation.id}/publish`, { method: "POST", headers: { "x-user-id": "teacher-id" } });
    const answers = { [evaluation.questions[0].id]: 0, [evaluation.questions[1].id]: "Respuesta DEMO" };
    const submitted = await fetch(`${url}/api/evaluations/${evaluation.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id" }, body: JSON.stringify({ answers }) });
    const submission = (await submitted.json()).submission;
    assert.equal(submitted.status, 201);
    assert.equal(submission.status, "SUBMITTED");
    assert.equal(submission.score, null);
    const duplicate = await fetch(`${url}/api/evaluations/${evaluation.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id" }, body: JSON.stringify({ answers }) });
    assert.equal(duplicate.status, 409);
    const otherStudent = await fetch(`${url}/api/evaluations/${evaluation.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-other-id" }, body: JSON.stringify({ answers }) });
    assert.equal(otherStudent.status, 403);
    const graded = await fetch(`${url}/api/submissions/${submission.id}/grade`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "teacher-id" }, body: JSON.stringify({ score: 6.5, feedback: "Buen trabajo" }) });
    assert.equal((await graded.json()).submission.score, 6.5);
    const invalid = await fetch(`${url}/api/submissions/${submission.id}/grade`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "teacher-id" }, body: JSON.stringify({ score: 8 }) });
    assert.equal(invalid.status, 400);
    const foreignTeacher = await fetch(`${url}/api/submissions/${submission.id}/grade`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "teacher-other-id" }, body: JSON.stringify({ score: 6 }) });
    assert.equal(foreignTeacher.status, 403);
    fixture.evaluations[0].due_at = "2020-01-01T00:00:00.000Z";
    const expired = await fetch(`${url}/api/evaluations/${evaluation.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id" }, body: JSON.stringify({ answers }) });
    assert.equal(expired.status, 409);
  });
});

test("rechaza curso ajeno, solicitudes sin contexto y no escribe calificaciones oficiales", async () => {
  await withApi(async (url, fixture) => {
    const denied = await fetch(`${url}/api/evaluations`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "student-id" }, body: JSON.stringify(payload()) });
    assert.equal(denied.status, 403);
    const missingContext = await fetch(`${url}/api/evaluations`);
    assert.equal(missingContext.status, 401);
    assert.equal(fixture.submissions.length, 0);
    assert.equal(Object.keys(fixture).includes("officialGrades"), false);
  });
});
