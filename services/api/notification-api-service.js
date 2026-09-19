import { getAcademicSession } from "./auth-api-service.js";

const clone = value => value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;

async function request(path, options = {}, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session?.userId) return { available: false, source: "demo-fallback", body: null };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}${path}`, { ...options, credentials: "include", headers: { ...(options.headers || {}), "x-user-id": session.userId } });
    const body = await response.json().catch(() => null);
    return response.ok && body?.source === "LMS" ? { available: true, source: "LMS", status: response.status, body } : { available: false, source: "backend", status: response.status, body };
  } catch { return { available: false, source: "demo-fallback", body: null }; }
}

export async function getNotifications({ fallback = [], limit, offset, ...options } = {}) {
  const query = new URLSearchParams(); if (limit !== undefined) query.set("limit", String(limit)); if (offset !== undefined) query.set("offset", String(offset));
  const result = await request(`/api/notifications${query.size ? `?${query}` : ""}`, {}, options);
  return { ...result, notifications: result.available && Array.isArray(result.body?.notifications) ? clone(result.body.notifications) : clone(fallback) };
}
export async function getUnreadNotificationCount(options = {}) { const result = await request("/api/notifications/unread-count", {}, options); return { ...result, unreadCount: result.available ? Number(result.body?.unreadCount || 0) : 0 }; }
export async function markNotificationRead(id, options = {}) { const result = await request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }, options); return { ...result, notification: result.available ? clone(result.body?.notification) : null }; }
export async function markAllNotificationsRead(options = {}) { const result = await request("/api/notifications/read-all", { method: "PATCH" }, options); return { ...result, updatedCount: result.available ? Number(result.body?.updatedCount || 0) : 0 }; }
