// Acciones futuras de asistencia docente.
// Capa aislada entre una futura interfaz Profesor y attendance-service.

import { createAttendanceModel } from "../../data/models/attendance-model.js";
import { getAttendanceByCourse, saveAttendance } from "../attendance-service.js";
import { getCourseById } from "../course-service.js";

const attendanceSessions = new Map();
const supportedStatuses = new Set(["present", "absent"]);

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function sessionKey(courseId, date) {
  return `${courseId}:${date}`;
}

function cloneSession(session) {
  return {
    courseId: session.courseId,
    date: session.date,
    students: session.students.map(student => ({ ...student }))
  };
}

export function getCourseAttendance(courseId) {
  return getAttendanceByCourse(courseId);
}

export function prepareAttendanceSession(courseId, date) {
  const course = getCourseById(courseId);
  if (!course) throw new Error("No se encontró el curso solicitado.");
  if (!isValidDate(date)) throw new TypeError("Debes indicar una fecha válida de asistencia.");

  const key = sessionKey(courseId, date);
  const existing = attendanceSessions.get(key);
  if (existing) return cloneSession(existing);

  const session = {
    courseId,
    date,
    students: (course.studentIds || []).map(studentId => createAttendanceModel({
      courseId,
      studentId,
      date,
      status: null
    }))
  };
  attendanceSessions.set(key, session);
  return cloneSession(session);
}

export function validateAttendanceSubmission(data = {}) {
  const errors = [];
  const course = getCourseById(data.courseId);
  const status = String(data.status || "").toLowerCase();

  if (!course) errors.push("El curso indicado no existe.");
  if (!isValidDate(data.date)) errors.push("La fecha de asistencia no es válida.");
  if (!supportedStatuses.has(status)) errors.push("El estado debe ser present o absent.");
  if (course && !course.studentIds.includes(data.studentId)) {
    errors.push("El estudiante no pertenece al curso indicado.");
  }

  const key = sessionKey(data.courseId, data.date);
  const session = attendanceSessions.get(key);
  const existingRecord = session?.students.find(student => student.studentId === data.studentId);
  if (!session) errors.push("Primero debes preparar la sesión de asistencia para esa fecha.");
  else if (!existingRecord) errors.push("El estudiante no está incluido en la sesión preparada.");
  else if (existingRecord.status) errors.push("La asistencia de este estudiante ya fue registrada para esa fecha.");

  return {
    valid: errors.length === 0,
    errors,
    attendance: errors.length ? null : createAttendanceModel({
      courseId: data.courseId,
      studentId: data.studentId,
      date: data.date,
      status
    })
  };
}

export function markStudentAttendance(data = {}) {
  const validation = validateAttendanceSubmission(data);
  if (!validation.valid) return { saved: false, ...validation };

  const attendance = validation.attendance;
  const previous = getAttendanceByCourse(attendance.courseId)
    .find(record => record.studentId === attendance.studentId);
  const totalClasses = (previous?.totalClasses || 0) + 1;
  const attendedClasses = (previous?.attendedClasses || 0) + (attendance.status === "present" ? 1 : 0);

  const aggregate = saveAttendance({
    id: previous?.id,
    courseId: attendance.courseId,
    studentId: attendance.studentId,
    totalClasses,
    attendedClasses,
    updatedAt: attendance.date
  });

  const session = attendanceSessions.get(sessionKey(attendance.courseId, attendance.date));
  const index = session.students.findIndex(student => student.studentId === attendance.studentId);
  session.students[index] = attendance;

  return {
    saved: true,
    attendance: { ...attendance },
    aggregate
  };
}
