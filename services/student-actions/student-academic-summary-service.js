// Resumen de presentación read-only para Student.
// Combina fuentes demo existentes sin reemplazar ni calcular datos institucionales.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { getStudentAnnouncements } from "./student-announcement-service.js";
import { getStudentAttendance } from "./student-attendance-service.js";
import { getStudentGrades } from "./student-grade-service.js";
import { getStudentMaterials } from "./student-material-service.js";

const clone = value => JSON.parse(JSON.stringify(value));

function warning(source, result) {
  return result.warning ? { source, message: result.warning } : null;
}

export function getStudentAcademicSummary({ studentId, storage } = {}) {
  const student = getStudentById(studentId);
  if (!student) return { available: false, summary: null, warnings: [{ source: "student", message: "No se encontró el estudiante solicitado." }] };

  const gradesResult = getStudentGrades({ studentId: student.id, storage });
  const attendanceResult = getStudentAttendance({ studentId: student.id, storage });
  const materialsResult = getStudentMaterials({ studentId: student.id, storage });
  const announcementsResult = getStudentAnnouncements({ studentId: student.id, storage });
  const courses = getCoursesByStudent(student.id);
  const attendanceByCourse = new Map(attendanceResult.courses.map(item => [item.courseId, item]));
  const warnings = [
    warning("notas", gradesResult),
    warning("asistencia", attendanceResult),
    warning("material", materialsResult),
    warning("avisos", announcementsResult)
  ].filter(Boolean);

  const courseSummaries = courses.map(course => {
    const grades = gradesResult.grades.filter(item => item.courseId === course.id);
    const attendance = attendanceByCourse.get(course.id) || null;
    const materials = materialsResult.materials.filter(item => item.courseId === course.id);
    const announcements = announcementsResult.announcements.filter(item => item.courseId === course.id);
    return {
      courseId: course.id,
      courseName: course.nombre,
      latestGrade: grades[0] || null,
      attendance: attendance?.registered ? attendance : null,
      materialCount: materials.length,
      announcementCount: announcements.length
    };
  });

  const summary = {
    student: { id: student.id, name: student.nombre },
    demo: {
      activeCourses: courseSummaries.length,
      gradesRegistered: gradesResult.grades.length,
      materialsAvailable: materialsResult.materials.length,
      announcementsRecent: announcementsResult.announcements.length,
      attendanceCourses: courseSummaries.filter(course => course.attendance).length
    },
    courses: courseSummaries
  };

  return { available: true, summary: clone(summary), warnings: clone(warnings) };
}
