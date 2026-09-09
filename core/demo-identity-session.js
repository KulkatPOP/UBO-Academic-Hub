// Frontera interna y reversible de identidad demo UBO.
// No sustituye uboSession ni se conecta a UniEcosystemCore.

import { demoUsers } from "../data/users.js";
import { clearSession, getCurrentUser, setCurrentUser } from "./session.js";

const DEMO_IDENTITY_STORAGE_KEY = "uboDemoIdentityV1";
// Evita que una sesión legacy todavía abierta reconstruya una identidad demo
// durante el mismo ciclo de navegación después de un logout explícito.
// No se persiste: uboSession continúa siendo un mecanismo independiente.
let legacyFallbackSuppressed = false;

function cloneIdentity(identity) {
  return identity ? { id: identity.id, role: identity.role } : null;
}

export function normalizeDemoIdentity(candidate) {
  if (!candidate?.id || !candidate?.role) return null;
  const user = demoUsers.find(item => item.id === candidate.id && item.role === candidate.role);
  return user ? { id: user.id, role: user.role } : null;
}

function browserSessionStorage() {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function readStoredIdentity(storage) {
  if (!storage) return { present: false, identity: null };

  try {
    const serialized = storage.getItem(DEMO_IDENTITY_STORAGE_KEY);
    if (serialized === null) return { present: false, identity: null };
    return { present: true, identity: normalizeDemoIdentity(JSON.parse(serialized)) };
  } catch {
    return { present: true, identity: null };
  }
}

function writeStoredIdentity(identity, storage) {
  if (!storage) return;
  storage.setItem(DEMO_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
}

function clearStoredIdentity(storage) {
  storage?.removeItem(DEMO_IDENTITY_STORAGE_KEY);
}

// Adaptación de lectura: la identidad estudiantil se deriva del contenido ya
// existente de uboSession, sin guardar contraseñas ni crear una sesión legacy nueva.
export function resolveLegacyStudentIdentity(legacySession) {
  if (!legacySession?.loggedIn || !legacySession?.studentData?.email) return null;
  const user = demoUsers.find(item => item.role === "STUDENT" && item.email === legacySession.studentData.email);
  return user ? { id: user.id, role: user.role } : null;
}

function readLegacyStudentIdentity() {
  try {
    const serialized = typeof localStorage === "undefined" ? null : localStorage.getItem("uboSession");
    return resolveLegacyStudentIdentity(serialized ? JSON.parse(serialized) : null);
  } catch {
    return null;
  }
}

// La selección explícita del entorno demo tiene prioridad dentro de ese entorno.
// Sin selección, una sesión legacy válida de estudiante se adapta en modo lectura.
export function getCurrentDemoIdentity(options = {}) {
  const storage = options.storage === undefined ? browserSessionStorage() : options.storage;
  const stored = readStoredIdentity(storage);
  if (stored.present) {
    if (!stored.identity) {
      clearSession();
      return null;
    }
    legacyFallbackSuppressed = false;
    setCurrentUser(stored.identity);
    return cloneIdentity(stored.identity);
  }

  if (legacyFallbackSuppressed) return null;

  const inMemory = normalizeDemoIdentity(getCurrentUser());
  if (inMemory) return cloneIdentity(inMemory);

  const legacyStudent = Object.hasOwn(options, "legacySession")
    ? resolveLegacyStudentIdentity(options.legacySession)
    : readLegacyStudentIdentity();
  if (legacyStudent) {
    setCurrentUser(legacyStudent);
    return cloneIdentity(legacyStudent);
  }

  return null;
}

export function setCurrentDemoIdentity(identity, options = {}) {
  const storage = options.storage === undefined ? browserSessionStorage() : options.storage;
  const normalized = normalizeDemoIdentity(identity);
  if (!normalized) {
    clearStoredIdentity(storage);
    clearSession();
    legacyFallbackSuppressed = true;
    return null;
  }

  writeStoredIdentity(normalized, storage);
  legacyFallbackSuppressed = false;
  setCurrentUser(normalized);
  return cloneIdentity(normalized);
}

export function clearCurrentDemoIdentity(options = {}) {
  const storage = options.storage === undefined ? browserSessionStorage() : options.storage;
  clearStoredIdentity(storage);
  clearSession();
  legacyFallbackSuppressed = true;
  return null;
}

export const DEMO_IDENTITY_SESSION_KEY = DEMO_IDENTITY_STORAGE_KEY;
