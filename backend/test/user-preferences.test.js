import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";
import { validateUserPreferencePatch } from "../src/services/user-preferences-service.js";

const users = new Map([
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }]
]);

async function withApi(run) {
  const originalQuery = databasePool.query;
  const preferences = new Map();
  databasePool.query = async (sql, params = []) => {
    if (sql.includes("FROM users_reference")) return { rows: users.has(params[0]) ? [{ ...users.get(params[0]) }] : [] };
    if (sql.includes("SELECT theme, language")) return { rows: preferences.has(params[0]) ? [{ ...preferences.get(params[0]) }] : [] };
    if (sql.includes("INSERT INTO user_preferences")) {
      const [id, theme, language, notificationsEnabled, emailNotifications, tutor, accessibility, learning] = params;
      const previous = preferences.get(id) || {};
      const row = {
        theme: theme ?? previous.theme ?? null,
        language: language ?? previous.language ?? null,
        notifications_enabled: notificationsEnabled ?? previous.notifications_enabled ?? null,
        email_notifications: emailNotifications ?? previous.email_notifications ?? null,
        tutor_preferences: tutor ? JSON.parse(tutor) : previous.tutor_preferences ?? null,
        accessibility_preferences: accessibility ? JSON.parse(accessibility) : previous.accessibility_preferences ?? null,
        learning_preferences: learning ? JSON.parse(learning) : previous.learning_preferences ?? null,
        updated_at: new Date().toISOString()
      };
      preferences.set(id, row);
      return { rows: [{ ...row }] };
    }
    throw new Error(`Consulta no esperada: ${sql}`);
  };
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`, preferences);
  } finally {
    await new Promise(resolve => server.close(resolve));
    databasePool.query = originalQuery;
  }
}

test("valida sólo campos permitidos y valores de preferencia seguros", () => {
  assert.equal(validateUserPreferencePatch({ theme: "dark" }).valid, true);
  assert.equal(validateUserPreferencePatch({ theme: "violet" }).code, "INVALID_THEME");
  assert.equal(validateUserPreferencePatch({ notificationsEnabled: "true" }).code, "INVALID_BOOLEAN");
  assert.equal(validateUserPreferencePatch({ role: "ADMIN" }).code, "PROTECTED_FIELD");
  assert.equal(validateUserPreferencePatch({ unknown: true }).code, "UNKNOWN_FIELD");
});

test("obtiene, actualiza y aísla preferencias por x-user-id sin credenciales", async () => {
  await withApi(async (url, preferences) => {
    const headers = { "x-user-id": "student-id", "Content-Type": "application/json" };
    const initial = await fetch(`${url}/api/user/preferences`, { headers });
    assert.equal(initial.status, 200);
    assert.deepEqual(await initial.json(), { source: "LMS", preferences: null });

    const saved = await fetch(`${url}/api/user/preferences`, { method: "PATCH", headers, body: JSON.stringify({ theme: "dark", userId: "teacher-id" }) });
    assert.equal(saved.status, 200);
    const body = await saved.json();
    assert.equal(body.source, "LMS");
    assert.equal(body.preferences.theme, "dark");
    assert.doesNotMatch(JSON.stringify(body), /password|token|secret/i);
    assert.equal(preferences.get("student-id").theme, "dark");
    assert.equal(preferences.has("teacher-id"), false);

    const reread = await fetch(`${url}/api/user/preferences`, { headers });
    assert.equal((await reread.json()).preferences.theme, "dark");
  });
});

test("rechaza campos protegidos, contexto ausente y usuario inexistente", async () => {
  await withApi(async url => {
    const protectedField = await fetch(`${url}/api/user/preferences`, {
      method: "PATCH", headers: { "x-user-id": "student-id", "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN", external_id: "fake", password: "fake" })
    });
    assert.equal(protectedField.status, 400);
    assert.equal((await protectedField.json()).error, "PROTECTED_FIELD");
    assert.equal((await fetch(`${url}/api/user/preferences`)).status, 401);
    assert.equal((await fetch(`${url}/api/user/preferences`, { headers: { "x-user-id": "missing" } })).status, 404);
  });
});
