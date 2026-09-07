// Servicio futuro de consulta académica de estudiantes.
// No está conectado todavía con la aplicación actual.

import { demoUsers } from "../data/users.js";
import { universityCourses } from "../data/university/courses.js";
import * as futureStudentData from "../data/students.js";

function getFutureStudentRecords() {
  return Object.values(futureStudentData)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(value => value && typeof value === "object" && typeof value.id === "string");
}

function allStudents() {
  const roleStudents = demoUsers
    .filter(user => user.role === "STUDENT")
    .map(user => ({ id: user.id, nombre: user.nombre, email: user.email, role: user.role }));
  const enrolledIds = universityCourses.flatMap(course => course.studentIds || []);
  const identifiedStudents = new Map([...roleStudents, ...getFutureStudentRecords()].map(student => [student.id, student]));

  enrolledIds.forEach(id => {
    if (!identifiedStudents.has(id)) {
      identifiedStudents.set(id, { id, nombre: "Estudiante demo", email: null, role: "STUDENT" });
    }
  });

  return [...identifiedStudents.values()].map(student => ({ ...student }));
}

export function getStudents() {
  return allStudents();
}

export function getStudentById(studentId) {
  return allStudents().find(student => student.id === studentId) || null;
}

export function getStudentsByCourse(courseId) {
  const course = universityCourses.find(item => item.id === courseId);
  return course ? course.studentIds.map(getStudentById).filter(Boolean) : [];
}

export function getStudentAcademicInfo(studentId) {
  const student = getStudentById(studentId);
  if (!student) return null;

  const courses = universityCourses
    .filter(course => (course.studentIds || []).includes(studentId))
    .map(course => ({ id: course.id, codigo: course.codigo, nombre: course.nombre, estado: course.estado }));

  return { student, courses };
}
