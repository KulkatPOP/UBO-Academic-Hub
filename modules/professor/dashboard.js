// Adaptador futuro del Panel Profesor.
// Consume servicios aislados y no se importa desde la aplicación actual.

import { getCoursesByProfessor } from "../../services/course-service.js";
import { getProfessorById } from "../../services/professor-service.js";
import { getStudentsByCourse } from "../../services/student-service.js";
import { universityRooms } from "../../data/university/rooms.js";
import { universitySchedules } from "../../data/university/schedules.js";

const teacherId = "teacher-carlos-perez";
const scheduleTokenByDay = {
  lunes: "monday",
  martes: "tuesday",
  miércoles: "wednesday",
  jueves: "thursday",
  viernes: "friday",
  sábado: "saturday",
  domingo: "sunday"
};
const dayLabelByKey = {
  lunes: "Lunes",
  martes: "Martes",
  miércoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sábado: "Sábado",
  domingo: "Domingo"
};

function getCourseSchedules(course) {
  return course.scheduleIds
    .map(scheduleId => universitySchedules.find(schedule => schedule.id === scheduleId))
    .filter(Boolean);
}

function toTeacherCourse(course) {
  const schedules = getCourseSchedules(course);
  const room = universityRooms.find(item => item.id === course.roomId);
  const days = schedules.map(schedule => dayLabelByKey[schedule.day] || schedule.day);
  const time = schedules[0]?.time || "Horario por confirmar";

  return {
    ...course,
    seccion: course.codigo,
    horario: days.length ? `${days.join(" y ")} · ${time}` : time,
    sala: room?.nombre || "Sala por confirmar"
  };
}

const futureActions = [
  "Cargar notas",
  "Registrar asistencia",
  "Subir material",
  "Comunicar anuncios"
];

export function getTeacherProfile() {
  return getProfessorById(teacherId);
}

export function getAssignedCourses() {
  return getCoursesByProfessor(teacherId).map(toTeacherCourse);
}

export function getTeacherSummary(day = "lunes") {
  const cursos = getAssignedCourses();
  const normalizedDay = String(day).trim().toLowerCase();
  const scheduleToken = scheduleTokenByDay[normalizedDay];

  return {
    cursosAsignados: cursos.length,
    cantidadAlumnos: cursos.reduce((total, course) => total + getCourseStudents(course.id).length, 0),
    clasesDelDia: scheduleToken
      ? cursos.filter(course => getCourseSchedules(course).some(schedule => schedule.id.includes(scheduleToken))).length
      : 0,
    pendientes: 2
  };
}

export function getCourseStudents(courseId) {
  return getStudentsByCourse(courseId);
}

export function getFutureTeacherActions() {
  return [...futureActions];
}
