// Acciones futuras de notas para Profesor.
// Usa exclusivamente cursos, estudiantes y evaluaciones institucionales existentes.

import { createGradeModel } from "../../data/models/grade-model.js";
import { getCourseById } from "../course-service.js";
import { getGradesByCourse, saveGrade } from "../grade-service.js";
import { getStudentsByCourse } from "../student-service.js";

function evaluationForCourse(courseId, evaluationId) {
  return getGradesByCourse(courseId).find(evaluation => evaluation.id === evaluationId) || null;
}

function normalizeGrade(value) {
  if (value === "" || value === null || value === undefined) return null;
  const grade = Number(value);
  return Number.isFinite(grade) ? grade : null;
}

export function getCourseGrades(courseId) {
  const course = getCourseById(courseId);
  if (!course) {
    return {
      course: null,
      evaluations: [],
      warning: "No existe el curso solicitado."
    };
  }

  const evaluations = getGradesByCourse(courseId);
  return {
    course,
    evaluations,
    warning: evaluations.length
      ? null
      : "No hay evaluaciones institucionales disponibles para este curso. No se crearán evaluaciones de forma automática."
  };
}

export function prepareGradeEntry(courseId, evaluationId) {
  const courseData = getCourseGrades(courseId);
  if (!courseData.course) {
    return { course: null, evaluation: null, students: [], warning: courseData.warning };
  }

  const evaluation = evaluationForCourse(courseId, evaluationId);
  if (!evaluation) {
    return {
      course: courseData.course,
      evaluation: null,
      students: [],
      warning: "La evaluación no existe o no pertenece al curso indicado. No se creó una evaluación nueva."
    };
  }

  const students = getStudentsByCourse(courseId).map(student => {
    const existing = evaluation.grades.find(grade => grade.studentId === student.id) || null;
    return {
      student: { ...student },
      grade: createGradeModel({
        courseId,
        studentId: student.id,
        evaluation: evaluation.id,
        grade: existing?.score ?? null,
        weight: evaluation.percentage
      }),
      alreadyRecorded: Boolean(existing)
    };
  });

  return {
    course: courseData.course,
    evaluation,
    students,
    warning: students.every(entry => entry.alreadyRecorded)
      ? "Todos los estudiantes inscritos ya tienen una nota registrada para esta evaluación."
      : null
  };
}

export function validateGradeSubmission(data = {}) {
  const errors = [];
  const course = getCourseById(data.courseId);
  const grade = normalizeGrade(data.grade);

  if (!course) errors.push("El curso indicado no existe.");

  const evaluation = course ? evaluationForCourse(data.courseId, data.evaluationId) : null;
  if (!evaluation) errors.push("La evaluación no existe o no pertenece al curso indicado.");
  if (course && !course.studentIds.includes(data.studentId)) {
    errors.push("El estudiante no pertenece al curso indicado.");
  }
  if (grade === null) errors.push("Debes ingresar una nota.");
  else if (grade < 1 || grade > 7) errors.push("La nota debe estar entre 1.0 y 7.0.");
  if (evaluation?.grades.some(item => item.studentId === data.studentId)) {
    errors.push("Ya existe una nota para este estudiante y evaluación.");
  }

  return {
    valid: errors.length === 0,
    errors,
    grade: errors.length ? null : createGradeModel({
      courseId: data.courseId,
      studentId: data.studentId,
      evaluation: data.evaluationId,
      grade,
      weight: evaluation.percentage
    })
  };
}

export function saveStudentGrade(data = {}) {
  const validation = validateGradeSubmission(data);
  if (!validation.valid) return { saved: false, ...validation };

  const storedGrade = saveGrade({
    courseId: validation.grade.courseId,
    evaluationId: validation.grade.evaluation,
    studentId: validation.grade.studentId,
    score: validation.grade.grade
  });

  return {
    saved: true,
    grade: { ...validation.grade },
    storedGrade
  };
}
