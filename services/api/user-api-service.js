import { ACADEMIC_SESSION_STORAGE_KEY, clearAcademicSession, getAcademicSession, getCurrentSession, saveAcademicSession } from "./auth-api-service.js";

function publicUser(user) {
  if (!user || typeof user !== "object" || !user.id || !user.name || !user.role) return null;
  return { id: String(user.id), name: String(user.name), role: String(user.role) };
}

/**
 * Recupera el contexto público de la sesión backend actual. Si la API no está
 * disponible devuelve un resultado controlado para que la UI conserve su
 * perfil demo local; no lee ni transmite contraseñas.
 */
export async function getCurrentUser({ fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session) return { success: false, source: "session", message: "No hay sesión backend disponible." };

  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}/api/users/me`, {
      credentials: "include",
      headers: { "x-user-id": session.userId }
    });
    const body = await response.json().catch(() => null);
    const user = publicUser(body?.user);
    if (!response.ok || !user) {
      return { success: false, source: "backend", message: body?.message || "No fue posible obtener el perfil." };
    }
    return { success: true, source: "backend", user };
  } catch {
    return { success: false, source: "demo-fallback", message: "El perfil backend no está disponible." };
  }
}

/** Restaura una sesión backend con el perfil público sin cambiar su userId. */
export async function hydrateCurrentSession({ fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getCurrentSession({ storage });
  if (!session || session.source !== "backend") return { success: false, source: "session", message: "No hay sesión backend para restaurar." };
  const result = await getCurrentUser({ fetchImpl, baseUrl, storage });
  if (result.success && result.user.id === session.userId) {
    const restored = saveAcademicSession({ id: session.userId, name: result.user.name, role: result.user.role }, { storage, source: "backend" });
    return restored ? { success: true, source: "backend", session: restored, user: result.user } : { success: false, source: "storage", message: "No fue posible actualizar la sesión." };
  }
  if (result.source === "backend" && /no encontrado|not found/i.test(result.message || "")) clearAcademicSession({ storage });
  return result;
}

/** Exportado para permitir auditorías y pruebas del nombre de almacenamiento, sin exponer credenciales. */
export { ACADEMIC_SESSION_STORAGE_KEY };
