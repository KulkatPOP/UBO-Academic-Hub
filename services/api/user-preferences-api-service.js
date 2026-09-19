import { getAcademicSession } from "./auth-api-service.js";

function resolveSession(storage) {
  return getAcademicSession({ storage });
}

async function request(path, options = {}, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = resolveSession(storage);
  if (!session?.userId) return { available: false, source: "demo-fallback", preferences: null };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: { ...(options.headers || {}), "x-user-id": session.userId }
    });
    const body = await response.json().catch(() => null);
    return response.ok && body?.source === "LMS"
      ? { available: true, source: "LMS", preferences: body.preferences ?? null }
      : { available: false, source: "backend", preferences: null, error: body?.error || "PREFERENCES_UNAVAILABLE" };
  } catch {
    return { available: false, source: "demo-fallback", preferences: null };
  }
}

export function getUserPreferences(options = {}) {
  return request("/api/user/preferences", {}, options);
}

export function updateUserPreferences(preferences, options = {}) {
  return request("/api/user/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences)
  }, options);
}
