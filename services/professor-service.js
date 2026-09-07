// Servicio futuro de consulta de profesores y cursos asignados.
// No está conectado todavía con la aplicación actual.

import { demoUsers } from "../data/users.js";
import { universityCourses } from "../data/university/courses.js";
import * as futureProfessorData from "../data/professors.js";

function getFutureProfessorRecords() {
  return Object.values(futureProfessorData)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(value => value && typeof value === "object" && typeof value.id === "string");
}

function allProfessors() {
  const roleProfessors = demoUsers
    .filter(user => user.role === "TEACHER")
    .map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      department: user.department || null,
      role: user.role
    }));

  const professors = new Map([...roleProfessors, ...getFutureProfessorRecords()].map(professor => [professor.id, professor]));
  return [...professors.values()].map(professor => ({ ...professor }));
}

export function getProfessors() {
  return allProfessors();
}

export function getProfessorById(professorId) {
  return allProfessors().find(professor => professor.id === professorId) || null;
}

export function getAssignedCourses(professorId) {
  return universityCourses
    .filter(course => course.professorId === professorId)
    .map(course => ({ ...course, studentIds: [...course.studentIds], scheduleIds: [...course.scheduleIds] }));
}
