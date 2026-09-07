// Modelo institucional futuro de calificación.
// Aislado del simulador de notas actual.

export function createGradeModel({ courseId, studentId, evaluation, grade, weight } = {}) {
  return {
    courseId: courseId || null,
    studentId: studentId || null,
    evaluation: evaluation || "",
    grade: grade ?? null,
    weight: weight ?? null
  };
}
