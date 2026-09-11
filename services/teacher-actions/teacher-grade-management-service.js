// Gestión local, reversible y separada de notas demo del Panel Profesor.
// Nunca escribe evaluaciones o notas institucionales existentes.

import { getCourseById } from "../course-service.js";
import { getStudentsByCourse } from "../student-service.js";

export const TEACHER_GRADE_STORAGE_KEY = "uboDemoTeacherGrades";
const MAX_ASSESSMENT_NAME_LENGTH = 80;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function teacherOwnsCourse(identity, course) {
  return Boolean(identity && identity.role === "TEACHER" && identity.id && course && course.professorId === identity.id);
}

function normalizeAssessment(value) {
  return cleanText(value).toLocaleLowerCase("es");
}

export function normalizeTeacherGrade(value) {
  if (typeof value === "number") value = String(value);
  const normalized = cleanText(value).replace(",", ".");
  if (!/^(?:[1-6](?:\.\d)?|7(?:\.0)?)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 7 ? Number(parsed.toFixed(1)) : null;
}

function isStoredGrade(value) {
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

function readGrades(storage) {
  if (!storage) return { records: [], warning: "El almacenamiento local no está disponible." };
  try {
    const raw = storage.getItem(TEACHER_GRADE_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const records = parsed.filter(isStoredGrade).map(record => ({ ...record, value: normalizeTeacherGrade(record.value) }));
    const warning = records.length === parsed.length ? null : "Se ignoraron registros de notas demo corruptos.";
    if (warning) storage.setItem(TEACHER_GRADE_STORAGE_KEY, JSON.stringify(records));
    return { records, warning };
  } catch {
    try { storage.removeItem(TEACHER_GRADE_STORAGE_KEY); } catch { /* recuperación limitada */ }
    return { records: [], warning: "Las notas demo locales estaban corruptas y se restablecieron." };
  }
}

function writeGrades(records, storage) {
  if (!storage) return { saved: false, errors: ["El almacenamiento local no está disponible."] };
  try {
    storage.setItem(TEACHER_GRADE_STORAGE_KEY, JSON.stringify(records));
    return { saved: true, errors: [] };
  } catch {
    return { saved: false, errors: ["No fue posible guardar las notas demo en este dispositivo."] };
  }
}

function nextId(records, now) {
  const stamp = new Date(now).getTime();
  let number = 1;
  let id = `teacher-grade-${stamp}-${number}`;
  while (records.some(record => record.id === id)) id = `teacher-grade-${stamp}-${++number}`;
  return id;
}

export function validateTeacherGrade(data = {}) {
  const errors = [];
  const course = getCourseById(data.courseId);
  const assessmentName = cleanText(data.assessmentName);
  const value = normalizeTeacherGrade(data.value);
  const student = course?.studentIds.includes(data.studentId)
    ? getStudentsByCourse(course.id).find(item => item.id === data.studentId)
    : null;

  if (!course) errors.push("El curso solicitado no existe.");
  if (!teacherOwnsCourse(data.identity, course)) errors.push("Solo el profesor asignado puede gestionar notas de este curso.");
  if (!assessmentName) errors.push("El nombre de la evaluación es obligatorio.");
  if (assessmentName.length > MAX_ASSESSMENT_NAME_LENGTH) errors.push(`El nombre de la evaluación no puede superar ${MAX_ASSESSMENT_NAME_LENGTH} caracteres.`);
  if (!student) errors.push("El estudiante no pertenece al curso indicado.");
  if (value === null) errors.push("Ingresa una nota válida. El rango permitido es de 1,0 a 7,0.");

  return {
    valid: errors.length === 0,
    errors,
    grade: errors.length ? null : { courseId: course.id, studentId: student.id, assessmentName, value }
  };
}

export function getTeacherCourseGrades({ courseId, identity, storage } = {}) {
  const course = getCourseById(courseId);
  if (!course) return { allowed: false, grades: [], warning: "El curso solicitado no existe." };
  if (!teacherOwnsCourse(identity, course)) return { allowed: false, grades: [], warning: "No tienes autorización docente para gestionar notas de este curso." };
  const source = readGrades(resolveStorage(storage));
  return {
    allowed: true,
    grades: source.records.filter(record => record.courseId === courseId && record.teacherId === identity.id).map(clone),
    warning: source.warning
  };
}

export function createTeacherGrade({ courseId, studentId, assessmentName, value, identity, storage, now = new Date().toISOString() } = {}) {
  const validation = validateTeacherGrade({ courseId, studentId, assessmentName, value, identity });
  if (!validation.valid) return { created: false, grade: null, errors: validation.errors };
  const targetStorage = resolveStorage(storage);
  const source = readGrades(targetStorage);
  if (!targetStorage) return { created: false, grade: null, errors: [source.warning] };
  const duplicate = source.records.some(record => record.courseId === courseId && record.studentId === studentId
    && record.teacherId === identity.id && normalizeAssessment(record.assessmentName) === normalizeAssessment(validation.grade.assessmentName));
  if (duplicate) return { created: false, grade: null, errors: ["El estudiante ya tiene esta evaluación."] };

  const grade = {
    id: nextId(source.records, now),
    ...validation.grade,
    teacherId: identity.id,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString()
  };
  const persisted = writeGrades([...source.records, grade], targetStorage);
  return persisted.saved ? { created: true, grade: clone(grade), errors: [] } : { created: false, grade: null, errors: persisted.errors };
}

export function updateTeacherGrade({ id, courseId, studentId, assessmentName, value, identity, storage, now = new Date().toISOString() } = {}) {
  const validation = validateTeacherGrade({ courseId, studentId, assessmentName, value, identity });
  if (!validation.valid) return { updated: false, grade: null, errors: validation.errors };
  const targetStorage = resolveStorage(storage);
  const source = readGrades(targetStorage);
  if (!targetStorage) return { updated: false, grade: null, errors: [source.warning] };
  const existing = source.records.find(record => record.id === id && record.courseId === courseId && record.teacherId === identity.id);
  if (!existing) return { updated: false, grade: null, errors: ["La nota demo seleccionada no existe."] };
  const duplicate = source.records.some(record => record.id !== id && record.courseId === courseId && record.studentId === studentId
    && record.teacherId === identity.id && normalizeAssessment(record.assessmentName) === normalizeAssessment(validation.grade.assessmentName));
  if (duplicate) return { updated: false, grade: null, errors: ["El estudiante ya tiene esta evaluación."] };

  const grade = { ...existing, ...validation.grade, updatedAt: new Date(now).toISOString() };
  const persisted = writeGrades(source.records.map(record => record.id === id ? grade : record), targetStorage);
  return persisted.saved ? { updated: true, grade: clone(grade), errors: [] } : { updated: false, grade: null, errors: persisted.errors };
}

export function deleteTeacherGrade({ id, courseId, identity, storage } = {}) {
  const course = getCourseById(courseId);
  if (!course) return { deleted: false, errors: ["El curso solicitado no existe."] };
  if (!teacherOwnsCourse(identity, course)) return { deleted: false, errors: ["Solo el profesor asignado puede eliminar notas de este curso."] };
  const targetStorage = resolveStorage(storage);
  const source = readGrades(targetStorage);
  if (!targetStorage) return { deleted: false, errors: [source.warning] };
  const grade = source.records.find(record => record.id === id && record.courseId === courseId && record.teacherId === identity.id);
  if (!grade) return { deleted: false, errors: ["La nota demo seleccionada no existe."] };
  const persisted = writeGrades(source.records.filter(record => record.id !== id), targetStorage);
  return persisted.saved ? { deleted: true, grade: clone(grade), errors: [] } : { deleted: false, errors: persisted.errors };
}
