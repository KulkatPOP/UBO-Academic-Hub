// Contrato canónico futuro de evaluación. No crea notas ni calcula promedios.

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} es obligatorio.`);
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new TypeError(`${field} debe ser texto.`);
  return value.trim() || null;
}

export function createEvaluationModel({ evaluationId, courseId, title, weight, status, scheduledAt, description, roomId } = {}) {
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) throw new RangeError("weight debe estar entre 0 y 100.");

  return {
    evaluationId: requiredString(evaluationId, "evaluationId"),
    courseId: requiredString(courseId, "courseId"),
    title: requiredString(title, "title"),
    weight,
    // REQUIERE APROBACIÓN: catálogo institucional definitivo de estados.
    status: requiredString(status, "status"),
    scheduledAt: optionalString(scheduledAt, "scheduledAt"),
    description: optionalString(description, "description"),
    roomId: optionalString(roomId, "roomId")
  };
}
