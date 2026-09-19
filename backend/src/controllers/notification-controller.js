import { getNotificationsForUser, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "../services/notification-service.js";

const userId = request => request.get("x-user-id")?.trim() || "";
const statusFor = code => ({ USER_CONTEXT_REQUIRED: 401, USER_NOT_FOUND: 404, NOTIFICATION_NOT_FOUND: 404, NOTIFICATION_FORBIDDEN: 403, INVALID_PAGINATION: 400 }[code] || 400);
const failure = (response, code) => response.status(statusFor(code)).json({ error: code, message: "Operación de notificaciones LMS no disponible." });

export async function listNotifications(request, response, next) {
  try { if (!userId(request)) return failure(response, "USER_CONTEXT_REQUIRED"); const result = await getNotificationsForUser(userId(request), { limit: request.query.limit, offset: request.query.offset }); if (!result.authorized) return failure(response, result.code); return response.json({ source: "LMS", notifications: result.notifications }); } catch (error) { return next(error); }
}
export async function unreadCount(request, response, next) {
  try { if (!userId(request)) return failure(response, "USER_CONTEXT_REQUIRED"); const result = await getUnreadNotificationCount(userId(request)); if (!result.authorized) return failure(response, result.code); return response.json({ source: "LMS", unreadCount: result.count }); } catch (error) { return next(error); }
}
export async function readNotification(request, response, next) {
  try { if (!userId(request)) return failure(response, "USER_CONTEXT_REQUIRED"); const result = await markNotificationRead(userId(request), request.params.id); if (!result.updated) return failure(response, result.code); return response.json({ source: "LMS", notification: result.notification }); } catch (error) { return next(error); }
}
export async function readAllNotifications(request, response, next) {
  try { if (!userId(request)) return failure(response, "USER_CONTEXT_REQUIRED"); const result = await markAllNotificationsRead(userId(request)); if (!result.updated) return failure(response, result.code); return response.json({ source: "LMS", updatedCount: result.count }); } catch (error) { return next(error); }
}
