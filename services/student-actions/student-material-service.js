// Consulta read-only de materiales demo para Student.
// Comparte únicamente la fuente local gestionada por Profesor.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { TEACHER_MATERIAL_STORAGE_KEY, TEACHER_MATERIAL_TYPES } from "../teacher-actions/teacher-material-management-service.js";

const clone = value => JSON.parse(JSON.stringify(value));
function resolveStorage(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function isRecord(value) { return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string" && typeof value.teacherId === "string" && typeof value.title === "string" && typeof value.description === "string" && TEACHER_MATERIAL_TYPES.includes(value.type) && typeof value.createdAt === "string"); }
function read(storage) {
  if (!storage) return { records: [], warning: "No se pudo cargar el material." };
  try {
    const raw = storage.getItem(TEACHER_MATERIAL_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const records = parsed.filter(isRecord);
    const warning = records.length === parsed.length ? null : "Se ignoraron materiales demo corruptos.";
    if (warning) storage.setItem(TEACHER_MATERIAL_STORAGE_KEY, JSON.stringify(records));
    return { records, warning };
  } catch {
    try { storage.removeItem(TEACHER_MATERIAL_STORAGE_KEY); } catch { /* recuperación limitada */ }
    return { records: [], warning: "No se pudo cargar el material." };
  }
}

export function getStudentMaterials({ studentId, courseId = null, storage } = {}) {
  const student = getStudentById(studentId);
  if (!student) return { available: false, materials: [], warning: "No se encontró el estudiante solicitado." };
  const courseMap = new Map(getCoursesByStudent(student.id).map(course => [course.id, course.nombre]));
  if (courseId && !courseMap.has(courseId)) return { available: false, materials: [], warning: "No tienes acceso al material de este curso." };
  const source = read(resolveStorage(storage));
  const materials = source.records.filter(record => courseMap.has(record.courseId) && (!courseId || record.courseId === courseId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .map(record => clone({ ...record, courseName: courseMap.get(record.courseId) }));
  return { available: true, materials, warning: source.warning };
}
