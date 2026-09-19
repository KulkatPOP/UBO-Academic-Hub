import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";
import { getRecommendationById } from "../src/services/recommendation-service.js";

const users = new Map([
  ["student-id", { id: "student-id", external_id: "student-demo-001", name: "Sofía Martínez", role: "STUDENT" }],
  ["student-other-id", { id: "student-other-id", external_id: "student-demo-002", name: "Otro Estudiante", role: "STUDENT" }],
  ["student-empty-id", { id: "student-empty-id", external_id: "student-demo-empty", name: "Sin Recursos", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", external_id: "teacher-demo-001", name: "Carlos Pérez", role: "TEACHER" }]
]);
const dbCourse = { id: "course-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", teacher_reference: "teacher-id", description: "Demo" };
const privateCourse = { id: "course-private-id", external_course_id: "course-private-2026-1", name: "Curso privado", code: "PRV-001", teacher_reference: "teacher-id", description: "Demo" };
const materials = [{ id: "material-db-id", course_id: dbCourse.id, external_course_id: dbCourse.external_course_id, title: "Modelo relacional", content: "Contenido DEMO", topic: "Modelo relacional", keywords: ["modelo"], created_at: "2026-09-01T00:00:00.000Z" }];
const officialSnapshot = Object.freeze({ grades: [{ value: 6.1 }], attendance: [{ percentage: 94 }], enrollments: [dbCourse.id] });

function installFixtureQuery() {
  const records = [];
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/SELECT id, name, role\s+FROM users_reference/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ id: user.id, name: user.name, role: user.role }] : [] };
    }
    if (/SELECT external_id\s+FROM users_reference/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user?.role === "STUDENT" ? [{ external_id: user.external_id }] : [] };
    }
    if (/FROM lms_courses c\s+INNER JOIN lms_course_members/.test(sql)) {
      return { rows: values[0] === "student-id" ? [{ ...dbCourse }] : values[0] === "student-other-id" ? [{ ...privateCourse }] : [] };
    }
    if (/FROM learning_materials m\s+INNER JOIN lms_courses/.test(sql)) {
      return { rows: values[0] === dbCourse.id ? materials.map(item => ({ ...item })) : [] };
    }
    if (/INSERT INTO recommendations/.test(sql)) {
      const [studentReference, courseId, title, description, reason, resourceReference] = values;
      const existing = records.find(item => item.student_reference === studentReference && item.course_id === courseId && item.resource_reference === resourceReference);
      const record = existing || { id: `recommendation-${records.length + 1}` };
      Object.assign(record, { student_reference: studentReference, course_id: courseId, type: "AVAILABLE_RESOURCE", title, description, priority: "LOW", reason, resource_reference: resourceReference, created_at: "2026-09-15T00:00:00.000Z", expires_at: null });
      if (!existing) records.push(record);
      return { rows: [{ ...record }] };
    }
    if (/FROM recommendations r/.test(sql)) {
      const studentReference = values[0];
      const id = values[1] || null;
      return { rows: records.filter(item => item.student_reference === studentReference && (!id || item.id === id)).map(item => ({ ...item, course_name: item.course_id === dbCourse.id ? dbCourse.name : privateCourse.name, resource_title: item.resource_reference === "material-db-id" ? "Modelo relacional" : null })) };
    }
    throw new Error(`Consulta no cubierta: ${sql}`);
  };
  return { restore: () => { databasePool.query = originalQuery; }, records };
}

async function withApi(run) {
  const fixture = installFixtureQuery();
  const server = createServer(createApp());
  await new Promise(resolve => server.listen(0, resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`, fixture); }
  finally { await new Promise(resolve => server.close(resolve)); fixture.restore(); }
}

test("genera y devuelve sólo recomendaciones derivadas de recursos LMS propios", async () => {
  await withApi(async (url, fixture) => {
    const headers = { "x-user-id": "student-id" };
    const generated = await fetch(`${url}/api/recommendations/generate?studentId=student-other-id`, { method: "POST", headers });
    const body = await generated.json();
    assert.equal(generated.status, 200);
    assert.equal(body.generated, true);
    assert.equal(body.dataSufficient, true);
    assert.equal(body.recommendations.length, 1);
    assert.equal(body.recommendations[0].courseId, dbCourse.id);
    assert.equal(body.recommendations[0].resourceReference, "material-db-id");
    assert.doesNotMatch(JSON.stringify(body), /password_demo/);
    assert.equal(fixture.records.every(item => item.student_reference === "student-demo-001"), true);

    const own = await fetch(`${url}/api/recommendations?studentId=student-other-id`, { headers });
    const ownBody = await own.json();
    assert.equal(ownBody.recommendations.length, 1);
    assert.equal(ownBody.recommendations[0].courseName, "Bases de Datos");
    assert.deepEqual(officialSnapshot, { grades: [{ value: 6.1 }], attendance: [{ percentage: 94 }], enrollments: [dbCourse.id] });
  });
});

test("aísla otros usuarios, cursos no autorizados y ausencia de datos LMS", async () => {
  await withApi(async (url) => {
    const teacher = await fetch(`${url}/api/recommendations`, { headers: { "x-user-id": "teacher-id" } });
    assert.equal(teacher.status, 403);
    const other = await fetch(`${url}/api/recommendations/generate`, { method: "POST", headers: { "x-user-id": "student-other-id" } });
    const otherBody = await other.json();
    assert.equal(otherBody.generated, false);
    assert.equal(otherBody.recommendations.length, 0);
    const missingData = await fetch(`${url}/api/recommendations/generate`, { method: "POST", headers: { "x-user-id": "student-empty-id" } });
    const missingBody = await missingData.json();
    assert.equal(missingBody.dataSufficient, false);
    assert.equal(missingBody.recommendations.length, 0);
    const missingUser = await fetch(`${url}/api/recommendations`, { headers: { "x-user-id": "missing" } });
    assert.equal(missingUser.status, 404);
  });
});

test("getRecommendationById no permite leer un registro ajeno", async () => {
  const fixture = installFixtureQuery();
  try {
    await databasePool.query("INSERT INTO recommendations", ["student-demo-001", dbCourse.id, "Título", "Descripción", "Motivo", "material-db-id"]);
    const own = await getRecommendationById("student-id", "recommendation-1");
    const foreign = await getRecommendationById("student-other-id", "recommendation-1");
    assert.equal(own.recommendation?.id, "recommendation-1");
    assert.equal(foreign.recommendation, null);
  } finally {
    fixture.restore();
  }
});
