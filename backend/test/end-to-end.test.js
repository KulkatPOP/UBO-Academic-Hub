import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("el grafo LMS expone los pasos E2E sin crear una API agregada", async () => {
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    for (const path of ["/api/courses", "/api/progress/student/course", "/api/intelligence/student", "/api/recommendations/intelligent", "/api/tutor/ask"]) {
      const response = await fetch(`${base}${path}`, { method: path.endsWith("/ask") ? "POST" : "GET" });
      assert.notEqual(response.status, 404, `${path} debe pertenecer al flujo existente`);
    }
    const aggregate = await fetch(`${base}/api/student/complete`);
    assert.equal(aggregate.status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
