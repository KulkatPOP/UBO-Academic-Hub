import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { databasePool } from "../src/config/database.js";
import { createLmsNotification, validateNotification } from "../src/services/notification-service.js";

const users = new Map([["student-id", { id: "student-id", name: "Sofía Martínez", role: "STUDENT" }], ["teacher-id", { id: "teacher-id", name: "Carlos Pérez", role: "TEACHER" }]]);

async function withApi(run) {
  const original = databasePool.query, rows = [], byId = new Map(); let sequence = 0;
  databasePool.query = async (sql, params = []) => {
    if (sql.includes("FROM users_reference")) return { rows: users.has(params[0]) ? [{ ...users.get(params[0]) }] : [] };
    if (sql.includes("INSERT INTO lms_notifications")) {
      const [userReference, type, title, message, severity, resourceType, resourceReference] = params;
      const existing = rows.find(item => item.user_reference === userReference && item.type === type && item.resource_type === resourceType && item.resource_reference === resourceReference);
      if (existing) return { rows: [] };
      const row = { id: `notification-${++sequence}`, user_reference: userReference, type, title, message, severity, resource_type: resourceType, resource_reference: resourceReference, is_read: false, created_at: new Date().toISOString(), read_at: null };
      rows.push(row); byId.set(row.id, row); return { rows: [{ ...row }] };
    }
    if (sql.includes("FROM lms_notifications WHERE user_reference=$1 AND type=$2")) return { rows: rows.filter(item => item.user_reference === params[0] && item.type === params[1] && item.resource_type === params[2] && item.resource_reference === params[3]).slice(0, 1).map(item => ({ ...item })) };
    if (sql.includes("FROM lms_notifications WHERE user_reference=$1 ORDER BY")) return { rows: rows.filter(item => item.user_reference === params[0]).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(params[2], params[2] + params[1]).map(item => ({ ...item })) };
    if (sql.includes("COUNT(*)::int")) return { rows: [{ count: rows.filter(item => item.user_reference === params[0] && !item.is_read).length }] };
    if (sql.includes("SELECT user_reference FROM lms_notifications")) return { rows: byId.has(params[0]) ? [{ user_reference: byId.get(params[0]).user_reference }] : [] };
    if (sql.includes("UPDATE lms_notifications SET is_read=TRUE, read_at=COALESCE")) { const row = byId.get(params[0]); row.is_read = true; row.read_at ||= new Date().toISOString(); return { rows: [{ ...row }] }; }
    if (sql.includes("UPDATE lms_notifications SET is_read=TRUE, read_at=NOW()")) { const changed = rows.filter(item => item.user_reference === params[0] && !item.is_read); changed.forEach(item => { item.is_read = true; item.read_at = new Date().toISOString(); }); return { rows: changed.map(item => ({ id: item.id })) }; }
    throw new Error(`Consulta inesperada: ${sql}`);
  };
  const server = createApp().listen(0); await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`, rows); } finally { await new Promise(resolve => server.close(resolve)); databasePool.query = original; }
}

test("valida tipo, severidad y recurso de notificaciones LMS", () => {
  assert.equal(validateNotification({ type: "MESSAGE", title: "Mensaje", message: "Contenido", severity: "INFO", resourceType: "MESSAGE", resourceReference: "message-1" }).valid, true);
  assert.equal(validateNotification({ type: "OTHER", title: "x", message: "x", severity: "INFO", resourceType: "MESSAGE", resourceReference: "x" }).code, "INVALID_NOTIFICATION_TYPE");
  assert.equal(validateNotification({ type: "MESSAGE", title: "x", message: "x", severity: "LOW", resourceType: "MESSAGE", resourceReference: "x" }).code, "INVALID_NOTIFICATION_SEVERITY");
});

test("lista, cuenta, marca y aísla notificaciones LMS", async () => {
  await withApi(async (url, rows) => {
    const sofia = { "x-user-id": "student-id" }, carlos = { "x-user-id": "teacher-id" };
    const created = await createLmsNotification("student-id", { type: "MESSAGE", title: "Nuevo mensaje", message: "Proyecto", severity: "INFO", resourceType: "MESSAGE", resourceReference: "message-1" });
    assert.equal(created.created, true);
    assert.equal((await createLmsNotification("student-id", { type: "MESSAGE", title: "Duplicado", message: "Proyecto", severity: "INFO", resourceType: "MESSAGE", resourceReference: "message-1" })).code, "DUPLICATE_NOTIFICATION");
    const list = await fetch(`${url}/api/notifications?limit=10`, { headers: sofia }); assert.equal(list.status, 200); const body = await list.json(); assert.equal(body.source, "LMS"); assert.equal(body.notifications.length, 1); assert.doesNotMatch(JSON.stringify(body), /password|token|secret/i);
    assert.equal((await (await fetch(`${url}/api/notifications/unread-count`, { headers: sofia })).json()).unreadCount, 1);
    assert.equal((await (await fetch(`${url}/api/notifications`, { headers: carlos })).json()).notifications.length, 0);
    assert.equal((await fetch(`${url}/api/notifications/${created.notification.id}/read`, { method: "PATCH", headers: carlos })).status, 403);
    assert.equal((await fetch(`${url}/api/notifications/${created.notification.id}/read`, { method: "PATCH", headers: sofia })).status, 200);
    assert.equal((await (await fetch(`${url}/api/notifications/unread-count`, { headers: sofia })).json()).unreadCount, 0);
    await createLmsNotification("student-id", { type: "MESSAGE", title: "Segundo", message: "Entrega", severity: "INFO", resourceType: "MESSAGE", resourceReference: "message-2" });
    const all = await fetch(`${url}/api/notifications/read-all`, { method: "PATCH", headers: sofia }); assert.equal((await all.json()).updatedCount, 1); assert.ok(rows.every(item => item.is_read));
    assert.equal((await fetch(`${url}/api/notifications?limit=0`, { headers: sofia })).status, 400);
    assert.equal((await fetch(`${url}/api/notifications`, { headers: { "x-user-id": "missing" } })).status, 404);
    assert.equal((await fetch(`${url}/api/notifications`)).status, 401);
  });
});
