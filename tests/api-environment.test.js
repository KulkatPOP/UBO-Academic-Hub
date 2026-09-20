import assert from "node:assert/strict";
import test from "node:test";
import { getLocalApiBaseUrl } from "../services/api/api-environment.js";
import { resolveCourseByLegacyId } from "../services/api/course-identity-api-service.js";

test("usa la API local solo desde un host local", () => {
  assert.equal(getLocalApiBaseUrl({ locationRef: { hostname: "localhost" } }), "http://localhost:3001");
  assert.equal(getLocalApiBaseUrl({ locationRef: { hostname: "127.0.0.1" } }), "http://localhost:3001");
  assert.equal(getLocalApiBaseUrl({ locationRef: { hostname: "ubo-academic-hub.netlify.app" } }), null);
});

test("en un host publicado Course Detail conserva fallback sin solicitar localhost", async () => {
  let requested = false;
  const result = await resolveCourseByLegacyId("db", {
    baseUrl: getLocalApiBaseUrl({ locationRef: { hostname: "ubo-academic-hub.netlify.app" } }),
    fetchImpl: async () => { requested = true; throw new Error("No debe llamarse"); }
  });
  assert.equal(result, null);
  assert.equal(requested, false);
});
