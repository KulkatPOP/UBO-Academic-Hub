// Asistencia QR demo compartida entre Profesor y Student.
// Mantiene sesiones y registros separados de la asistencia docente existente.

import { getCourseById, getCoursesByStudent } from "./course-service.js";
import { getStudentById } from "./student-service.js";

export const QR_ATTENDANCE_SESSIONS_STORAGE_KEY = "uboDemoQrAttendanceSessions";
export const QR_ATTENDANCE_RECORDS_STORAGE_KEY = "uboDemoQrAttendanceRecords";
export const QR_ATTENDANCE_SESSION_DURATION_MINUTES = 15;

const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === "string" ? value.trim() : "";

function resolveStorage(storage) {
  try { return storage || globalThis.localStorage || null; } catch { return storage || null; }
}

function validIsoDateTime(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isSession(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string"
    && typeof value.teacherId === "string" && validIsoDateTime(value.createdAt)
    && validIsoDateTime(value.expiresAt) && ["active", "closed"].includes(value.status));
}

function isRecord(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.sessionId === "string"
    && typeof value.courseId === "string" && typeof value.studentId === "string"
    && value.status === "PRESENT" && validIsoDateTime(value.registeredAt)
    && /^\d{4}-\d{2}-\d{2}$/.test(value.date));
}

function readCollection(key, predicate, storage) {
  if (!storage) return { values: [], warning: "El almacenamiento local no está disponible." };
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { values: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const values = parsed.filter(predicate);
    return { values, warning: values.length === parsed.length ? null : "Se ignoraron registros QR demo inválidos." };
  } catch {
    return { values: [], warning: "No se pudo leer la asistencia QR demo." };
  }
}

function writeCollection(key, values, storage) {
  if (!storage) return { saved: false, warning: "El almacenamiento local no está disponible." };
  try {
    storage.setItem(key, JSON.stringify(values));
    return { saved: true, warning: null };
  } catch {
    return { saved: false, warning: "No fue posible guardar la asistencia QR demo en este dispositivo." };
  }
}

function nextId(prefix, values, now) {
  const stamp = new Date(now).getTime();
  let number = 1;
  let id = `${prefix}-${stamp}-${number}`;
  while (values.some(value => value.id === id)) id = `${prefix}-${stamp}-${++number}`;
  return id;
}

function dayFrom(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function getQrAttendanceSessions({ storage } = {}) {
  const source = readCollection(QR_ATTENDANCE_SESSIONS_STORAGE_KEY, isSession, resolveStorage(storage));
  return { sessions: source.values.map(clone), warning: source.warning };
}

export function getQrAttendanceSession(sessionId, { storage } = {}) {
  const { sessions, warning } = getQrAttendanceSessions({ storage });
  return { session: sessions.find(session => session.id === text(sessionId)) || null, warning };
}

export function getQrAttendanceRecords({ storage } = {}) {
  const source = readCollection(QR_ATTENDANCE_RECORDS_STORAGE_KEY, isRecord, resolveStorage(storage));
  return { records: source.values.map(clone), warning: source.warning };
}

export function getQrAttendanceRecordsByStudent(studentId, { storage } = {}) {
  const { records, warning } = getQrAttendanceRecords({ storage });
  return { records: records.filter(record => record.studentId === text(studentId)), warning };
}

export function getQrAttendancePayload(session) {
  if (!isSession(session)) return null;
  return JSON.stringify({ sessionId: session.id, courseId: session.courseId });
}

export function getQrAttendanceTimeRemaining(session, now = new Date()) {
  if (!isSession(session)) return 0;
  return Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - new Date(now).getTime()) / 1000));
}

export function generateQrAttendanceSession({ courseId, teacherId, now = new Date(), durationMinutes = QR_ATTENDANCE_SESSION_DURATION_MINUTES, storage } = {}) {
  const course = getCourseById(text(courseId));
  const createdAt = new Date(now);
  if (!course) return { created: false, session: null, warning: "El curso indicado no existe." };
  if (!text(teacherId) || course.professorId !== text(teacherId)) return { created: false, session: null, warning: "Solo el profesor asignado puede generar una sesión QR para este curso." };
  if (Number.isNaN(createdAt.getTime()) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return { created: false, session: null, warning: "No se pudo preparar una sesión QR válida." };

  const targetStorage = resolveStorage(storage);
  const source = readCollection(QR_ATTENDANCE_SESSIONS_STORAGE_KEY, isSession, targetStorage);
  const session = {
    id: nextId("qr-session", source.values, createdAt),
    courseId: course.id,
    teacherId: course.professorId,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + durationMinutes * 60_000).toISOString(),
    status: "active"
  };
  const written = writeCollection(QR_ATTENDANCE_SESSIONS_STORAGE_KEY, [...source.values, session], targetStorage);
  return written.saved
    ? { created: true, session: clone(session), payload: getQrAttendancePayload(session), warning: source.warning }
    : { created: false, session: null, warning: written.warning };
}

export function parseQrAttendanceCode(code) {
  const raw = text(code);
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      return text(parsed?.sessionId) && text(parsed?.courseId) ? { sessionId: text(parsed.sessionId), courseId: text(parsed.courseId) } : null;
    } catch { return null; }
  }
  return { sessionId: raw, courseId: null };
}

export function validateQrAttendanceRegistration({ code, sessionId, courseId, studentId, now = new Date(), storage } = {}) {
  const parsed = code === undefined ? { sessionId: text(sessionId), courseId: text(courseId) || null } : parseQrAttendanceCode(code);
  if (!parsed?.sessionId) return { valid: false, code: "INVALID_CODE", warning: "Ingresa un código QR demo válido." };
  const student = getStudentById(text(studentId));
  if (!student) return { valid: false, code: "STUDENT_NOT_FOUND", warning: "No se encontró el estudiante solicitado." };
  const { session, warning } = getQrAttendanceSession(parsed.sessionId, { storage });
  if (!session) return { valid: false, code: "SESSION_NOT_FOUND", warning: warning || "La sesión QR no existe." };
  if (parsed.courseId && parsed.courseId !== session.courseId) return { valid: false, code: "COURSE_MISMATCH", warning: "El código QR no corresponde a la sesión indicada." };
  if (session.status !== "active") return { valid: false, code: "SESSION_INACTIVE", warning: "La sesión QR no está activa." };
  if (getQrAttendanceTimeRemaining(session, now) <= 0) return { valid: false, code: "SESSION_EXPIRED", warning: "Sesión expirada." };
  const enrolled = getCoursesByStudent(student.id).some(course => course.id === session.courseId);
  if (!enrolled) return { valid: false, code: "COURSE_NOT_ENROLLED", warning: "Este curso no corresponde a tu matrícula." };
  const { records } = getQrAttendanceRecords({ storage });
  if (records.some(record => record.sessionId === session.id && record.studentId === student.id)) return { valid: false, code: "DUPLICATE_RECORD", warning: "La asistencia ya fue registrada para esta sesión." };
  return { valid: true, code: "VALID", warning: null, session: clone(session), student: clone(student) };
}

export function registerQrAttendance({ code, sessionId, courseId, studentId, now = new Date(), storage } = {}) {
  const validation = validateQrAttendanceRegistration({ code, sessionId, courseId, studentId, now, storage });
  if (!validation.valid) return { registered: false, record: null, code: validation.code, warning: validation.warning };
  const targetStorage = resolveStorage(storage);
  const source = readCollection(QR_ATTENDANCE_RECORDS_STORAGE_KEY, isRecord, targetStorage);
  const registeredAt = new Date(now).toISOString();
  const record = {
    id: nextId("qr-attendance", source.values, registeredAt),
    sessionId: validation.session.id,
    courseId: validation.session.courseId,
    studentId: validation.student.id,
    status: "PRESENT",
    date: dayFrom(registeredAt),
    registeredAt
  };
  const written = writeCollection(QR_ATTENDANCE_RECORDS_STORAGE_KEY, [...source.values, record], targetStorage);
  return written.saved
    ? { registered: true, record: clone(record), code: "REGISTERED", warning: source.warning }
    : { registered: false, record: null, code: "STORAGE_UNAVAILABLE", warning: written.warning };
}
