// DEVELOPMENT_ONLY: bridge efímero para observar la identidad Teacher en Core.
// No lee ni escribe sesión, permisos, rutas, DOM o almacenamiento de UBO.

import { normalizeDemoIdentity } from "../../core/demo-identity-session.js";

const CANARY_TEACHER = Object.freeze({ id: "teacher-carlos-perez", role: "TEACHER" });
const CORE_IDENTITY_MODULE_URL = "http://127.0.0.1:3101/core/identity-snapshot.js";
const DEFAULT_TIMEOUT_MS = 1500;

function freezeResult(identity, result, errorCategory = null) {
  return Object.freeze({
    CANARY_STATE: "OBSERVED",
    id: identity?.id ?? null,
    role: identity?.role ?? null,
    result,
    errorCategory
  });
}

function isTeacherCanaryIdentity(identity) {
  return identity?.id === CANARY_TEACHER.id && identity.role === CANARY_TEACHER.role;
}

function classifyFailure(error) {
  if (error?.canaryCategory) return error.canaryCategory;
  if (error?.name === "TimeoutError") return "CORE_TIMEOUT";
  if (/cors/i.test(String(error?.message || ""))) return "CORE_CORS_ERROR";
  return "CORE_BROWSER_UNAVAILABLE";
}

function observe(result) {
  // Diagnóstico mínimo permitido: no incluye sesión, almacenamiento ni datos académicos.
  console.info("CORE_IDENTITY_CANARY", result);
  return result;
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error("Core identity module timed out");
      error.name = "TimeoutError";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function adaptTeacherIdentityForCore(identity) {
  const normalized = normalizeDemoIdentity(identity);
  if (!normalized) throw new TypeError("La identidad UBO no es válida para el canario.");
  return Object.freeze({ id: normalized.id, roles: Object.freeze([normalized.role]) });
}

async function loadCoreIdentityModule() {
  const controller = new AbortController();
  const availabilityTimeout = setTimeout(() => controller.abort(), 400);
  let response;
  try {
    response = await fetch(CORE_IDENTITY_MODULE_URL, { cache: "no-store", signal: controller.signal });
  } catch {
    const error = new Error("Core identity module unavailable");
    error.canaryCategory = "CORE_BROWSER_UNAVAILABLE";
    throw error;
  } finally {
    clearTimeout(availabilityTimeout);
  }

  if (!response.ok) {
    const error = new Error(`Core identity module responded ${response.status}`);
    error.canaryCategory = "CORE_BROWSER_UNAVAILABLE";
    throw error;
  }

  return import(CORE_IDENTITY_MODULE_URL);
}

/**
 * Observa un IdentitySnapshot real de Core sin entregar ninguna decisión al runtime UBO.
 * `loadCoreModule` y `adaptIdentity` existen solo para pruebas controladas y no persisten estado.
 */
export async function observeCoreIdentityCanary(uboIdentity, options = {}) {
  const identity = normalizeDemoIdentity(uboIdentity);
  const enabled = options.enabled === true;

  if (!enabled) return observe(freezeResult(identity, "CANARY_OFF_LEGACY_PATH_OK"));
  if (!isTeacherCanaryIdentity(identity)) return observe(freezeResult(identity, "CORE_IDENTITY_CANARY_OUT_OF_SCOPE"));

  const loadCoreModule = options.loadCoreModule || loadCoreIdentityModule;
  const adaptIdentity = options.adaptIdentity || adaptTeacherIdentityForCore;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  let coreInput;
  try {
    coreInput = adaptIdentity(identity);
  } catch {
    return observe(freezeResult(identity, "IDENTITY_ADAPTER_ERROR", "IDENTITY_ADAPTER_ERROR"));
  }

  let coreModule;
  try {
    coreModule = await withTimeout(Promise.resolve(loadCoreModule()), timeoutMs);
  } catch (error) {
    const category = classifyFailure(error);
    return observe(freezeResult(identity, category, category));
  }

  try {
    if (typeof coreModule?.createIdentitySnapshot !== "function") {
      return observe(freezeResult(identity, "IDENTITY_SNAPSHOT_INVALID", "IDENTITY_SNAPSHOT_INVALID"));
    }

    const snapshot = coreModule.createIdentitySnapshot(coreInput);
    const snapshotValid = snapshot
      && snapshot.id === identity.id
      && Array.isArray(snapshot.roles)
      && snapshot.roles.length === 1;
    if (!snapshotValid) return observe(freezeResult(identity, "IDENTITY_SNAPSHOT_INVALID", "IDENTITY_SNAPSHOT_INVALID"));
    if (snapshot.roles[0] !== identity.role) {
      return observe(freezeResult(identity, "IDENTITY_CANARY_MISMATCH", "IDENTITY_CANARY_MISMATCH"));
    }

    return observe(freezeResult(identity, "IDENTITY_CANARY_MATCH"));
  } catch {
    return observe(freezeResult(identity, "IDENTITY_SNAPSHOT_INVALID", "IDENTITY_SNAPSHOT_INVALID"));
  }
}

export const CORE_IDENTITY_CANARY_TEACHER = CANARY_TEACHER;
export const CORE_IDENTITY_CANARY_CORE_URL = CORE_IDENTITY_MODULE_URL;
