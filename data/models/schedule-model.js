// Contrato canónico futuro de bloque horario. No duplica nombres de curso ni sala.

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} es obligatorio.`);
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new TypeError(`${field} debe ser texto.`);
  return value.trim() || null;
}

function minutes(time, field) {
  const normalized = requiredString(time, field);
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(normalized);
  if (!match) throw new TypeError(`${field} debe usar formato HH:mm.`);
  const [hours, minutesValue] = normalized.split(":").map(Number);
  return { normalized, value: hours * 60 + minutesValue };
}

export function createScheduleModel({ scheduleId, courseId, roomId, dayOfWeek, startTime, endTime, period, status } = {}) {
  const start = minutes(startTime, "startTime");
  const end = minutes(endTime, "endTime");
  if (end.value <= start.value) throw new RangeError("endTime debe ser posterior a startTime.");

  return {
    scheduleId: requiredString(scheduleId, "scheduleId"),
    courseId: requiredString(courseId, "courseId"),
    roomId: requiredString(roomId, "roomId"),
    dayOfWeek: requiredString(dayOfWeek, "dayOfWeek"),
    startTime: start.normalized,
    endTime: end.normalized,
    period: optionalString(period, "period"),
    // REQUIERE APROBACIÓN: catálogo institucional definitivo de estados.
    status: requiredString(status, "status")
  };
}
