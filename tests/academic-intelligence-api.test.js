import assert from "node:assert/strict";
import test from "node:test";
import { getStudentCourseIntelligence, getStudentIntelligence } from "../services/api/academic-intelligence-api-service.js";

class Storage { constructor(value = null) { this.value = value; } getItem() { return this.value; } }
const session = JSON.stringify({ id: "student-id", userId: "student-id", name: "Sofía Martínez", role: "STUDENT", source: "backend" });

test("cliente de inteligencia usa sólo x-user-id, declara LMS y no transmite credenciales", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ source: "LMS", studentId: "student-id", risk: { level: "INSUFFICIENT_DATA" } }), { status: 200 }); };
  const options = { storage: new Storage(session), fetchImpl };
  assert.equal((await getStudentIntelligence(options)).source, "LMS");
  assert.equal((await getStudentCourseIntelligence("course id", options)).source, "LMS");
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id"));
  assert.doesNotMatch(JSON.stringify(calls), /password|token/i);
  assert.match(calls[1].url, /course%20id/);
});

test("conserva fallback DEMO ante ausencia de sesión, red o respuesta HTTP", async () => {
  const fallback = { source: "DEMO", risk: { level: "MEDIUM" } };
  assert.deepEqual((await getStudentIntelligence({ storage: new Storage(), fallback })).intelligence, fallback);
  assert.equal((await getStudentIntelligence({ storage: new Storage(session), fetchImpl: async () => { throw new Error("offline"); } })).source, "demo-fallback");
  const rejected = await getStudentCourseIntelligence("course-id", { storage: new Storage(session), fetchImpl: async () => new Response(JSON.stringify({ message: "Sin acceso" }), { status: 403 }) });
  assert.equal(rejected.available, false);
  assert.equal(rejected.source, "backend");
});
