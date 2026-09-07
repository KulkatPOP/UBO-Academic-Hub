// Adaptador futuro entre notas actuales y GradeModel.
// Para promedios heredados crea una evaluación descriptiva sin ponderación inventada.

import { createGradeModel } from "../../data/models/grade-model.js";

export function adaptGrade(currentGrade = {}) {
  return createGradeModel({
    courseId: currentGrade.courseId || currentGrade.subjectId || currentGrade.course?.id || null,
    studentId: currentGrade.studentId || currentGrade.userId || null,
    evaluation: currentGrade.evaluation || currentGrade.title || currentGrade.name || "Promedio actual",
    grade: currentGrade.grade ?? currentGrade.score ?? currentGrade.value ?? null,
    weight: currentGrade.weight ?? currentGrade.percentage ?? null
  });
}
