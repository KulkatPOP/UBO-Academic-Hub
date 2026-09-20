import assert from "node:assert/strict";
import test from "node:test";
import { resolveCourse, resolveCourseByExternalId, resolveCourseByLegacyId, resolveCourseByLegacyIdResult, resolveCourseByLmsId } from "../services/api/course-identity-api-service.js";

const course = { lmsCourseId: "lms-db-id", externalCourseId: "course-db-2026-1", legacyId: "db", name: "Bases de Datos", code: "INF-302" };

test("consulta la capa de identidad con cada tipo como pista y devuelve copias", async () => {
  const urls = [];
  const fetchImpl = async url => {
    urls.push(url);
    return { ok: true, json: async () => ({ course }) };
  };
  const results = await Promise.all([
    resolveCourse("db", { fetchImpl }),
    resolveCourseByLegacyId("db", { fetchImpl }),
    resolveCourseByLmsId("lms-db-id", { fetchImpl }),
    resolveCourseByExternalId("course-db-2026-1", { fetchImpl })
  ]);
  assert.equal(results.every(item => item?.lmsCourseId === "lms-db-id"), true);
  results[0].name = "Mutado";
  assert.equal(course.name, "Bases de Datos");
  assert.equal(urls.some(url => url.includes("type=legacy")), true);
});

test("controla entradas vacías, 404 y errores de red sin lanzar", async () => {
  assert.equal(await resolveCourseByLegacyId("", { fetchImpl: async () => { throw new Error("no debe llamarse"); } }), null);
  assert.equal(await resolveCourse("missing", { fetchImpl: async () => ({ ok: false, json: async () => ({}) }) }), null);
  assert.equal(await resolveCourse("db", { fetchImpl: async () => { throw new Error("offline"); } }), null);
});

test("expone 404 de identidad como único caso permitido para fallback DEMO", async () => {
  const result = await resolveCourseByLegacyIdResult("english", {
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ error: "COURSE_IDENTITY_NOT_FOUND" }) })
  });
  assert.deepEqual(result, {
    available: false,
    source: "demo-fallback",
    status: 404,
    reason: "IDENTITY_NOT_FOUND",
    identity: null
  });
});

test("preserva errores de autenticación, autorización y servidor sin fallback DEMO", async () => {
  for (const status of [401, 403, 500]) {
    const result = await resolveCourseByLegacyIdResult("iot", {
      fetchImpl: async () => ({ ok: false, status, json: async () => ({ error: "REQUEST_FAILED" }) })
    });
    assert.equal(result.source, "backend");
    assert.equal(result.status, status);
    assert.notEqual(result.reason, "IDENTITY_NOT_FOUND");
  }
});

test("conserva el manejo existente de API no disponible ante fallo de red", async () => {
  const result = await resolveCourseByLegacyIdResult("cyber", {
    fetchImpl: async () => { throw new Error("offline"); }
  });
  assert.equal(result.source, "demo-fallback");
  assert.equal(result.status, null);
  assert.equal(result.reason, "API_UNAVAILABLE");
});
