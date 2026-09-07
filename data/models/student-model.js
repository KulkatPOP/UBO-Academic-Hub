// Modelo institucional futuro de estudiante.
// Aislado de los datos de estudiante actuales.

export function createStudentModel({ id, userId, careerId, courses } = {}) {
  return {
    id: id || null,
    userId: userId || null,
    careerId: careerId || null,
    courses: Array.isArray(courses) ? [...courses] : []
  };
}
