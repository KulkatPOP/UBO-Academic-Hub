// Adaptador futuro entre registros actuales de asistencia y AttendanceModel.
// Un porcentaje agregado no se convierte en una asistencia por clase: se requiere fecha y estado.

import { createAttendanceModel } from "../../data/models/attendance-model.js";

export function adaptAttendance(currentAttendance = {}) {
  return createAttendanceModel({
    courseId: currentAttendance.courseId || currentAttendance.subjectId || currentAttendance.course?.id || null,
    studentId: currentAttendance.studentId || currentAttendance.userId || null,
    date: currentAttendance.date || null,
    status: currentAttendance.status || null
  });
}
