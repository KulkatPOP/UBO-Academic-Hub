// Fachada de compatibilidad para vistas institucionales legacy.
// La única sesión persistente vigente es uboAcademicSession.

import { getCurrentSession, saveAcademicSession, clearAcademicSession } from "./api/auth-api-service.js";
import { demoUsers } from "../data/users.js";

const LEGACY_INSTITUTIONAL_SESSION_KEY = "uboInstitutionalSessionV1";

function storageFor(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function uiMetadata(session) {
  if (!session) return null;
  const demoUser = demoUsers.find(user => user.role === session.role && (user.displayName === session.name || user.nombre === session.name))
    || demoUsers.find(user => user.role === session.role);
  return {
    userId: session.userId,
    id: session.id,
    name: session.name,
    nombre: session.name,
    role: session.role,
    source: session.source,
    username: demoUser?.username || "",
    profile: demoUser?.profile || "",
    email: demoUser?.displayEmail || demoUser?.email || ""
  };
}

export function createInstitutionalSession(user, { source = "demo", userId } = {}) {
  const id = userId || user?.userId || user?.id;
  const name = user?.displayName || user?.nombre || user?.name;
  if (!id || !name || !["STUDENT", "TEACHER", "ADMIN"].includes(user?.role)) return null;
  return { userId: String(id), id: String(id), name: String(name), role: user.role, source };
}

export function setInstitutionalSession(user, options = {}) {
  const session = createInstitutionalSession(user, options);
  return session ? uiMetadata(saveAcademicSession(session, { storage: options.storage, source: session.source })) : null;
}

export function getInstitutionalSession(options = {}) {
  const storage = storageFor(options.storage);
  const current = getCurrentSession({ storage });
  if (current) return uiMetadata(current);
  try {
    const legacy = JSON.parse(storage?.getItem(LEGACY_INSTITUTIONAL_SESSION_KEY) || "null");
    const migrated = createInstitutionalSession(legacy, { source: "demo" });
    if (!migrated) return null;
    storage?.removeItem(LEGACY_INSTITUTIONAL_SESSION_KEY);
    return uiMetadata(saveAcademicSession(migrated, { storage, source: "demo" }));
  } catch { return null; }
}

export function clearInstitutionalSession(options = {}) {
  const storage = storageFor(options.storage);
  try { storage?.removeItem(LEGACY_INSTITUTIONAL_SESSION_KEY); } catch { /* cleanup best effort */ }
  return clearAcademicSession({ storage });
}

/** Alias histórico; no representa una segunda sesión. */
export const INSTITUTIONAL_SESSION_STORAGE_KEY = "uboAcademicSession";
