import { getAcademicSession } from "./auth-api-service.js";

function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

async function request(path, options, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session?.userId) return { available: false, source: "demo-fallback", status: null, body: null, message: "No hay sesión backend disponible." };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: { ...(options?.headers || {}), "x-user-id": session.userId }
    });
    const body = await response.json().catch(() => null);
    return response.ok
      ? { available: true, source: "backend", status: response.status, body, message: null }
      : { available: false, source: "backend", status: response.status, body, message: body?.message || "No fue posible consultar recomendaciones." };
  } catch {
    return { available: false, source: "demo-fallback", status: null, body: null, message: "La API de recomendaciones no está disponible." };
  }
}

/** API primero; conserva el resultado del recomendador DEMO cuando la API no está disponible. */
export async function getRecommendations({ fallback = [], ...options } = {}) {
  const result = await request("/api/recommendations", { method: "GET" }, options);
  const recommendations = result.available && Array.isArray(result.body?.recommendations)
    ? clone(result.body.recommendations)
    : clone(fallback);
  return { ...result, recommendations };
}

/** Genera recomendaciones derivadas sin enviar studentId, rol ni contraseña. */
export async function generateRecommendations({ fallback = [], ...options } = {}) {
  const result = await request("/api/recommendations/generate", { method: "POST" }, options);
  const recommendations = result.available && Array.isArray(result.body?.recommendations)
    ? clone(result.body.recommendations)
    : clone(fallback);
  return {
    ...result,
    generated: result.available ? result.body?.generated === true : false,
    dataSufficient: result.available ? result.body?.dataSufficient === true : false,
    warnings: result.available && Array.isArray(result.body?.warnings) ? clone(result.body.warnings) : [],
    recommendations
  };
}

/** Consulta decisiones LMS explicables; 401 y 403 no activan fallback DEMO. */
export async function getIntelligentRecommendations({ courseId = null, fallback = [], ...options } = {}) {
  const path = courseId ? `/api/recommendations/intelligent/${encodeURIComponent(courseId)}` : "/api/recommendations/intelligent";
  const result = await request(path, { method: "GET" }, options);
  const protectedFailure = result.source === "backend" && [401, 403].includes(result.status);
  const recommendations = result.available && Array.isArray(result.body?.recommendations)
    ? clone(result.body.recommendations)
    : protectedFailure ? [] : clone(fallback);
  return {
    ...result,
    recommendations,
    recommendationStatus: result.available ? result.body?.recommendationStatus || "INSUFFICIENT_DATA" : protectedFailure ? "UNAUTHORIZED" : "demo-fallback"
  };
}
