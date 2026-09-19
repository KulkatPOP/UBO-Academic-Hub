function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

async function requestIdentity(identifier, type, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001" } = {}) {
  const value = typeof identifier === "string" || typeof identifier === "number" ? String(identifier).trim() : "";
  if (!value || typeof fetchImpl !== "function") return null;
  try {
    const query = new URLSearchParams({ identifier: value });
    if (type) query.set("type", type);
    const response = await fetchImpl(`${baseUrl}/api/course-identity/resolve?${query.toString()}`);
    if (!response.ok) return null;
    const body = await response.json();
    return body?.course ? clone(body.course) : null;
  } catch {
    return null;
  }
}

export function resolveCourse(identifier, options) {
  return requestIdentity(identifier, "", options);
}

export function resolveCourseByLegacyId(legacyId, options) {
  return requestIdentity(legacyId, "legacy", options);
}

export function resolveCourseByLmsId(lmsId, options) {
  return requestIdentity(lmsId, "lms", options);
}

export function resolveCourseByExternalId(externalId, options) {
  return requestIdentity(externalId, "external", options);
}
