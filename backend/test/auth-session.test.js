import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const users = new Map([
  ["msofia", { id: "sofia-id", name: "Sofía Martínez", role: "STUDENT", password_demo: "123456" }],
  ["pcarlos", { id: "carlos-id", name: "Carlos Pérez", role: "TEACHER", password_demo: "123456" }],
  ["admin", { id: "admin-id", name: "Administrador UBO", role: "ADMIN", password_demo: "admin123" }]
]);

async function withApi(run) {
  const original = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/WHERE username = \$1/.test(sql)) { const user = users.get(values[0]); return { rows: user?.password_demo === values[1] ? [{ ...user }] : [] }; }
    if (/FROM users_reference/.test(sql)) { const user = [...users.values()].find(item => item.id === values[0]); return { rows: user ? [{ ...user }] : [] }; }
    throw new Error(`Consulta no cubierta: ${sql}`);
  };
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); databasePool.query = original; }
}

test("login y perfil entregan solamente identidad pública coherente", async () => {
  await withApi(async url => {
    for (const [username, password, role] of [["msofia", "123456", "STUDENT"], ["pcarlos", "123456", "TEACHER"], ["admin", "admin123", "ADMIN"]]) {
      const login = await fetch(`${url}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, role: "ADMIN" }) });
      assert.equal(login.status, 200);
      const body = await login.json();
      assert.equal(body.user.role, role);
      assert.doesNotMatch(JSON.stringify(body), /password|token/i);
      const profile = await fetch(`${url}/api/users/me`, { headers: { "x-user-id": body.user.id, "x-role": "ADMIN" } });
      assert.equal(profile.status, 200);
      assert.equal((await profile.json()).user.id, body.user.id);
    }
  });
});

test("credenciales inválidas no crean sesión ni permiten role spoofing", async () => {
  await withApi(async url => {
    const invalid = await fetch(`${url}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "msofia", password: "wrong" }) });
    assert.equal(invalid.status, 401);
    const studentAdmin = await fetch(`${url}/api/analytics/admin/overview?role=ADMIN`, { headers: { "x-user-id": "sofia-id" } });
    assert.equal(studentAdmin.status, 403);
  });
});
