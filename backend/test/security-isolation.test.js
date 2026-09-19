import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";

const sofia = { id: "ceac5429-f19e-43e8-97f1-a1fca0e2247b", name: "Sofía Martínez", role: "STUDENT", password_demo: "123456" };

async function withApi(run) {
  const original = databasePool.query;
  databasePool.query = async (sql, values = []) => {
    if (/WHERE username = \$1/.test(sql)) return { rows: values[0] === "msofia" && values[1] === "123456" ? [sofia] : [] };
    if (/FROM users_reference/.test(sql)) return { rows: values[0] === sofia.id ? [sofia] : [] };
    throw new Error(`Consulta no cubierta: ${sql}`);
  };
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); databasePool.query = original; }
}

test("las rutas privadas rechazan x-user-id falsificado sin sesión", async () => {
  await withApi(async url => {
    const response = await fetch(`${url}/api/users/me`, { headers: { "x-user-id": sofia.id, "x-role": "ADMIN" } });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "AUTHENTICATION_REQUIRED");
  });
});

test("la cookie HTTP-only autenticada prevalece sobre los encabezados falsificados", async () => {
  await withApi(async url => {
    const login = await fetch(`${url}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "msofia", password: "123456" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie");
    assert.match(cookie || "", /HttpOnly/i);
    const profile = await fetch(`${url}/api/users/me`, { headers: { cookie, "x-user-id": "8639404f-765e-4586-b616-27373bc3ce1c", "x-role": "ADMIN" } });
    assert.equal(profile.status, 200);
    const body = await profile.json();
    assert.equal(body.user.id, sofia.id);
    assert.equal(body.user.role, "STUDENT");
    assert.doesNotMatch(JSON.stringify(body), /password|token|secret/i);
  });
});
