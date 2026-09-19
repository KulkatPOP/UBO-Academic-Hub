import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { getUserPreferences, updateUserPreferences } from "../services/api/user-preferences-api-service.js";

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, json: async () => body };
}

test("cliente de preferencias usa x-user-id, source LMS y nunca transmite contraseña", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía", role: "STUDENT" }, { storage: sessionStorage });
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return response(200, { source: "LMS", preferences: { theme: "dark" } });
  };
  assert.equal((await getUserPreferences({ storage: sessionStorage, fetchImpl })).preferences.theme, "dark");
  assert.equal((await updateUserPreferences({ theme: "light", userId: "other" }, { storage: sessionStorage, fetchImpl })).source, "LMS");
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id"));
  assert.equal(calls[1].options.method, "PATCH");
  assert.doesNotMatch(JSON.stringify(calls), /password/i);
});

test("cliente conserva fallback por sesión ausente, error de red y error HTTP", async () => {
  assert.equal((await getUserPreferences({ storage: storage() })).source, "demo-fallback");
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía", role: "STUDENT" }, { storage: sessionStorage });
  assert.equal((await getUserPreferences({ storage: sessionStorage, fetchImpl: async () => { throw Error("offline"); } })).source, "demo-fallback");
  const failure = await updateUserPreferences({ theme: "dark" }, { storage: sessionStorage, fetchImpl: async () => response(400, { error: "INVALID_THEME" }) });
  assert.equal(failure.available, false);
  assert.equal(failure.source, "backend");
});
