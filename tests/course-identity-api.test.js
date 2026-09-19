import assert from "node:assert/strict";
import test from "node:test";
import { resolveCourse, resolveCourseByExternalId, resolveCourseByLegacyId, resolveCourseByLmsId } from "../services/api/course-identity-api-service.js";

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
