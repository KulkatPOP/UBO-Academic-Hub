// Gestión local y reversible de materiales creados desde el Panel Profesor.
// No reemplaza los materiales institucionales ni persiste credenciales.

import { getCourseById } from "../course-service.js";

export const TEACHER_MATERIAL_STORAGE_KEY = "uboDemoTeacherMaterials";
export const TEACHER_MATERIAL_TYPES = Object.freeze([
  "DOCUMENTO", "PRESENTACIÓN", "VIDEO", "GUÍA", "OTRO"
]);

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function isTeacherForCourse(identity, course) {
  return Boolean(identity && identity.role === "TEACHER" && identity.id && course && course.professorId === identity.id);
}

function isStoredMaterial(value) {
  return Boolean(value
    && typeof value.id === "string"
    && typeof value.courseId === "string"
    && typeof value.teacherId === "string"
    && typeof value.title === "string"
    && typeof value.description === "string"
    && TEACHER_MATERIAL_TYPES.includes(value.type)
    && typeof value.createdAt === "string");
}

function readMaterials(storage) {
  if (!storage) return { records: [], warning: "El almacenamiento local no está disponible." };

  try {
    const raw = storage.getItem(TEACHER_MATERIAL_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato de material inválido.");
    const records = parsed.filter(isStoredMaterial);
    const warning = records.length === parsed.length ? null : "Se ignoraron registros de material corruptos.";
    if (warning) storage.setItem(TEACHER_MATERIAL_STORAGE_KEY, JSON.stringify(records));
    return { records, warning };
  } catch {
    try { storage.removeItem(TEACHER_MATERIAL_STORAGE_KEY); } catch { /* almacenamiento no recuperable */ }
    return { records: [], warning: "Los datos locales de material estaban corruptos y se restablecieron." };
  }
}

function writeMaterials(records, storage) {
  if (!storage) return { saved: false, errors: ["El almacenamiento local no está disponible."] };
  try {
    storage.setItem(TEACHER_MATERIAL_STORAGE_KEY, JSON.stringify(records));
    return { saved: true, errors: [] };
  } catch {
    return { saved: false, errors: ["No fue posible guardar el material en este dispositivo."] };
  }
}

function nextId(records, now) {
  const timestamp = new Date(now).getTime();
  let index = 1;
  let id = `teacher-material-${timestamp}-${index}`;
  while (records.some(record => record.id === id)) id = `teacher-material-${timestamp}-${++index}`;
  return id;
}

export function validateTeacherMaterial(data = {}) {
  const errors = [];
  const course = getCourseById(data.courseId);
  const identity = data.identity || null;
  const title = cleanText(data.title);
  const description = cleanText(data.description);
  const type = cleanText(data.type);

  if (!course) errors.push("El curso solicitado no existe.");
  if (!isTeacherForCourse(identity, course)) errors.push("Solo el profesor asignado puede gestionar el material de este curso.");
  if (!title) errors.push("El título es obligatorio.");
  if (title.length > MAX_TITLE_LENGTH) errors.push(`El título no puede superar ${MAX_TITLE_LENGTH} caracteres.`);
  if (description.length > MAX_DESCRIPTION_LENGTH) errors.push(`La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`);
  if (!TEACHER_MATERIAL_TYPES.includes(type)) errors.push("Selecciona un tipo de material válido.");

  return {
    valid: errors.length === 0,
    errors,
    material: errors.length ? null : { courseId: course.id, title, description, type }
  };
}

export function getTeacherCourseMaterials({ courseId, identity, storage } = {}) {
  const course = getCourseById(courseId);
  if (!course) return { allowed: false, materials: [], warning: "El curso solicitado no existe." };
  if (!isTeacherForCourse(identity, course)) {
    return { allowed: false, materials: [], warning: "No tienes autorización docente para gestionar este curso." };
  }

  const source = readMaterials(resolveStorage(storage));
  return {
    allowed: true,
    materials: source.records
      .filter(record => record.courseId === course.id && record.teacherId === identity.id)
      .map(clone),
    warning: source.warning
  };
}

export function createTeacherMaterial({ courseId, title, description, type, identity, storage, now = new Date().toISOString() } = {}) {
  const validation = validateTeacherMaterial({ courseId, title, description, type, identity });
  if (!validation.valid) return { created: false, material: null, errors: validation.errors };

  const targetStorage = resolveStorage(storage);
  const source = readMaterials(targetStorage);
  if (!targetStorage) return { created: false, material: null, errors: [source.warning] };
  const duplicate = source.records.some(record => record.courseId === courseId
    && record.teacherId === identity.id
    && record.title.toLocaleLowerCase("es") === validation.material.title.toLocaleLowerCase("es"));
  if (duplicate) return { created: false, material: null, errors: ["Ya existe un material local con ese título en este curso."] };

  const material = {
    id: nextId(source.records, now),
    ...validation.material,
    teacherId: identity.id,
    createdAt: new Date(now).toISOString()
  };
  const persisted = writeMaterials([...source.records, material], targetStorage);
  return persisted.saved
    ? { created: true, material: clone(material), errors: [], warning: source.warning }
    : { created: false, material: null, errors: persisted.errors };
}

export function deleteTeacherMaterial({ courseId, materialId, identity, storage } = {}) {
  const course = getCourseById(courseId);
  if (!course) return { deleted: false, errors: ["El curso solicitado no existe."] };
  if (!isTeacherForCourse(identity, course)) {
    return { deleted: false, errors: ["Solo el profesor asignado puede eliminar material de este curso."] };
  }

  const targetStorage = resolveStorage(storage);
  const source = readMaterials(targetStorage);
  if (!targetStorage) return { deleted: false, errors: [source.warning] };
  const material = source.records.find(record => record.id === materialId
    && record.courseId === courseId
    && record.teacherId === identity.id);
  if (!material) return { deleted: false, errors: ["El material local seleccionado no existe o no pertenece a este curso."] };

  const persisted = writeMaterials(source.records.filter(record => record.id !== material.id), targetStorage);
  return persisted.saved
    ? { deleted: true, material: clone(material), errors: [], warning: source.warning }
    : { deleted: false, errors: persisted.errors };
}
