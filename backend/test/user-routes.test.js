import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }],
  ["admin-id", { id: "admin-id", name: "Administrador UBO", role: "ADMIN" }]
]);

async function withApi(run) {
  const originalQuery = databasePool.query;
  databasePool.query = async (sql, [id]) => {
    assert.match(sql, /SELECT id, name, role/);
    return { rows: users.has(id) ? [{ ...users.get(id), password_demo: "never-returned" }] : [] };
  };
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(url);
  } finally {
    await new Promise(resolve => server.close(resolve));
    databasePool.query = originalQuery;
  }
}

test("expone perfiles públicos por id y contexto demo sin contraseña", async () => {
  await withApi(async url => {
    for (const user of users.values()) {
      const byId = await fetch(`${url}/api/users/${user.id}`);
      assert.equal(byId.status, 200);
      assert.deepEqual(await byId.json(), user);

      const current = await fetch(`${url}/api/users/me`, { headers: { "x-user-id": user.id } });
      assert.equal(current.status, 200);
      assert.deepEqual(await current.json(), { user });
    }
  });
});

test("aísla usuario inexistente y exige contexto para /me", async () => {
  await withApi(async url => {
    const missing = await fetch(`${url}/api/users/missing-id`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, "USER_NOT_FOUND");

    const withoutContext = await fetch(`${url}/api/users/me`);
    assert.equal(withoutContext.status, 401);
    assert.equal((await withoutContext.json()).error, "AUTHENTICATION_REQUIRED");
  });
});
