// Gestión local, reversible y aislada de asistencia para el Panel Profesor.
// No modifica los agregados institucionales de data/university/attendance.js.

import { getCourseById } from "../course-service.js";
import { getStudentsByCourse } from "../student-service.js";

export const TEACHER_ATTENDANCE_STORAGE_KEY = "uboDemoTeacherAttendance";
export const TEACHER_ATTENDANCE_STATUSES = Object.freeze(["PRESENT", "ABSENT", "JUSTIFIED"]);

const clone = value => JSON.parse(JSON.stringify(value));
const cleanText = value => typeof value === "string" ? value.trim() : "";

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function ownsCourse(identity, course) {
  return Boolean(identity && identity.role === "TEACHER" && identity.id && course && course.professorId === identity.id);
}

function isStoredRecord(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string"
    && typeof value.studentId === "string" && typeof value.teacherId === "string"
    && validDate(value.date) && TEACHER_ATTENDANCE_STATUSES.includes(value.status)
    && typeof value.createdAt === "string" && typeof value.updatedAt === "string");
}

function readRecords(storage) {
  if (!storage) return { records: [], warning: "El almacenamiento local no está disponible." };
  try {
    const raw = storage.getItem(TEACHER_ATTENDANCE_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato de asistencia inválido.");
    const records = parsed.filter(isStoredRecord);
    const warning = records.length === parsed.length ? null : "Se ignoraron registros de asistencia demo corruptos.";
    if (warning) storage.setItem(TEACHER_ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    return { records, warning };
  } catch {
    try { storage.removeItem(TEACHER_ATTENDANCE_STORAGE_KEY); } catch { /* recuperación limitada */ }
    return { records: [], warning: "La asistencia demo local estaba corrupta y se restableció." };
  }
}

function writeRecords(records, storage) {
  if (!storage) return { saved: false, errors: ["El almacenamiento local no está disponible."] };
  try {
    storage.setItem(TEACHER_ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    return { saved: true, errors: [] };
  } catch {
    return { saved: false, errors: ["No fue posible guardar la asistencia demo en este dispositivo."] };
  }
}

function nextId(records, now) {
  const stamp = new Date(now).getTime();
  let number = 1;
  let id = `teacher-attendance-${stamp}-${number}`;
  while (records.some(record => record.id === id)) id = `teacher-attendance-${stamp}-${++number}`;
  return id;
}

function getAuthorizedCourse(courseId, identity) {
  const course = getCourseById(courseId);
  if (!course) return { course: null, warning: "El curso solicitado no existe." };
  if (!ownsCourse(identity, course)) return { course: null, warning: "Solo el profesor asignado puede gestionar la asistencia de este curso." };
  return { course, warning: null };
}

function calculateStudentPercentage(records, studentId) {
  const registered = records.filter(record => record.studentId === studentId);
  const present = registered.filter(record => record.status === "PRESENT").length;
  const absent = registered.filter(record => record.status === "ABSENT").length;
  const justified = registered.filter(record => record.status === "JUSTIFIED").length;
  const denominator = present + absent + justified;
  return { present, absent, justified, registered: denominator, percentage: denominator ? Number((((present + justified) / denominator) * 100).toFixed(1)) : null };
}

export function validateTeacherAttendance(data = {}) {
  const errors = [];
  const { course, warning } = getAuthorizedCourse(data.courseId, data.identity);
  const status = cleanText(data.status).toUpperCase();
  const student = course?.studentIds.includes(data.studentId)
    ? getStudentsByCourse(course.id).find(item => item.id === data.studentId)
    : null;

  if (warning) errors.push(warning);
  if (!validDate(data.date)) errors.push("La fecha de asistencia no es válida.");
  if (!TEACHER_ATTENDANCE_STATUSES.includes(status)) errors.push("Selecciona un estado de asistencia válido.");
  if (!student) errors.push("El estudiante no pertenece al curso indicado.");

  return { valid: errors.length === 0, errors, attendance: errors.length ? null : { courseId: course.id, studentId: student.id, date: data.date, status } };
}

export function getTeacherAttendanceSession({ courseId, date, identity, storage } = {}) {
  const { course, warning } = getAuthorizedCourse(courseId, identity);
  if (!course) return { allowed: false, students: [], warning };
  if (!validDate(date)) return { allowed: false, students: [], warning: "La fecha de asistencia no es válida." };
  const source = readRecords(resolveStorage(storage));
  const courseRecords = source.records.filter(record => record.courseId === course.id && record.teacherId === identity.id);
  const byStudent = new Map(courseRecords.filter(record => record.date === date).map(record => [record.studentId, record]));
  return {
    allowed: true,
    students: getStudentsByCourse(course.id).map(student => {
      const current = byStudent.get(student.id);
      return { studentId: student.id, status: current?.status || null, recordId: current?.id || null, percentage: calculateStudentPercentage(courseRecords, student.id) };
    }),
    warning: source.warning
  };
}

export function getTeacherCourseAttendance({ courseId, identity, date = null, storage } = {}) {
  const { course, warning } = getAuthorizedCourse(courseId, identity);
  if (!course) return { allowed: false, records: [], students: [], summary: null, warning };
  const source = readRecords(resolveStorage(storage));
  const records = source.records.filter(record => record.courseId === course.id && record.teacherId === identity.id);
  const current = date && validDate(date) ? records.filter(record => record.date === date) : [];
  const students = getStudentsByCourse(course.id).map(student => ({ studentId: student.id, ...calculateStudentPercentage(records, student.id) }));
  const statuses = current.reduce((result, record) => ({ ...result, [record.status]: result[record.status] + 1 }), { PRESENT: 0, ABSENT: 0, JUSTIFIED: 0 });
  return {
    allowed: true,
    records: records.map(clone),
    students,
    summary: { students: course.studentIds.length, present: statuses.PRESENT, absent: statuses.ABSENT, justified: statuses.JUSTIFIED, unregistered: course.studentIds.length - current.length },
    warning: source.warning
  };
}

export function saveTeacherAttendance({ courseId, studentId, date, status, identity, storage, now = new Date().toISOString() } = {}) {
  const validation = validateTeacherAttendance({ courseId, studentId, date, status, identity });
  if (!validation.valid) return { saved: false, created: false, updated: false, attendance: null, errors: validation.errors };
  const targetStorage = resolveStorage(storage);
  const source = readRecords(targetStorage);
  if (!targetStorage) return { saved: false, created: false, updated: false, attendance: null, errors: [source.warning] };
  const index = source.records.findIndex(record => record.courseId === courseId && record.studentId === studentId && record.date === date && record.teacherId === identity.id);
  const existing = index >= 0 ? source.records[index] : null;
  const attendance = {
    id: existing?.id || nextId(source.records, now),
    ...validation.attendance,
    teacherId: identity.id,
    createdAt: existing?.createdAt || new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString()
  };
  const records = existing ? source.records.map((record, recordIndex) => recordIndex === index ? attendance : record) : [...source.records, attendance];
  const persisted = writeRecords(records, targetStorage);
  return persisted.saved
    ? { saved: true, created: !existing, updated: Boolean(existing), attendance: clone(attendance), errors: [], warning: source.warning }
    : { saved: false, created: false, updated: false, attendance: null, errors: persisted.errors };
}
