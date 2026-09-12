import assert from "node:assert/strict";
import test from "node:test";
import { authenticateDemoUser } from "../src/services/auth-service.js";

test("autentica un usuario demo sin exponer contraseña", async () => {
  const result = await authenticateDemoUser(
    { username: "msofia", password: "123456" },
    { query: async (sql, values) => {
      assert.match(sql, /password_demo/);
      assert.deepEqual(values, ["msofia", "123456"]);
      return { rows: [{ id: "user-1", name: "Sofía Martínez", role: "STUDENT", password_demo: "123456" }] };
    } }
  );
  assert.deepEqual(result, { id: "user-1", name: "Sofía Martínez", role: "STUDENT" });
  assert.equal("password_demo" in result, false);
});

test("rechaza credenciales incompletas o inexistentes", async () => {
  assert.equal(await authenticateDemoUser({ username: "", password: "123456" }), null);
  const result = await authenticateDemoUser({ username: "nadie", password: "x" }, { query: async () => ({ rows: [] }) });
  assert.equal(result, null);
});
