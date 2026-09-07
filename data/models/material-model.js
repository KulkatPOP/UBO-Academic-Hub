// Modelo institucional futuro de material académico.
// Aislado de la interfaz y datos de materiales actuales.

export function createMaterialModel({ courseId, title, type, url } = {}) {
  return {
    courseId: courseId || null,
    title: title || "",
    type: type || "",
    url: url || ""
  };
}
