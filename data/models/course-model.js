// Modelo institucional futuro de curso.
// Aislado de las estructuras académicas actuales.

export function createCourseModel({
  id,
  name,
  code,
  teacherId,
  careerId,
  students,
  roomId,
  scheduleId
} = {}) {
  return {
    id: id || null,
    name: name || "",
    code: code || "",
    teacherId: teacherId || null,
    careerId: careerId || null,
    students: Array.isArray(students) ? [...students] : [],
    roomId: roomId || null,
    scheduleId: scheduleId || null
  };
}
