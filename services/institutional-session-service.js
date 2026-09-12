// Sesión institucional simulada de UBO Academic Hub.
// Persiste únicamente información pública de los usuarios DEMO; nunca contraseñas.

const INSTITUTIONAL_SESSION_KEY = "uboInstitutionalSessionV1";
const allowedRoles = new Set(["STUDENT", "TEACHER", "ADMIN"]);

function cloneSession(session) {
  return session ? { ...session } : null;
}

function getStorage(storage) {
  if (storage !== undefined) return storage;

  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function normalizeSession(value) {
  if (!value || typeof value !== "object") return null;
  if (!value.username || !value.nombre || !value.role || !value.profile) return null;
  if (!allowedRoles.has(value.role)) return null;

  return {
    username: String(value.username),
    nombre: String(value.nombre),
    name: String(value.nombre),
    role: value.role,
    profile: String(value.profile),
    email: value.email ? String(value.email) : ""
  };
}

export function createInstitutionalSession(user) {
  return normalizeSession({
    username: user?.username,
    nombre: user?.displayName || user?.nombre,
    role: user?.role,
    profile: user?.profile,
    email: user?.displayEmail || user?.email
  });
}

export function setInstitutionalSession(user, options = {}) {
  const session = createInstitutionalSession(user);
  const storage = getStorage(options.storage);

  if (!session || !storage) return null;

  try {
    storage.setItem(INSTITUTIONAL_SESSION_KEY, JSON.stringify(session));
    return cloneSession(session);
  } catch {
    return null;
  }
}

export function getInstitutionalSession(options = {}) {
  const storage = getStorage(options.storage);
  if (!storage) return null;

  try {
    const serialized = storage.getItem(INSTITUTIONAL_SESSION_KEY);
    if (!serialized) return null;
    const session = normalizeSession(JSON.parse(serialized));
    if (!session) storage.removeItem(INSTITUTIONAL_SESSION_KEY);
    return cloneSession(session);
  } catch {
    return null;
  }
}

export function clearInstitutionalSession(options = {}) {
  const storage = getStorage(options.storage);
  try {
    storage?.removeItem(INSTITUTIONAL_SESSION_KEY);
  } catch {
    // Un almacenamiento no disponible no debe impedir el cierre de sesión DEMO.
  }
  return null;
}

export const INSTITUTIONAL_SESSION_STORAGE_KEY = INSTITUTIONAL_SESSION_KEY;
