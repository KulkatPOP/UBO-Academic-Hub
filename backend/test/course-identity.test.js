import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { createApp } from "../src/app.js";
import { resolveCourseByExternalId, resolveCourseByLegacyId, resolveCourseByLmsId, resolveCourseIdentity } from "../src/services/course-identity-service.js";
import { databasePool } from "../src/config/database.js";

const db = { lms_course_id: "lms-db-id", external_course_id: "course-db-2026-1", name: "Bases de Datos", code: "INF-302", legacy_course_id: "db", mapped_external_course_id: "course-db-2026-1" };
const ragAlias = { ...db, legacy_course_id: "database", mapped_external_course_id: null };
const other = { lms_course_id: "lms-other-id", external_course_id: "course-other-2026-1", name: "Otro curso", code: "OTH-001", legacy_course_id: "other", mapped_external_course_id: "course-other-2026-1" };

async function query(sql, values) {
  const value = values?.[0];
  if (!/course_identity_mapping/.test(sql)) return { rows: [] };
  if (value === "db") return { rows: [{ ...db }] };
  if (value === "database") return { rows: [{ ...ragAlias }] };
  if (value === "lms-db-id" || value === "course-db-2026-1") return { rows: [{ ...db }, { ...ragAlias }] };
  if (value === "ambiguous") return { rows: [{ ...db, legacy_course_id: "ambiguous" }, { ...other, legacy_course_id: "ambiguous" }] };
  return { rows: [] };
}

test("resuelve identidad DEMO por LMS, externa y alias legacy sin exponer credenciales", async () => {
  const byLms = await resolveCourseByLmsId("lms-db-id", { query });
  const byExternal = await resolveCourseByExternalId("course-db-2026-1", { query });
  const byLegacy = await resolveCourseByLegacyId("db", { query });
  const byRagAlias = await resolveCourseIdentity("database", { query });
  for (const identity of [byLms, byExternal, byLegacy, byRagAlias]) {
    assert.deepEqual(Object.keys(identity).sort(), ["code", "externalCourseId", "legacyId", "lmsCourseId", "name"]);
    assert.equal(identity.lmsCourseId, "lms-db-id");
    assert.equal("password_demo" in identity, false);
  }
  assert.equal(byLegacy.legacyId, "db");
  assert.equal(byRagAlias.legacyId, "database");
});

test("rechaza identificadores inexistentes y resultados ambiguos o contradictorios", async () => {
  assert.equal(await resolveCourseIdentity("missing", { query }), null);
  assert.equal(await resolveCourseIdentity("ambiguous", { query }), null);
});

test("la ruta ignora type como autoridad y devuelve sólo identidad pública", async () => {
  const original = databasePool.query;
  databasePool.query = query;
  const server = createServer(createApp());
  await new Promise(resolve => server.listen(0, resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/course-identity/resolve?identifier=db&type=external`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.course.lmsCourseId, "lms-db-id");
    assert.equal(body.course.legacyId, "db");
    assert.equal("password_demo" in body.course, false);
    const missing = await fetch(`http://127.0.0.1:${address.port}/api/course-identity/resolve?identifier=missing`);
    assert.equal(missing.status, 404);
  } finally {
    databasePool.query = original;
    await new Promise(resolve => server.close(resolve));
  }
});
