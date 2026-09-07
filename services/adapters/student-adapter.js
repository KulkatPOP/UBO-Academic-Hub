// Adaptador futuro entre datos actuales de estudiante y StudentModel.
// No importa ni modifica la sesión o los datos de la aplicación actual.

import { createStudentModel } from "../../data/models/student-model.js";

function identifierFrom(value, fallback) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

export function adaptStudent(currentStudent = {}) {
  const courses = currentStudent.courses || currentStudent.courseIds || [];

  return createStudentModel({
    id: currentStudent.id || identifierFrom(currentStudent.name || currentStudent.nombre, "student-unknown"),
    userId: currentStudent.userId || currentStudent.username || currentStudent.email || null,
    careerId: currentStudent.careerId || identifierFrom(currentStudent.career || currentStudent.carrera, "career-unknown"),
    courses: Array.isArray(courses) ? courses.map(course => typeof course === "string" ? course : course?.id).filter(Boolean) : []
  });
}
