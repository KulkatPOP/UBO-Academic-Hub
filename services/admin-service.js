// Servicio futuro de consulta institucional para el perfil Admin.
// No está conectado todavía con la aplicación actual.

import { universityCareers } from "../data/university/careers.js";
import { universityCourses } from "../data/university/courses.js";
import { universityRooms } from "../data/university/rooms.js";
import { universitySchedules } from "../data/university/schedules.js";
import { demoUsers } from "../data/users.js";
import { getProfessors } from "./professor-service.js";
import { getStudents } from "./student-service.js";
import {
  getUsageStatistics as getAnalyticsUsageStatistics,
  getTrafficStatistics as getAnalyticsTrafficStatistics,
  getApplicationErrors as getAnalyticsApplicationErrors,
  getLibraryStatistics as getAnalyticsLibraryStatistics,
  getCasinoStatistics as getAnalyticsCasinoStatistics,
  getRequestStatistics as getAnalyticsRequestStatistics,
  getEventStatistics as getAnalyticsEventStatistics
} from "../data/university/analytics.js";

// Devuelve una copia del usuario ADMIN institucional; null indica que no hay
// un administrador disponible en la fuente demo actual.
export function getAdminProfile() {
  const admin = demoUsers.find(user => user.role === "ADMIN");
  return admin ? { ...admin, permissions: [...(admin.permissions || [])] } : null;
}

export function getInstitutionStats() {
  const students = getStudents();
  const professors = getProfessors();

  return {
    usuariosActivos: students.length + professors.length + 1,
    estudiantes: students.length,
    profesores: professors.length,
    carreras: universityCareers.length,
    cursosActivos: universityCourses.filter(course => course.estado === "Activo").length,
    salasDisponibles: universityRooms.filter(room => room.capacidad > 0).length,
    bloquesHorarios: universitySchedules.length
  };
}

export function getAdministrativeManagementData() {
  return {
    estudiantes: getStudents(),
    profesores: getProfessors(),
    carreras: universityCareers.map(career => ({ ...career, studentIds: [...career.studentIds] })),
    cursos: universityCourses.map(course => ({ ...course, studentIds: [...course.studentIds], scheduleIds: [...course.scheduleIds] })),
    salas: universityRooms.map(room => ({ ...room })),
    horarios: universitySchedules.map(schedule => ({ ...schedule })),
    permisos: ["STUDENT", "TEACHER", "ADMIN"]
  };
}

// Adaptadores de analítica institucional. La interfaz futura debe consumir
// estas funciones de servicio, no la fuente de datos directamente.
export function getUsageStatistics() {
  return getAnalyticsUsageStatistics();
}

export function getTrafficStatistics() {
  return getAnalyticsTrafficStatistics();
}

export function getApplicationErrors() {
  return getAnalyticsApplicationErrors();
}

export function getLibraryStatistics() {
  return getAnalyticsLibraryStatistics();
}

export function getCasinoStatistics() {
  return getAnalyticsCasinoStatistics();
}

export function getRequestStatistics() {
  return getAnalyticsRequestStatistics();
}

export function getEventStatistics() {
  return getAnalyticsEventStatistics();
}
