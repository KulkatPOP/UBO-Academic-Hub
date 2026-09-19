import assert from "node:assert/strict";
import test from "node:test";
import { getIntelligentRecommendations } from "../services/api/recommendation-api-service.js";

const storage = { getItem: key => key === "uboAcademicSession" ? JSON.stringify({ userId: "student-id", name: "Sofía", role: "STUDENT", source: "backend" }) : null };
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("consulta decisiones LMS con x-user-id y sin contraseña", async () => {
  let call;
  const result = await getIntelligentRecommendations({ storage, fetchImpl: async (url, options) => { call = { url, options }; return response(200, { source: "LMS", recommendationStatus: "AVAILABLE", recommendations: [{ type: "REVIEW_MATERIAL" }] }); } });
  assert.match(call.url, /\/api\/recommendations\/intelligent$/);
  assert.equal(call.options.headers["x-user-id"], "student-id");
  assert.equal(JSON.stringify(call), JSON.stringify(call).replace(/password/gi, ""));
  assert.equal(result.recommendations[0].type, "REVIEW_MATERIAL");
});

test("preserva fallback sólo para red y nunca para 401/403", async () => {
  const fallback = [{ type: "DEMO" }];
  const offline = await getIntelligentRecommendations({ storage, fallback, fetchImpl: async () => { throw new Error("offline"); } });
  assert.deepEqual(offline.recommendations, fallback);
  const forbidden = await getIntelligentRecommendations({ storage, fallback, fetchImpl: async () => response(403, { message: "No autorizado" }) });
  assert.deepEqual(forbidden.recommendations, []);
  assert.equal(forbidden.recommendationStatus, "UNAUTHORIZED");
});
