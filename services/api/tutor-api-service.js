import { getAcademicSession } from "./auth-api-service.js";

function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

async function request(path, options, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session) return { available: false, source: "demo-fallback", status: null, body: null, message: "No hay sesión backend disponible." };
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
      : { available: false, source: "backend", status: response.status, body, message: body?.message || "No fue posible consultar el Tutor." };
  } catch {
    return { available: false, source: "demo-fallback", status: null, body: null, message: "La API del Tutor no está disponible." };
  }
}

/** API primero; `fallback` permite conservar el resultado del Tutor DEMO en la interfaz actual. */
export async function askTutor(query, courseId, { fallback = null, legacyCourseId = null, ...options } = {}) {
  const result = await request("/api/tutor/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // courseId puede ser LMS, externo o legacy; legacyCourseId permite a la
    // UI legacy declararlo sin asumir que equivale a una referencia externa.
    body: JSON.stringify({ query, courseId, legacyCourseId })
  }, options);
  const protectedFailure = result.source === "backend" && [401, 403].includes(result.status);
  const tutor = result.available ? clone(result.body) : protectedFailure ? null : clone(fallback);
  return { ...result, tutor, context: result.available ? clone(result.body?.context || result.body?.intelligence || null) : null };
}

/** El historial backend pertenece siempre al id de la sesión; no acepta userId externo. */
export async function getTutorHistory({ fallback = [], ...options } = {}) {
  const result = await request("/api/tutor/history", { method: "GET" }, options);
  const history = result.available && Array.isArray(result.body?.history) ? clone(result.body.history) : clone(fallback);
  return { ...result, history };
}
