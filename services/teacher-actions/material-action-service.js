// Acciones futuras de material académico para Profesor.
// Mantiene referencias URL en memoria y no sube archivos físicos.

import { createMaterialModel } from "../../data/models/material-model.js";
import { getCourseById } from "../course-service.js";
import { addMaterial, getMaterialsByCourse } from "../material-service.js";
import { getStudentsByCourse } from "../student-service.js";

export const ALLOWED_MATERIAL_TYPES = ["PDF", "Presentación", "Documento", "Enlace", "Otro"];

// material-service aún no persiste URL. Este mapa temporal conserva únicamente
// las referencias válidas creadas mediante esta capa, hasta contar con backend.
const materialUrls = new Map();

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validReferenceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizedTitle(value) {
  return cleanText(value).toLocaleLowerCase("es");
}

function enrichMaterial(material) {
  return material ? { ...material, url: materialUrls.get(material.id) || material.url || "" } : null;
}

export function getCourseMaterials(courseId) {
  const course = getCourseById(courseId);
  if (!course) {
    return { course: null, materials: [], warning: "No existe el curso solicitado." };
  }

  return {
    course,
    materials: getMaterialsByCourse(courseId).map(enrichMaterial),
    warning: null
  };
}

export function prepareMaterialSubmission(courseId) {
  const course = getCourseById(courseId);
  if (!course) {
    return {
      course: null,
      students: [],
      materials: [],
      warning: "No existe el curso solicitado. No es posible preparar la carga."
    };
  }

  return {
    course,
    students: getStudentsByCourse(courseId),
    materials: getMaterialsByCourse(courseId).map(enrichMaterial),
    warning: null
  };
}

export function validateMaterialSubmission(data = {}) {
  const errors = [];
  const course = getCourseById(data.courseId);
  const title = cleanText(data.title);
  const type = cleanText(data.type);
  const url = cleanText(data.url);
  const authorId = cleanText(data.authorId || data.teacherId);

  if (!course) errors.push("El curso indicado no existe.");
  if (!title) errors.push("Debes ingresar un título para el material.");
  if (!ALLOWED_MATERIAL_TYPES.includes(type)) {
    errors.push("El tipo de material no es válido.");
  }
  if (type === "Enlace" && !url) {
    errors.push("Los materiales de tipo Enlace requieren una URL válida.");
  } else if (url && !validReferenceUrl(url)) {
    errors.push("La URL debe comenzar con http:// o https://.");
  }
  if (course && authorId && course.professorId && authorId !== course.professorId) {
    errors.push("El profesor indicado no tiene asignado este curso.");
  }

  const duplicate = course && title
    ? getMaterialsByCourse(course.id).some(material => normalizedTitle(material.title) === normalizedTitle(title))
    : false;
  if (duplicate) errors.push("Ya existe un material con ese título en este curso.");

  return {
    valid: errors.length === 0,
    errors,
    material: errors.length ? null : createMaterialModel({
      courseId: course.id,
      title,
      type,
      url
    })
  };
}

export function saveCourseMaterial(data = {}) {
  const validation = validateMaterialSubmission(data);
  if (!validation.valid) return { saved: false, ...validation };

  const stored = addMaterial({
    courseId: validation.material.courseId,
    title: validation.material.title,
    type: validation.material.type,
    description: cleanText(data.description),
    authorId: cleanText(data.authorId || data.teacherId) || null
  });
  if (validation.material.url) materialUrls.set(stored.id, validation.material.url);

  return {
    saved: true,
    material: enrichMaterial(stored),
    errors: []
  };
}
