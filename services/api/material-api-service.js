import { getAcademicSession } from "./auth-api-service.js";

function cloneMaterials(materials) {
  return Array.isArray(materials) ? materials.map(material => ({ ...material, keywords: Array.isArray(material.keywords) ? [...material.keywords] : [] })) : [];
}

function cloneMaterial(material) {
  return material && typeof material === "object" ? { ...material, keywords: Array.isArray(material.keywords) ? [...material.keywords] : [] } : null;
}

async function request(path, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session) return { available: false, source: "demo-fallback", status: null, body: null, message: "No hay sesión backend disponible." };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}${path}`, { credentials: "include", headers: { "x-user-id": session.userId } });
    const body = await response.json().catch(() => null);
    return response.ok
      ? { available: true, source: "backend", status: response.status, body, message: null }
      : { available: false, source: "backend", status: response.status, body, message: body?.message || "No fue posible obtener materiales." };
  } catch {
    return { available: false, source: "demo-fallback", status: null, body: null, message: "La API de materiales no está disponible." };
  }
}

export async function getCourseMaterials(courseId, { fallback = [], ...options } = {}) {
  const safeCourseId = typeof courseId === "string" ? courseId.trim() : "";
  if (!safeCourseId) return { available: false, source: "client", status: null, materials: cloneMaterials(fallback), message: "Se requiere un identificador de curso." };
  const result = await request(`/api/courses/${encodeURIComponent(safeCourseId)}/materials`, options);
  const materials = result.available && Array.isArray(result.body?.materials) ? cloneMaterials(result.body.materials) : cloneMaterials(fallback);
  return { ...result, materials };
}

export async function getMaterial(materialId, { fallback = null, ...options } = {}) {
  const safeMaterialId = typeof materialId === "string" ? materialId.trim() : "";
  if (!safeMaterialId) return { available: false, source: "client", status: null, material: cloneMaterial(fallback), message: "Se requiere un identificador de material." };
  const result = await request(`/api/materials/${encodeURIComponent(safeMaterialId)}`, options);
  const material = result.available ? cloneMaterial(result.body?.material) : cloneMaterial(fallback);
  return { ...result, material };
}
