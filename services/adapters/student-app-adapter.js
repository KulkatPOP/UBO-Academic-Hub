// Puente futuro entre los datos de la aplicación estudiante y los modelos institucionales.
// No importa app.js, no lee localStorage y no se conecta a servicios o pantallas actuales.

import { adaptAttendance } from "./attendance-adapter.js";
import { adaptCourse } from "./course-adapter.js";
import { adaptGrade } from "./grade-adapter.js";
import { adaptStudent } from "./student-adapter.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function studentIdentifier(currentStudent = {}) {
  return currentStudent.id || currentStudent.userId || currentStudent.username || null;
}

// Convierte el perfil actual en un StudentModel sin alterar su objeto de origen.
export function getCurrentStudentProfile(currentStudent = {}) {
  return adaptStudent(currentStudent);
}

// Convierte la colección actual de ramos en CourseModel.
export function getCurrentStudentCourses(currentCourses = []) {
  return asArray(currentCourses).map(course => adaptCourse(course));
}

// Convierte promedios o evaluaciones actuales en GradeModel.
// Si se reciben ramos del dashboard, usa la nota existente como "Promedio actual".
export function getCurrentStudentGrades(currentGrades = [], currentStudent = {}) {
  const studentId = studentIdentifier(currentStudent);

  return asArray(currentGrades)
    .filter(item => item && (item.grade !== undefined || item.score !== undefined || item.value !== undefined))
    .map(item => adaptGrade({
      ...item,
      courseId: item.courseId || item.subjectId || item.id,
      studentId: item.studentId || studentId,
      evaluation: item.evaluation || item.title || item.name || "Promedio actual"
    }));
}

// Convierte únicamente registros de asistencia por clase.
// Los porcentajes acumulados de los ramos actuales no se inventan como asistencias diarias.
export function getCurrentStudentAttendance(currentAttendance = [], currentStudent = {}) {
  const studentId = studentIdentifier(currentStudent);

  return asArray(currentAttendance)
    .filter(item => item && (item.date || item.status))
    .map(item => adaptAttendance({
      ...item,
      courseId: item.courseId || item.subjectId || item.id,
      studentId: item.studentId || studentId
    }));
}
