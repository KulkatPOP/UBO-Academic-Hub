// Consulta read-only de notas demo para Student.
// Reutiliza la fuente local gestionada por Profesor, sin exponer escrituras.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { normalizeTeacherGrade, TEACHER_GRADE_STORAGE_KEY } from "../teacher-actions/teacher-grade-management-service.js";

const clone = value => JSON.parse(JSON.stringify(value));

function resolveStorage(storage) {
  try { return storage || globalThis.localStorage || null; } catch { return storage || null; }
}

function isRecord(value) {
  return Boolean(value
    && typeof value.id === "string"
    && typeof value.courseId === "string"
    && typeof value.studentId === "string"
    && typeof value.teacherId === "string"
    && typeof value.assessmentName === "string"
    && normalizeTeacherGrade(value.value) !== null
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string");
}

function read(storage) {
  if (!storage) return { records: [], warning: "No se pudieron cargar las notas demo." };
  try {
    const raw = storage.getItem(TEACHER_GRADE_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const records = parsed.filter(isRecord);
    return {
      records,
      warning: records.length === parsed.length ? null : "Se ignoraron notas demo con formato inválido."
    };
  } catch {
    // Student no altera un origen corrupto: Profesor conserva el control de recuperación.
    return { records: [], warning: "No se pudieron cargar las notas demo." };
  }
}

export function getStudentGrades({ studentId, courseId = null, storage } = {}) {
  const student = getStudentById(studentId);
  if (!student) return { available: false, grades: [], warning: "No se encontró el estudiante solicitado." };

  const courseMap = new Map(getCoursesByStudent(student.id).map(course => [course.id, course.nombre]));
  if (courseId && !courseMap.has(courseId)) {
    return { available: false, grades: [], warning: "No tienes acceso a las notas de este curso." };
  }

  const source = read(resolveStorage(storage));
  const grades = source.records
    .filter(record => record.studentId === student.id && courseMap.has(record.courseId) && (!courseId || record.courseId === courseId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .map(record => clone({ ...record, courseName: courseMap.get(record.courseId), value: normalizeTeacherGrade(record.value) }));

  return { available: true, grades, warning: source.warning };
}
