// Modelo institucional futuro de docente.
// Aislado de los datos de profesor actuales.

export function createTeacherModel({ id, userId, department, assignedCourses } = {}) {
  return {
    id: id || null,
    userId: userId || null,
    department: department || "",
    assignedCourses: Array.isArray(assignedCourses) ? [...assignedCourses] : []
  };
}
