import { databasePool } from "../config/database.js";

function normalizeUserId(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function toPublicUser(row) {
  if (!row || !row.id || !row.name || !row.role) return null;
  return { id: String(row.id), name: String(row.name), role: String(row.role) };
}

/**
 * Obtiene exclusivamente el perfil público de referencia del usuario.
 * Las credenciales demo y cualquier futuro dato sensible nunca forman parte
 * de esta consulta ni de su resultado.
 */
export async function getPublicUserById(userId, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return null;

  const result = await query(
    `SELECT id, name, role
       FROM users_reference
      WHERE id = $1
      LIMIT 1`,
    [normalizedUserId]
  );

  return toPublicUser(result.rows[0]);
}
