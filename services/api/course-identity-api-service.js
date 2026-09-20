function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

function statusOf(response) {
  return Number.isInteger(response?.status) ? response.status : null;
}

async function requestIdentityResult(identifier, type, { fetchImpl = globalThis.fetch, baseUrl = getLocalApiBaseUrl() } = {}) {
  const value = typeof identifier === "string" || typeof identifier === "number" ? String(identifier).trim() : "";
  if (!value) return { available: false, source: "client", status: null, reason: "IDENTIFIER_REQUIRED", identity: null };
  if (!baseUrl || typeof fetchImpl !== "function") return { available: false, source: "demo-fallback", status: null, reason: "API_UNAVAILABLE", identity: null };
  try {
    const query = new URLSearchParams({ identifier: value });
    if (type) query.set("type", type);
    const response = await fetchImpl(`${baseUrl}/api/course-identity/resolve?${query.toString()}`);
    const body = await response.json().catch(() => null);
    if (response.ok && body?.course) return { available: true, source: "LMS", status: statusOf(response), reason: null, identity: clone(body.course) };
    if (statusOf(response) === 404 && body?.error === "COURSE_IDENTITY_NOT_FOUND") {
      return { available: false, source: "demo-fallback", status: 404, reason: "IDENTITY_NOT_FOUND", identity: null };
    }
    const status = statusOf(response);
    const reason = status === 401
      ? "IDENTITY_UNAUTHORIZED"
      : status === 403
        ? "IDENTITY_FORBIDDEN"
        : "IDENTITY_API_ERROR";
    return { available: false, source: "backend", status, reason, identity: null };
  } catch {
    return { available: false, source: "demo-fallback", status: null, reason: "API_UNAVAILABLE", identity: null };
  }
}

async function requestIdentity(identifier, type, options) {
  const result = await requestIdentityResult(identifier, type, options);
  return result.available ? result.identity : null;
}

export function resolveCourse(identifier, options) {
  return requestIdentity(identifier, "", options);
}

export function resolveCourseByLegacyId(legacyId, options) {
  return requestIdentity(legacyId, "legacy", options);
}

/**
 * Conserva el detalle del resultado HTTP para que Course Detail pueda usar
 * DEMO solamente cuando el backend confirma que la identidad no existe.
 */
export function resolveCourseByLegacyIdResult(legacyId, options) {
  return requestIdentityResult(legacyId, "legacy", options);
}

export function resolveCourseByLmsId(lmsId, options) {
  return requestIdentity(lmsId, "lms", options);
}

export function resolveCourseByExternalId(externalId, options) {
  return requestIdentity(externalId, "external", options);
}
import { getLocalApiBaseUrl } from "./api-environment.js";
