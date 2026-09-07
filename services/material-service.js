// Servicio futuro de materiales académicos.
// Mantiene datos demo en memoria hasta su futura conexión con backend.

import { universityMaterials } from "../data/university/materials.js";

function clone(material) {
  return material ? { ...material } : null;
}

export function getMaterialsByCourse(courseId) {
  return universityMaterials
    .filter(material => material.courseId === courseId)
    .map(clone);
}

export function addMaterial(material) {
  if (!material?.courseId || !material?.title) {
    throw new TypeError("El material requiere courseId y title.");
  }

  const nextMaterial = {
    id: material.id || `material-${Date.now()}`,
    courseId: material.courseId,
    title: material.title.trim(),
    type: material.type || "Documento",
    description: material.description || "",
    publishedAt: material.publishedAt || new Date().toISOString().slice(0, 10),
    authorId: material.authorId || null
  };
  universityMaterials.push(nextMaterial);
  return clone(nextMaterial);
}
