import { databasePool } from "../config/database.js";
import { getPublicUserById } from "./user-service.js";

const THEMES = new Set(["light", "dark", "system"]);
const FIELDS = new Set([
  "theme",
  "language",
  "notificationsEnabled",
  "emailNotifications",
  "tutorPreferences",
  "accessibilityPreferences",
  "learningPreferences"
]);
const PROTECTED_FIELDS = new Set(["role", "external_id", "externalId", "password", "password_demo", "user_reference", "userReference"]);

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function cloneObject(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : null;
}

function toPreferences(row) {
  if (!row) return null;
  return {
    theme: row.theme ?? null,
    language: row.language ?? null,
    notificationsEnabled: row.notifications_enabled ?? null,
    emailNotifications: row.email_notifications ?? null,
    tutorPreferences: cloneObject(row.tutor_preferences),
    accessibilityPreferences: cloneObject(row.accessibility_preferences),
    learningPreferences: cloneObject(row.learning_preferences),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

/** Valida exclusivamente valores que el LMS puede almacenar como preferencias. */
export function validateUserPreferencePatch(input) {
  if (!plainObject(input)) return { valid: false, code: "INVALID_PREFERENCES" };
  if (Object.keys(input).some(key => PROTECTED_FIELDS.has(key))) return { valid: false, code: "PROTECTED_FIELD" };

  const values = {};
  for (const [key, value] of Object.entries(input)) {
    // userId no es autoridad: se ignora para permitir solicitudes clientes compatibles.
    if (key === "userId") continue;
    if (!FIELDS.has(key)) return { valid: false, code: "UNKNOWN_FIELD" };
    if (key === "theme") {
      if (!THEMES.has(value)) return { valid: false, code: "INVALID_THEME" };
      values.theme = value;
    } else if (key === "language") {
      if (typeof value !== "string" || !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(value)) return { valid: false, code: "INVALID_LANGUAGE" };
      values.language = value;
    } else if (key === "notificationsEnabled" || key === "emailNotifications") {
      if (typeof value !== "boolean") return { valid: false, code: "INVALID_BOOLEAN" };
      values[key] = value;
    } else {
      if (!plainObject(value)) return { valid: false, code: "INVALID_OBJECT" };
      values[key] = cloneObject(value);
    }
  }
  return Object.keys(values).length ? { valid: true, values } : { valid: false, code: "EMPTY_PATCH" };
}

async function resolveUser(userId, query) {
  return getPublicUserById(userId, { query });
}

export async function getUserPreferences(userId, { query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { user: null, preferences: null };
  const result = await query(
    `SELECT theme, language, notifications_enabled, email_notifications,
            tutor_preferences, accessibility_preferences, learning_preferences, updated_at
       FROM user_preferences WHERE user_reference = $1 LIMIT 1`,
    [user.id]
  );
  return { user, preferences: toPreferences(result.rows[0]) };
}

export async function updateUserPreferences(userId, input, { query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { user: null, preferences: null, validation: { valid: false, code: "USER_NOT_FOUND" } };
  const validation = validateUserPreferencePatch(input);
  if (!validation.valid) return { user, preferences: null, validation };
  const values = validation.values;
  const result = await query(
    `INSERT INTO user_preferences (
       user_reference, theme, language, notifications_enabled, email_notifications,
       tutor_preferences, accessibility_preferences, learning_preferences
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
     ON CONFLICT (user_reference) DO UPDATE SET
       theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
       language = COALESCE(EXCLUDED.language, user_preferences.language),
       notifications_enabled = COALESCE(EXCLUDED.notifications_enabled, user_preferences.notifications_enabled),
       email_notifications = COALESCE(EXCLUDED.email_notifications, user_preferences.email_notifications),
       tutor_preferences = COALESCE(EXCLUDED.tutor_preferences, user_preferences.tutor_preferences),
       accessibility_preferences = COALESCE(EXCLUDED.accessibility_preferences, user_preferences.accessibility_preferences),
       learning_preferences = COALESCE(EXCLUDED.learning_preferences, user_preferences.learning_preferences),
       updated_at = NOW()
     RETURNING theme, language, notifications_enabled, email_notifications,
               tutor_preferences, accessibility_preferences, learning_preferences, updated_at`,
    [
      user.id,
      values.theme ?? null,
      values.language ?? null,
      values.notificationsEnabled ?? null,
      values.emailNotifications ?? null,
      values.tutorPreferences ? JSON.stringify(values.tutorPreferences) : null,
      values.accessibilityPreferences ? JSON.stringify(values.accessibilityPreferences) : null,
      values.learningPreferences ? JSON.stringify(values.learningPreferences) : null
    ]
  );
  return { user, preferences: toPreferences(result.rows[0]), validation };
}
