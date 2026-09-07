// Diagnóstico futuro de compatibilidad entre datos actuales de estudiante y la arquitectura institucional.
// No persiste, migra ni modifica los objetos recibidos.

import {
  getCurrentStudentAttendance,
  getCurrentStudentCourses,
  getCurrentStudentGrades,
  getCurrentStudentProfile
} from "../adapters/student-app-adapter.js";
import { createStudentModel } from "../../data/models/student-model.js";
import { careerIdMap } from "../../data/mappings/careers-map.js";
import { courseIdMap } from "../../data/mappings/courses-map.js";
import { studentIdentityMap } from "../../data/mappings/students-map.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function profileFrom(currentStudent) {
  return currentStudent?.studentData || currentStudent?.profile || currentStudent || {};
}

function findIdentity(currentStudent, profile) {
  const username = currentStudent?.username;
  const email = profile?.email;
  return studentIdentityMap.find(item => item.username === username || item.currentStudent.email === email) || null;
}

function findCareer(profile) {
  const career = profile?.career || profile?.carrera;
  return careerIdMap.find(item => item.currentCareer === career) || null;
}

function sourceCourses(currentStudent, profile) {
  return asArray(currentStudent?.courses || profile?.courses);
}

function sourceGrades(currentStudent, courses) {
  if (Array.isArray(currentStudent?.grades)) return currentStudent.grades;
  return courses.filter(course => course && (course.grade !== undefined || course.score !== undefined));
}

export function checkStudentCompatibility(currentStudent = {}) {
  const profile = profileFrom(currentStudent);
  const warnings = [];
  const missingMappings = [];
  const identity = findIdentity(currentStudent, profile);
  const career = findCareer(profile);
  const courses = sourceCourses(currentStudent, profile);

  // El adaptador se ejecuta para validar que el perfil actual pueda transformarse.
  const adaptedProfile = getCurrentStudentProfile(profile);

  if (!identity) {
    missingMappings.push("student-identity");
    warnings.push("No existe una equivalencia institucional para el usuario o correo actual.");
  }

  if (!career) {
    missingMappings.push("career");
    warnings.push("La carrera actual no tiene un careerId institucional asociado.");
  } else if (career.status !== "available") {
    warnings.push(`La carrera ${career.currentCareer} tiene un mapeo planificado, no disponible todavía.`);
  }

  if (!profile.semester) {
    warnings.push("Falta el semestre académico en el perfil actual.");
  } else {
    warnings.push("El modelo Student actual no incluye semestre; debe conservarse como metadato de transición.");
  }

  const adaptedCourses = getCurrentStudentCourses(courses);
  const institutionalCourseIds = [];
  if (!courses.length) {
    warnings.push("No se recibieron ramos actuales para validar su equivalencia institucional.");
  }

  courses.forEach(course => {
    const currentCourseId = typeof course === "string" ? course : course?.id;
    const mapping = courseIdMap.find(item => item.currentCourseId === currentCourseId);

    if (!mapping) {
      missingMappings.push(`course:${currentCourseId || "unknown"}`);
      warnings.push(`El ramo ${currentCourseId || "sin ID"} no tiene mapeo institucional.`);
      return;
    }

    if (mapping.status !== "available") {
      warnings.push(`El ramo ${currentCourseId} apunta a un curso institucional aún planificado.`);
      return;
    }

    institutionalCourseIds.push(mapping.institutionalCourseId);
  });

  const grades = sourceGrades(currentStudent, courses);
  const adaptedGrades = getCurrentStudentGrades(grades, {
    id: identity?.studentId || null,
    userId: identity?.userId || null
  });
  if (!grades.length) {
    warnings.push("No se recibieron notas actuales para validar evaluaciones institucionales.");
  } else if (grades.some(grade => !grade.evaluation && !grade.title && !grade.percentage && !grade.weight)) {
    warnings.push("Las notas agregadas se interpretan como promedio actual; no se inventan evaluaciones ni ponderaciones.");
  }

  const attendanceRecords = asArray(currentStudent?.attendanceRecords || currentStudent?.attendance);
  if (!attendanceRecords.length && courses.some(course => typeof course?.attendance === "number")) {
    warnings.push("La asistencia actual está agregada por ramo; no se convierte en registros por fecha.");
  } else if (!attendanceRecords.length) {
    warnings.push("No se recibieron registros de asistencia por clase.");
  }

  // Se conserva la llamada solo para verificar que los registros explícitos sean adaptables.
  const adaptableAttendance = attendanceRecords.filter(record => record?.date || record?.status);
  const adaptedAttendance = getCurrentStudentAttendance(adaptableAttendance, {
    id: identity?.studentId || null,
    userId: identity?.userId || null
  });
  if (adaptableAttendance.length !== attendanceRecords.length) {
    warnings.push("Los registros de asistencia sin fecha o estado no son compatibles con AttendanceModel.");
  }

  const studentModel = createStudentModel({
    ...adaptedProfile,
    id: identity?.studentId || null,
    userId: identity?.userId || null,
    careerId: career?.status === "available" ? career.careerId : null,
    courses: institutionalCourseIds
  });

  // Las variables adaptadas se conservan para validar transformabilidad sin exponer ni persistir datos adicionales.
  void adaptedCourses;
  void adaptedGrades;
  void adaptedAttendance;

  return {
    compatible: missingMappings.length === 0 && warnings.every(warning => !warning.includes("planificado") && !warning.includes("agregada por ramo")),
    studentModel,
    warnings,
    missingMappings
  };
}
