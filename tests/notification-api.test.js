import assert from "node:assert/strict";
import test from "node:test";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "../services/api/notification-api-service.js";

class MemoryStorage { constructor(value = null) { this.value = value; } getItem() { return this.value; } }
const session = JSON.stringify({ userId: "student-id", name: "Sofía Martínez", role: "STUDENT", source: "backend" });

test("cliente de notificaciones usa x-user-id, source LMS y no credenciales", async () => {
  const calls = []; const fetchImpl = async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ source: "LMS", notifications: [{ id: "n-1" }], unreadCount: 2, updatedCount: 2, notification: { id: "n-1", isRead: true } }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  const options = { storage: new MemoryStorage(session), fetchImpl };
  assert.equal((await getNotifications(options)).notifications.length, 1);
  assert.equal((await getUnreadNotificationCount(options)).unreadCount, 2);
  assert.equal((await markNotificationRead("n-1", options)).notification.isRead, true);
  assert.equal((await markAllNotificationsRead(options)).updatedCount, 2);
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id")); assert.doesNotMatch(JSON.stringify(calls), /password/);
});
test("cliente conserva fallback ante sesión ausente, fallo de red y HTTP", async () => {
  assert.deepEqual((await getNotifications({ fallback: [{ id: "demo" }], storage: new MemoryStorage() })).notifications, [{ id: "demo" }]);
  const failure = await getNotifications({ fallback: [], storage: new MemoryStorage(session), fetchImpl: async () => { throw new Error("offline"); } }); assert.equal(failure.source, "demo-fallback");
  const rejected = await getUnreadNotificationCount({ storage: new MemoryStorage(session), fetchImpl: async () => new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }) }); assert.equal(rejected.available, false);
});
