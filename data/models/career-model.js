// Contrato canónico futuro de carrera. No se conecta a datos ni servicios actuales.

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} es obligatorio.`);
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new TypeError(`${field} debe ser texto.`);
  return value.trim() || null;
}

export function createCareerModel({ careerId, name, status, facultyId, degreeType } = {}) {
  return {
    careerId: requiredString(careerId, "careerId"),
    name: requiredString(name, "name"),
    // REQUIERE APROBACIÓN: catálogo institucional definitivo de estados.
    status: requiredString(status, "status"),
    facultyId: optionalString(facultyId, "facultyId"),
    degreeType: optionalString(degreeType, "degreeType")
  };
}
