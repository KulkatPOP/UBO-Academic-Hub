import assert from "node:assert/strict";
import test from "node:test";
import { getPublicUserById } from "../src/services/user-service.js";

const publicUsers = new Map([
  ["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }],
  ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }],
  ["admin-id", { id: "admin-id", name: "Administrador UBO", role: "ADMIN" }]
]);

function queryPublicUser(sql, [id]) {
  assert.match(sql, /SELECT id, name, role/);
  assert.doesNotMatch(sql, /password_demo/);
  const user = publicUsers.get(id);
  return Promise.resolve({ rows: user ? [{ ...user, password_demo: "no-exponer" }] : [] });
}

for (const [id, expected] of publicUsers) {
  test(`obtiene el perfil público ${expected.role}`, async () => {
    const user = await getPublicUserById(id, { query: queryPublicUser });
    assert.deepEqual(user, expected);
    assert.equal(Object.hasOwn(user, "password_demo"), false);
  });
}

test("resuelve un usuario inexistente de forma controlada", async () => {
  assert.equal(await getPublicUserById("missing-id", { query: queryPublicUser }), null);
  assert.equal(await getPublicUserById("", { query: queryPublicUser }), null);
});
