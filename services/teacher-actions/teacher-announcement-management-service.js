// Avisos demo locales del Panel Profesor. No publica ni modifica datos institucionales.

import { getCourseById } from "../course-service.js";

export const TEACHER_ANNOUNCEMENT_STORAGE_KEY = "uboDemoTeacherAnnouncements";
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 2000;
const clone = value => JSON.parse(JSON.stringify(value));
const cleanText = value => typeof value === "string" ? value.trim() : "";

function resolveStorage(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function ownsCourse(identity, course) { return Boolean(identity && identity.role === "TEACHER" && identity.id && course && course.professorId === identity.id); }
function isRecord(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string" && typeof value.teacherId === "string"
    && typeof value.title === "string" && typeof value.content === "string" && typeof value.createdAt === "string" && typeof value.updatedAt === "string");
}
function read(storage) {
  if (!storage) return { records: [], warning: "El almacenamiento local no está disponible." };
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
function write(records, storage) {
  if (!storage) return { saved: false, errors: ["El almacenamiento local no está disponible."] };
  try { storage.setItem(TEACHER_ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(records)); return { saved: true, errors: [] }; }
  catch { return { saved: false, errors: ["No fue posible guardar los avisos demo en este dispositivo."] }; }
}
function authorized(courseId, identity) {
  const course = getCourseById(courseId);
  if (!course) return { course: null, error: "El curso solicitado no existe." };
  if (!ownsCourse(identity, course)) return { course: null, error: "Solo el profesor asignado puede gestionar avisos de este curso." };
  return { course, error: null };
}
function ordered(records) { return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)); }
function nextId(records, now) { let number = 1; let id = `teacher-announcement-${new Date(now).getTime()}-${number}`; while (records.some(record => record.id === id)) id = `teacher-announcement-${new Date(now).getTime()}-${++number}`; return id; }

export function validateTeacherAnnouncement(data = {}) {
  const { course, error } = authorized(data.courseId, data.identity);
  const title = cleanText(data.title);
  const content = cleanText(data.content);
  const errors = [];
  if (error) errors.push(error);
  if (!title) errors.push("El título del aviso es obligatorio.");
  if (!content) errors.push("El contenido del aviso es obligatorio.");
  if (title.length > MAX_TITLE_LENGTH) errors.push(`El título no puede superar ${MAX_TITLE_LENGTH} caracteres.`);
  if (content.length > MAX_CONTENT_LENGTH) errors.push(`El contenido no puede superar ${MAX_CONTENT_LENGTH} caracteres.`);
  return { valid: errors.length === 0, errors, announcement: errors.length ? null : { courseId: course.id, title, content } };
}

export function getTeacherCourseAnnouncements({ courseId, identity, storage } = {}) {
  const { course, error } = authorized(courseId, identity);
  if (!course) return { allowed: false, announcements: [], warning: error };
  const source = read(resolveStorage(storage));
  return { allowed: true, announcements: ordered(source.records.filter(record => record.courseId === course.id && record.teacherId === identity.id)).map(clone), warning: source.warning };
}

export function createTeacherAnnouncement({ courseId, title, content, identity, storage, now = new Date().toISOString() } = {}) {
  const validation = validateTeacherAnnouncement({ courseId, title, content, identity });
  if (!validation.valid) return { created: false, announcement: null, errors: validation.errors };
  const target = resolveStorage(storage), source = read(target);
  if (!target) return { created: false, announcement: null, errors: [source.warning] };
  const timestamp = new Date(now).toISOString();
  const announcement = { id: nextId(source.records, now), ...validation.announcement, teacherId: identity.id, createdAt: timestamp, updatedAt: timestamp };
  const result = write([...source.records, announcement], target);
  return result.saved ? { created: true, announcement: clone(announcement), errors: [] } : { created: false, announcement: null, errors: result.errors };
}

export function updateTeacherAnnouncement({ id, courseId, title, content, identity, storage, now = new Date().toISOString() } = {}) {
  const validation = validateTeacherAnnouncement({ courseId, title, content, identity });
  if (!validation.valid) return { updated: false, announcement: null, errors: validation.errors };
  const target = resolveStorage(storage), source = read(target);
  if (!target) return { updated: false, announcement: null, errors: [source.warning] };
  const index = source.records.findIndex(record => record.id === id && record.courseId === courseId && record.teacherId === identity.id);
  if (index < 0) return { updated: false, announcement: null, errors: ["El aviso demo seleccionado no existe."] };
  const announcement = { ...source.records[index], ...validation.announcement, updatedAt: new Date(now).toISOString() };
  const result = write(source.records.map((record, recordIndex) => recordIndex === index ? announcement : record), target);
  return result.saved ? { updated: true, announcement: clone(announcement), errors: [] } : { updated: false, announcement: null, errors: result.errors };
}

export function deleteTeacherAnnouncement({ id, courseId, identity, storage } = {}) {
  const { course, error } = authorized(courseId, identity);
  if (!course) return { deleted: false, errors: [error] };
  const target = resolveStorage(storage), source = read(target);
  if (!target) return { deleted: false, errors: [source.warning] };
  const announcement = source.records.find(record => record.id === id && record.courseId === courseId && record.teacherId === identity.id);
  if (!announcement) return { deleted: false, errors: ["El aviso demo seleccionado no existe."] };
  const result = write(source.records.filter(record => record.id !== id), target);
  return result.saved ? { deleted: true, announcement: clone(announcement), errors: [] } : { deleted: false, errors: result.errors };
}
