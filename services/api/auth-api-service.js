import { findInstitutionalDemoUser } from "../../data/users.js";

export const ACADEMIC_SESSION_STORAGE_KEY = "uboAcademicSession";
const ALLOWED_ROLES = new Set(["STUDENT", "TEACHER", "ADMIN"]);
const ALLOWED_SOURCES = new Set(["backend", "demo"]);

function storageFor(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function publicUser(user) {
  if (!user || typeof user !== "object" || !user.id || !user.name || !ALLOWED_ROLES.has(user.role)) return null;
  return { id: String(user.id), name: String(user.name), role: user.role };
}

export function getCurrentSession({ storage } = {}) {
  const target = storageFor(storage);
  if (!target) return null;
  try {
    const parsed = JSON.parse(target.getItem(ACADEMIC_SESSION_STORAGE_KEY) || "null");
    const user = publicUser({ id: parsed?.userId || parsed?.id, name: parsed?.name, role: parsed?.role });
    const source = typeof parsed?.source === "string" ? parsed.source : "";
    return user && ALLOWED_SOURCES.has(source) ? { ...user, userId: user.id, source } : null;
  } catch {
    return null;
  }
}

/** Clientes API usan exclusivamente la identidad backend; una sesión demo no llama APIs privadas. */
export function getAcademicSession(options = {}) {
  const session = getCurrentSession(options);
  return session?.source === "backend" ? session : null;
}

export function getCurrentUserId(options = {}) {
  return getCurrentSession(options)?.userId || null;
}

export function getSessionSource(options = {}) {
  return getCurrentSession(options)?.source || null;
}

export function saveAcademicSession(user, { storage, source = "backend" } = {}) {
  const safeUser = publicUser(user);
  const target = storageFor(storage);
  if (!safeUser || !target || !ALLOWED_SOURCES.has(source)) return null;
  const session = { ...safeUser, userId: safeUser.id, source };
  try { target.setItem(ACADEMIC_SESSION_STORAGE_KEY, JSON.stringify(session)); return { ...session }; } catch { return null; }
}

export function clearAcademicSession({ storage } = {}) {
  try { storageFor(storage)?.removeItem(ACADEMIC_SESSION_STORAGE_KEY); } catch { /* cierre local controlado */ }
}

/** Consulta el backend y conserva el login demo sólo ante una indisponibilidad de red/API. */
export async function login(username, password, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001" } = {}) {
  const normalizedUsername = typeof username === "string" ? username.trim().toLocaleLowerCase("es-CL") : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  if (!normalizedUsername || !normalizedPassword) return { success: false, source: null, message: "Credenciales inválidas" };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) return { success: false, source: "backend", message: body?.message || "Credenciales inválidas" };
    const user = publicUser(body.user);
    return user ? { success: true, source: "backend", user } : { success: false, source: "backend", message: "Respuesta de autenticación inválida" };
  } catch {
    const user = findInstitutionalDemoUser(normalizedUsername, normalizedPassword);
    return user
      ? { success: true, source: "demo-fallback", user: { id: user.id, name: user.displayName || user.nombre, role: user.role } }
      : { success: false, source: "demo-fallback", message: "Credenciales inválidas" };
  }
}

/** Revoca la cookie HttpOnly en el backend; nunca lee ni persiste su valor. */
export async function logout({ fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001" } = {}) {
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    return { success: response.status === 204, status: response.status };
  } catch {
    return { success: false, status: null };
  }
}
