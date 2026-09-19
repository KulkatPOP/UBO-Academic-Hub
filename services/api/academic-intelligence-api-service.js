import { getAcademicSession } from "./auth-api-service.js";

const clone = value => value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;

async function request(path, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session?.userId) return { available: false, source: "demo-fallback", status: null, body: null, message: "No hay sesión backend disponible." };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}${path}`, { credentials: "include", headers: { "x-user-id": session.userId } });
    const body = await response.json().catch(() => null);
    return response.ok && body?.source === "LMS"
      ? { available: true, source: "LMS", status: response.status, body: clone(body), message: null }
      : { available: false, source: "backend", status: response.status, body: clone(body), message: body?.message || "Inteligencia LMS no disponible." };
  } catch {
    return { available: false, source: "demo-fallback", status: null, body: null, message: "La API de inteligencia académica no está disponible." };
  }
}

export async function getStudentIntelligence({ fallback = null, ...options } = {}) {
  const result = await request("/api/intelligence/student", options);
  return { ...result, intelligence: result.available ? clone(result.body) : clone(fallback) };
}

export async function getStudentCourseIntelligence(courseId, { fallback = null, ...options } = {}) {
  const result = await request(`/api/intelligence/student/${encodeURIComponent(courseId)}`, options);
  return { ...result, intelligence: result.available ? clone(result.body) : clone(fallback) };
}
