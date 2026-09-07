// Servicio futuro de asistencia docente.
// Mantiene datos demo en memoria hasta su futura conexión con backend.

import { universityAttendance } from "../data/university/attendance.js";

function clone(record) {
  return record ? { ...record } : null;
}

function normalizeCount(value, fieldName) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) {
    throw new TypeError(`${fieldName} debe ser un entero igual o mayor que cero.`);
  }
  return count;
}

export function getAttendanceByCourse(courseId) {
  return universityAttendance
    .filter(record => record.courseId === courseId)
    .map(clone);
}

export function saveAttendance(attendance) {
  if (!attendance?.courseId || !attendance?.studentId) {
    throw new TypeError("La asistencia requiere courseId y studentId.");
  }

  const totalClasses = normalizeCount(attendance.totalClasses, "totalClasses");
  const attendedClasses = normalizeCount(attendance.attendedClasses, "attendedClasses");
  if (attendedClasses > totalClasses) {
    throw new RangeError("attendedClasses no puede superar totalClasses.");
  }

  const index = universityAttendance.findIndex(record =>
    record.courseId === attendance.courseId && record.studentId === attendance.studentId
  );
  const nextRecord = {
    id: attendance.id || universityAttendance[index]?.id || `attendance-${attendance.courseId}-${attendance.studentId}`,
    courseId: attendance.courseId,
    studentId: attendance.studentId,
    totalClasses,
    attendedClasses,
    updatedAt: attendance.updatedAt || new Date().toISOString().slice(0, 10)
  };

  if (index >= 0) universityAttendance[index] = nextRecord;
  else universityAttendance.push(nextRecord);

  return clone(nextRecord);
}

export function getStudentAttendance(studentId, courseId = null) {
  return universityAttendance
    .filter(record => record.studentId === studentId && (!courseId || record.courseId === courseId))
    .map(record => ({
      ...clone(record),
      percentage: record.totalClasses ? (record.attendedClasses / record.totalClasses) * 100 : 0
    }));
}
