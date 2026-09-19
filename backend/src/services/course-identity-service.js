import { databasePool } from "../config/database.js";

function normalizeIdentifier(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function toIdentity(row) {
  const lmsCourseId = row?.lms_course_id || row?.id;
  if (!lmsCourseId || !row?.name || !row?.code) return null;
  return {
    lmsCourseId: String(lmsCourseId),
    externalCourseId: row.external_course_id ? String(row.external_course_id) : null,
    legacyId: row.legacy_course_id ? String(row.legacy_course_id) : null,
    name: String(row.name),
    code: String(row.code)
  };
}

function resolveRows(rows) {
  const identities = rows.map(toIdentity).filter(Boolean);
  const courseIds = new Set(identities.map(identity => identity.lmsCourseId));
  if (courseIds.size !== 1) return null;
  return identities[0] || null;
}

const identityColumns = `c.id AS lms_course_id, c.external_course_id, c.name, c.code,
  m.legacy_course_id, m.external_course_id AS mapped_external_course_id`;

async function findIdentity(condition, values, query) {
  const result = await query(
    `SELECT ${identityColumns}
       FROM lms_courses c
       LEFT JOIN course_identity_mapping m ON m.lms_course_id = c.id
      WHERE ${condition}
      ORDER BY CASE WHEN m.external_course_id = c.external_course_id THEN 0 ELSE 1 END,
               m.created_at ASC`,
    values
  );
  return resolveRows(result.rows.map(row => ({
    ...row,
    external_course_id: row.mapped_external_course_id || row.external_course_id
  })));
}

/** Resuelve sólo por UUID interno del LMS DEMO. */
export async function resolveCourseByLmsId(lmsCourseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const identifier = normalizeIdentifier(lmsCourseId);
  if (!identifier) return null;
  return findIdentity("c.id::text = $1", [identifier], query);
}

/** Resuelve por referencia externa preparada; no la presenta como ID institucional confirmado. */
export async function resolveCourseByExternalId(externalCourseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const identifier = normalizeIdentifier(externalCourseId);
  if (!identifier) return null;
  return findIdentity("c.external_course_id = $1 OR m.external_course_id = $1", [identifier], query);
}

/** Resuelve aliases explícitos documentados en course_identity_mapping. */
export async function resolveCourseByLegacyId(legacyId, { query = databasePool.query.bind(databasePool) } = {}) {
  const identifier = normalizeIdentifier(legacyId);
  if (!identifier) return null;
  return findIdentity("m.legacy_course_id = $1", [identifier], query);
}

/**
 * No confía en el tipo declarado por el consumidor: busca cada espacio de
 * identidad conocido y devuelve null si el mismo identificador fuese ambiguo.
 */
export async function resolveCourseIdentity(identifier, { query = databasePool.query.bind(databasePool) } = {}) {
  const value = normalizeIdentifier(identifier);
  if (!value) return null;
  return findIdentity(
    "c.id::text = $1 OR c.external_course_id = $1 OR m.external_course_id = $1 OR m.legacy_course_id = $1",
    [value],
    query
  );
}
