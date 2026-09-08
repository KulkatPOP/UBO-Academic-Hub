// Contrato canónico futuro de sala. No contiene horarios ni datos de cursos.

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} es obligatorio.`);
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new TypeError(`${field} debe ser texto.`);
  return value.trim() || null;
}

export function createRoomModel({ roomId, name, building, capacity, status, campus, floor, type } = {}) {
  if (!Number.isFinite(capacity) || capacity < 0) throw new RangeError("capacity debe ser un número mayor o igual a cero.");

  return {
    roomId: requiredString(roomId, "roomId"),
    name: requiredString(name, "name"),
    building: requiredString(building, "building"),
    capacity,
    // REQUIERE APROBACIÓN: catálogo institucional definitivo de estados.
    status: requiredString(status, "status"),
    campus: optionalString(campus, "campus"),
    floor: optionalString(floor, "floor"),
    type: optionalString(type, "type")
  };
}
