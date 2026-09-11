// Consulta read-only de asistencia demo para Student.
// Comparte la fuente local administrada por Profesor, sin operaciones de escritura.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { TEACHER_ATTENDANCE_STATUSES, TEACHER_ATTENDANCE_STORAGE_KEY } from "../teacher-actions/teacher-attendance-management-service.js";

const clone = value => JSON.parse(JSON.stringify(value));

function resolveStorage(storage) {
  try { return storage || globalThis.localStorage || null; } catch { return storage || null; }
}

function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function isRecord(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string"
    && typeof value.studentId === "string" && typeof value.teacherId === "string"
    && validDate(value.date) && TEACHER_ATTENDANCE_STATUSES.includes(value.status)
    && typeof value.createdAt === "string" && typeof value.updatedAt === "string");
}

function read(storage) {
  if (!storage) return { records: [], warning: "No se pudo cargar la asistencia demo." };
  try {
    const raw = storage.getItem(TEACHER_ATTENDANCE_STORAGE_KEY);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const records = parsed.filter(isRecord);
    return {
      records,
      warning: records.length === parsed.length ? null : "Se ignoraron registros de asistencia demo inválidos."
    };
  } catch {
    // Student no restablece ni elimina el origen corrupto gestionado por Profesor.
    return { records: [], warning: "No se pudo cargar la asistencia demo." };
  }
}

function summarize(course, records) {
  const present = records.filter(record => record.status === "PRESENT").length;
  const absent = records.filter(record => record.status === "ABSENT").length;
  const justified = records.filter(record => record.status === "JUSTIFIED").length;
  const registered = records.length;
  return {
    courseId: course.id,
    courseName: course.nombre,
    present,
    absent,
    justified,
    registered,
    percentage: registered ? Number((((present + justified) / registered) * 100).toFixed(1)) : null,
    records: records.map(clone)
  };
}

export function getStudentAttendance({ studentId, courseId = null, storage } = {}) {
  const student = getStudentById(studentId);
  if (!student) return { available: false, attendance: [], courses: [], warning: "No se encontró el estudiante solicitado." };

  const enrolledCourses = getCoursesByStudent(student.id);
  const courseMap = new Map(enrolledCourses.map(course => [course.id, course]));
  if (courseId && !courseMap.has(courseId)) {
    return { available: false, attendance: [], courses: [], warning: "No tienes acceso a la asistencia de este curso." };
  }

  const source = read(resolveStorage(storage));
  const attendance = source.records
    .filter(record => record.studentId === student.id && courseMap.has(record.courseId) && (!courseId || record.courseId === courseId))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .map(record => clone({ ...record, courseName: courseMap.get(record.courseId).nombre }));
  const visibleCourses = courseId ? [courseMap.get(courseId)] : enrolledCourses;
  const courses = visibleCourses.map(course => summarize(course, attendance.filter(record => record.courseId === course.id)));

  return { available: true, attendance, courses: courses.map(clone), warning: source.warning };
}
