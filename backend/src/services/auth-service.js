import { databasePool } from "../config/database.js";

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("es-CL") : "";
}

function normalizePassword(value) {
  return typeof value === "string" ? value : "";
}

/**
 * Auth demo de Hub. `password_demo` existe sólo para semillas locales.
 * Producción reemplazará esta consulta por `password_hash` o identidad institucional federada.
 */
export async function authenticateDemoUser({ username, password } = {}, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = normalizePassword(password);
  if (!normalizedUsername || !normalizedPassword) return null;

  const result = await query(
    `SELECT id, name, role
       FROM users_reference
      WHERE username = $1
        AND password_demo = $2
      LIMIT 1`,
    [normalizedUsername, normalizedPassword]
  );

  const user = result.rows[0];
  return user ? { id: user.id, name: user.name, role: user.role } : null;
}
