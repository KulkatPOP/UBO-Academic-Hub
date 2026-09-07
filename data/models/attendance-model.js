// Modelo institucional futuro de registro de asistencia.
// Aislado de la calculadora y persistencia actuales.

export function createAttendanceModel({ courseId, studentId, date, status } = {}) {
  return {
    courseId: courseId || null,
    studentId: studentId || null,
    date: date || null,
    status: status || null
  };
}
