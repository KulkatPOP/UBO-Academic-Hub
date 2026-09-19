import { databasePool } from "../config/database.js";
import { getPublicUserById } from "./user-service.js";

const TYPES = new Set(["MESSAGE"]);
const SEVERITIES = new Set(["INFO", "WARNING", "SUCCESS", "ERROR"]);
const RESOURCE_TYPES = new Set(["MESSAGE"]);
const text = value => typeof value === "string" ? value.trim() : "";

function notificationRow(row) {
  if (!row) return null;
  return {
    id: String(row.id), type: String(row.type), title: String(row.title), message: String(row.message),
    severity: String(row.severity), resourceType: String(row.resource_type), resourceReference: String(row.resource_reference),
    isRead: Boolean(row.is_read), createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null
  };
}

async function resolveUser(userId, query) { return getPublicUserById(userId, { query }); }

function validateNotification(payload = {}) {
  const type = text(payload.type).toUpperCase(), severity = text(payload.severity).toUpperCase(), resourceType = text(payload.resourceType).toUpperCase();
  if (!TYPES.has(type)) return { valid: false, code: "INVALID_NOTIFICATION_TYPE" };
  if (!SEVERITIES.has(severity)) return { valid: false, code: "INVALID_NOTIFICATION_SEVERITY" };
  if (!RESOURCE_TYPES.has(resourceType)) return { valid: false, code: "INVALID_RESOURCE_TYPE" };
  const title = text(payload.title), message = text(payload.message), resourceReference = text(payload.resourceReference);
  if (!title || title.length > 160 || !message || message.length > 1000 || !resourceReference || resourceReference.length > 160) return { valid: false, code: "INVALID_NOTIFICATION" };
  return { valid: true, values: { type, severity, resourceType, title, message, resourceReference } };
}

/** Crea una notificación desde un evento LMS concreto; no se expone como endpoint público. */
export async function createLmsNotification(userId, payload, { query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { created: false, code: "USER_NOT_FOUND", notification: null };
  const validation = validateNotification(payload);
  if (!validation.valid) return { created: false, code: validation.code, notification: null };
  const item = validation.values;
  const inserted = await query(
    `INSERT INTO lms_notifications (user_reference,type,title,message,severity,resource_type,resource_reference)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (user_reference,type,resource_type,resource_reference) DO NOTHING
     RETURNING id,type,title,message,severity,resource_type,resource_reference,is_read,created_at,read_at`,
    [user.id, item.type, item.title, item.message, item.severity, item.resourceType, item.resourceReference]
  );
  if (inserted.rows[0]) return { created: true, code: null, notification: notificationRow(inserted.rows[0]) };
  const existing = await query(
    `SELECT id,type,title,message,severity,resource_type,resource_reference,is_read,created_at,read_at
       FROM lms_notifications WHERE user_reference=$1 AND type=$2 AND resource_type=$3 AND resource_reference=$4 LIMIT 1`,
    [user.id, item.type, item.resourceType, item.resourceReference]
  );
  return { created: false, code: "DUPLICATE_NOTIFICATION", notification: notificationRow(existing.rows[0]) };
}

export async function getNotificationsForUser(userId, { limit = 30, offset = 0, query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { authorized: false, code: "USER_NOT_FOUND", notifications: [] };
  const parsedLimit = Number(limit), parsedOffset = Number(offset);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 || !Number.isInteger(parsedOffset) || parsedOffset < 0) return { authorized: false, code: "INVALID_PAGINATION", notifications: [] };
  const result = await query(
    `SELECT id,type,title,message,severity,resource_type,resource_reference,is_read,created_at,read_at
       FROM lms_notifications WHERE user_reference=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [user.id, parsedLimit, parsedOffset]
  );
  return { authorized: true, code: null, notifications: result.rows.map(notificationRow).filter(Boolean) };
}

export async function getUnreadNotificationCount(userId, { query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { authorized: false, code: "USER_NOT_FOUND", count: 0 };
  const result = await query("SELECT COUNT(*)::int AS count FROM lms_notifications WHERE user_reference=$1 AND is_read=FALSE", [user.id]);
  return { authorized: true, code: null, count: Number(result.rows[0]?.count || 0) };
}

export async function markNotificationRead(userId, notificationId, { query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { updated: false, code: "USER_NOT_FOUND", notification: null };
  const found = await query("SELECT user_reference FROM lms_notifications WHERE id::text=$1 LIMIT 1", [text(notificationId)]);
  if (!found.rows[0]) return { updated: false, code: "NOTIFICATION_NOT_FOUND", notification: null };
  if (String(found.rows[0].user_reference) !== user.id) return { updated: false, code: "NOTIFICATION_FORBIDDEN", notification: null };
  const result = await query(
    `UPDATE lms_notifications SET is_read=TRUE, read_at=COALESCE(read_at,NOW()) WHERE id::text=$1 AND user_reference=$2
     RETURNING id,type,title,message,severity,resource_type,resource_reference,is_read,created_at,read_at`,
    [text(notificationId), user.id]
  );
  return { updated: true, code: null, notification: notificationRow(result.rows[0]) };
}

export async function markAllNotificationsRead(userId, { query = databasePool.query.bind(databasePool) } = {}) {
  const user = await resolveUser(userId, query);
  if (!user) return { updated: false, code: "USER_NOT_FOUND", count: 0 };
  const result = await query("UPDATE lms_notifications SET is_read=TRUE, read_at=NOW() WHERE user_reference=$1 AND is_read=FALSE RETURNING id", [user.id]);
  return { updated: true, code: null, count: result.rows.length };
}

export { validateNotification };
