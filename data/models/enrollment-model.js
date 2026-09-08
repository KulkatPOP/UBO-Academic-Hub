// Contrato canónico futuro de inscripción. No valida una colección ni persiste datos.

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} es obligatorio.`);
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new TypeError(`${field} debe ser texto.`);
  return value.trim() || null;
}

export function getEnrollmentUniquenessKey({ studentId, courseId, period } = {}) {
  return [
    requiredString(studentId, "studentId"),
    requiredString(courseId, "courseId"),
    requiredString(period, "period")
  ].join("::");
}

export function createEnrollmentModel({ enrollmentId, studentId, courseId, period, status, enrolledAt, withdrawnAt } = {}) {
  const normalizedStudentId = requiredString(studentId, "studentId");
  const normalizedCourseId = requiredString(courseId, "courseId");
  const normalizedPeriod = requiredString(period, "period");

  return {
    enrollmentId: requiredString(enrollmentId, "enrollmentId"),
    studentId: normalizedStudentId,
    courseId: normalizedCourseId,
    period: normalizedPeriod,
    // REQUIERE APROBACIÓN: catálogo institucional definitivo de estados.
    status: requiredString(status, "status"),
    enrolledAt: optionalString(enrolledAt, "enrolledAt"),
    withdrawnAt: optionalString(withdrawnAt, "withdrawnAt")
  };
}
