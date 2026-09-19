import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["admin-id", { id: "admin-id", name: "Administrador UBO", role: "ADMIN" }],
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }]
]);

function installFixtureQuery() {
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/FROM users_reference/.test(sql) && !/COUNT\(\*\)/.test(sql)) {
      const user = users.get(values[0]);
      return { rows: user ? [{ ...user, password_demo: "must-not-leak" }] : [] };
    }
    if (/users_total/.test(sql)) {
      return { rows: [{
        users_total: 3, students_total: 1, teachers_total: 1, courses_total: 3, enrollments_total: 3,
        materials_total: 7, evaluations_total: 2, evaluations_published: 1, submissions_total: 2,
        submissions_reviewed: 1, attendance_sessions_total: 1, attendance_records_total: 1,
        messages_total: 2, notifications_unread_total: 1, activity_events_total: 2,
        tutor_queries_total: 1, recommendations_total: 1
      }] };
    }
    if (/GROUP BY event_type/.test(sql)) return { rows: [{ event_type: "TUTOR_QUERY", count: 2 }] };
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

test("entrega únicamente métricas LMS agregadas al administrador", async () => {
  await withApi(async url => {
    const response = await fetch(`${url}/api/analytics/admin/overview?role=STUDENT&userId=student-id`, {
      headers: { "x-user-id": "admin-id", "x-role": "STUDENT" }
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.source, "LMS");
    assert.equal(body.overview.users.total, 3);
    assert.equal(body.overview.users.students, 1);
    assert.equal(body.overview.courses.enrollments, 3);
    assert.equal(body.overview.evaluations.published, 1);
    assert.equal(body.overview.submissions.pending, 1);
    assert.deepEqual(body.overview.activity.eventTypes, [{ type: "TUTOR_QUERY", count: 2 }]);
    const serialized = JSON.stringify(body).toLowerCase();
    ["password", "token", "subject", "body", "answer"].forEach(secret => assert.equal(serialized.includes(secret), false));
  });
});

test("bloquea Student y Teacher aunque envíen role ADMIN o userId ajeno", async () => {
  await withApi(async url => {
    for (const userId of ["student-id", "teacher-id"]) {
      const response = await fetch(`${url}/api/analytics/admin/overview?role=ADMIN&userId=admin-id`, {
        headers: { "x-user-id": userId, "x-role": "ADMIN" }
      });
      assert.equal(response.status, 403);
    }
  });
});
