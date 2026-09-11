// Consulta read-only de avisos demo para Student.
// Comparte la fuente local del Profesor, sin exponer operaciones de escritura.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { TEACHER_ANNOUNCEMENT_STORAGE_KEY } from "../teacher-actions/teacher-announcement-management-service.js";

const clone = value => JSON.parse(JSON.stringify(value));

function resolveStorage(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function isRecord(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string" && typeof value.teacherId === "string"
    && typeof value.title === "string" && typeof value.content === "string" && typeof value.createdAt === "string" && typeof value.updatedAt === "string");
}
function read(storage) {
  if (!storage) return { records: [], warning: "Los avisos no están disponibles en este dispositivo." };
  try {
    const raw = storage.getItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const records = parsed.filter(isRecord);
    const warning = records.length === parsed.length ? null : "Se ignoraron avisos demo corruptos.";
    if (warning) storage.setItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(records));
    return { records, warning };
  } catch {
    try { storage.removeItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY); } catch { /* recuperación limitada */ }
    return { records: [], warning: "Los avisos demo locales estaban corruptos y se restablecieron." };
  }
}

export function getStudentAnnouncements({ studentId, storage } = {}) {
  const student = getStudentById(studentId);
  if (!student) return { available: false, announcements: [], warning: "No se encontró el estudiante solicitado." };
  const courseMap = new Map(getCoursesByStudent(student.id).map(course => [course.id, course.nombre]));
  const source = read(resolveStorage(storage));
  const announcements = source.records
    .filter(record => courseMap.has(record.courseId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .map(record => clone({ ...record, courseName: courseMap.get(record.courseId) }));
  return { available: true, announcements, warning: source.warning };
}
