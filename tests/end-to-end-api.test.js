import assert from "node:assert/strict";
import test from "node:test";
import { getIntelligentRecommendations } from "../services/api/recommendation-api-service.js";
import { getStudentIntelligence } from "../services/api/academic-intelligence-api-service.js";

const storage = { getItem: key => key === "uboAcademicSession" ? JSON.stringify({ userId: "student-id", name: "Sofía", role: "STUDENT", source: "backend" }) : null };
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("clientes E2E preservan identidad backend, origen LMS y errores protegidos", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return response(200, url.includes("intelligence") ? { source: "LMS", risk: {}, signals: [] } : { source: "LMS", recommendations: [], recommendationStatus: "INSUFFICIENT_DATA" }); };
  const intelligence = await getStudentIntelligence({ storage, fetchImpl });
  const recommendations = await getIntelligentRecommendations({ storage, fetchImpl });
  assert.equal(intelligence.intelligence.source, "LMS");
  assert.equal(recommendations.source, "backend");
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id" && !/password|token/i.test(JSON.stringify(call))));
});
