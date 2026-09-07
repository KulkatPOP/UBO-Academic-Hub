// Servicio futuro de evaluaciones y notas docentes.
// Mantiene datos demo en memoria hasta su futura conexión con backend.

import { universityEvaluations } from "../data/university/grades.js";

function cloneEvaluation(evaluation) {
  return evaluation ? { ...evaluation, grades: evaluation.grades.map(grade => ({ ...grade })) } : null;
}

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 1 || score > 7) {
    throw new RangeError("La nota debe estar entre 1.0 y 7.0.");
  }
  return score;
}

export function getGradesByCourse(courseId) {
  return universityEvaluations
    .filter(evaluation => evaluation.courseId === courseId)
    .map(cloneEvaluation);
}

export function saveGrade({ courseId, evaluationId, studentId, score }) {
  if (!courseId || !evaluationId || !studentId) {
    throw new TypeError("La nota requiere courseId, evaluationId y studentId.");
  }

  const evaluation = universityEvaluations.find(item =>
    item.id === evaluationId && item.courseId === courseId
  );
  if (!evaluation) throw new Error("No se encontró la evaluación solicitada.");

  const normalizedScore = normalizeScore(score);
  const index = evaluation.grades.findIndex(grade => grade.studentId === studentId);
  const nextGrade = { studentId, score: normalizedScore };
  if (index >= 0) evaluation.grades[index] = nextGrade;
  else evaluation.grades.push(nextGrade);

  return { ...nextGrade };
}

export function getStudentGrades(studentId, courseId = null) {
  return universityEvaluations
    .filter(evaluation => !courseId || evaluation.courseId === courseId)
    .map(evaluation => {
      const grade = evaluation.grades.find(item => item.studentId === studentId);
      return grade ? {
        courseId: evaluation.courseId,
        evaluationId: evaluation.id,
        title: evaluation.title,
        percentage: evaluation.percentage,
        date: evaluation.date,
        score: grade.score
      } : null;
    })
    .filter(Boolean);
}
