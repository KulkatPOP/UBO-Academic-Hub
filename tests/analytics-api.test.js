import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { getAdminOverview, getStudentAnalytics, getStudentCourseAnalytics, getTeacherAnalytics, getTeacherCourseAnalytics } from "../services/api/analytics-api-service.js";

const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
const response = (status, body) => ({ ok: status >= 200 && status < 300, json: async () => body });

test("analytics API usa sesión, source LMS, courseId codificado y no envía password", async () => {
  const sessionStorage = storage();
  const calls = [];
  saveAcademicSession({ id: "student-id", name: "Sofía", role: "STUDENT" }, { storage: sessionStorage });
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return response(200, { source: "LMS", courses: [] });
  };
  assert.equal((await getStudentAnalytics({ storage: sessionStorage, fetchImpl })).body.source, "LMS");
  await getStudentCourseAnalytics("course id/with slash", { storage: sessionStorage, fetchImpl });
  await getTeacherAnalytics({ storage: sessionStorage, fetchImpl });
  await getTeacherCourseAnalytics("course-id", { storage: sessionStorage, fetchImpl });
  await getAdminOverview({ storage: sessionStorage, fetchImpl });
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id"));
  assert.match(calls[1].url, /course%20id%2Fwith%20slash/);
  assert.doesNotMatch(JSON.stringify(calls), /password/i);
});

test("analytics API conserva fallback si no hay sesión, falla red o backend rechaza", async () => {
  const noSession = await getStudentAnalytics({ storage: storage(), fetchImpl: async () => response(200, {}) });
  assert.deepEqual(noSession, { available: false, source: "demo-fallback" });
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía", role: "STUDENT" }, { storage: sessionStorage });
  const networkFailure = await getStudentAnalytics({ storage: sessionStorage, fetchImpl: async () => { throw Error("offline"); } });
  assert.equal(networkFailure.source, "demo-fallback");
  const denied = await getStudentAnalytics({ storage: sessionStorage, fetchImpl: async () => response(403, { error: "ADMIN_ROLE_REQUIRED" }) });
  assert.equal(denied.available, false);
  assert.equal(denied.source, "backend");
  assert.doesNotMatch(JSON.stringify(denied.body), /password/i);
});
