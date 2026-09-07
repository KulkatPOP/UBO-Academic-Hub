// Servicio futuro de consulta de cursos.
// No está conectado todavía con la aplicación actual.

import { universityCourses } from "../data/university/courses.js";
import * as futureCourseData from "../data/courses.js";

function getFutureCourseRecords() {
  return Object.values(futureCourseData)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(value => value && typeof value === "object" && typeof value.id === "string");
}

function allCourses() {
  return [...universityCourses, ...getFutureCourseRecords()]
    .map(course => ({ ...course, studentIds: [...(course.studentIds || [])], scheduleIds: [...(course.scheduleIds || [])] }));
}

export function getCourses() {
  return allCourses();
}

export function getCourseById(courseId) {
  return allCourses().find(course => course.id === courseId) || null;
}

export function getCoursesByProfessor(professorId) {
  return allCourses().filter(course => course.professorId === professorId);
}

export function getCoursesByStudent(studentId) {
  return allCourses().filter(course => course.studentIds.includes(studentId));
}
