// Analítica académica demo de solo lectura. No modifica fuentes, notas oficiales
// ni registros de asistencia; únicamente deriva indicadores para las interfaces.

import { getCoursesByProfessor, getCoursesByStudent } from "../course-service.js";
import { getProfessorById } from "../professor-service.js";
import { getStudentById } from "../student-service.js";
import { getTeacherCourseMaterials } from "../teacher-actions/teacher-material-management-service.js";
import { getTeacherCourseGrades } from "../teacher-actions/teacher-grade-management-service.js";
import { getTeacherCourseAttendance } from "../teacher-actions/teacher-attendance-management-service.js";
import { getTeacherCourseAnnouncements } from "../teacher-actions/teacher-announcement-management-service.js";
import { getStudentGrades } from "../student-actions/student-grade-service.js";
import { getStudentAttendance } from "../student-actions/student-attendance-service.js";

const clone = value => JSON.parse(JSON.stringify(value));
const ATTENDANCE_STATUSES = new Set(["PRESENT", "ABSENT", "JUSTIFIED"]);

function asArray(value) { return Array.isArray(value) ? value : []; }

function readSafely(source, reader, args, fallback, warnings) {
  try {
    const value = reader(...args);
    return value ?? fallback;
  } catch {
    warnings.push({ source, message: `No fue posible analizar ${source} demo.` });
    return fallback;
  }
}

function resultItems(result, key, source, warnings) {
  if (!result || typeof result !== "object") return [];
  if (result.warning) warnings.push({ source, message: String(result.warning) });
  if (Object.hasOwn(result, key) && !Array.isArray(result[key])) warnings.push({ source, message: `Se ignoraron datos demo inválidos de ${source}.` });
  return asArray(result[key]);
}

export function calculateGradeDistribution(grades = []) {
  return asArray(grades).reduce((distribution, grade) => {
    const value = Number(grade?.value);
    if (!Number.isFinite(value) || value < 1 || value > 7) return distribution;
    if (value >= 6) distribution.good += 1;
    else if (value >= 4) distribution.followUp += 1;
    else distribution.risk += 1;
    distribution.total += 1;
    return distribution;
  }, { good: 0, followUp: 0, risk: 0, total: 0 });
}

export function calculateDemoAverage(grades = []) {
  const values = asArray(grades).map(grade => Number(grade?.value)).filter(value => Number.isFinite(value) && value >= 1 && value <= 7);
  return values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)) : null;
}

export function calculateDemoAttendance(records = []) {
  const valid = asArray(records).filter(record => ATTENDANCE_STATUSES.has(record?.status));
  const attended = valid.filter(record => record.status === "PRESENT" || record.status === "JUSTIFIED").length;
  return { registered: valid.length, percentage: valid.length ? Number(((attended / valid.length) * 100).toFixed(1)) : null };
}

export function calculateGradeTrend(grades = []) {
  const ordered = asArray(grades)
    .filter(grade => Number.isFinite(Number(grade?.value)) && grade.value >= 1 && grade.value <= 7)
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || String(a.id || "").localeCompare(String(b.id || "")));
  if (ordered.length < 2) return { code: "INSUFFICIENT", label: "Sin datos suficientes para analizar", delta: null };
  const delta = Number((Number(ordered.at(-1).value) - Number(ordered.at(-2).value)).toFixed(1));
  if (delta > 0.2) return { code: "IMPROVING", label: "Mejorando", delta };
  if (delta < -0.2) return { code: "DECLINING", label: "Descendiendo", delta };
  return { code: "STABLE", label: "Estable", delta };
}

function teacherDefaults() {
  return {
    professor: getProfessorById,
    courses: getCoursesByProfessor,
    materials: getTeacherCourseMaterials,
    grades: getTeacherCourseGrades,
    attendance: getTeacherCourseAttendance,
    announcements: getTeacherCourseAnnouncements
  };
}

/** Calcula indicadores por curso asignado para la UI docente. */
export function getTeacherCourseAnalytics({ teacherId, courseId = null, storage, sources = {} } = {}) {
  const readers = { ...teacherDefaults(), ...sources };
  const warnings = [];
  const teacher = readSafely("perfil", readers.professor, [teacherId], null, warnings);
  if (!teacher || teacher.id !== teacherId || teacher.role !== "TEACHER") {
    return { available: false, teacher: null, courses: [], warnings: [...warnings, { source: "perfil", message: "El profesor solicitado no está disponible." }] };
  }
  const courses = asArray(readSafely("cursos", readers.courses, [teacherId], [], warnings))
    .filter(course => course && course.professorId === teacherId && typeof course.id === "string" && (!courseId || course.id === courseId));
  if (courseId && !courses.length) return { available: false, teacher: { id: teacher.id, name: teacher.nombre || teacher.name || "Profesor UBO" }, courses: [], warnings: [...warnings, { source: "curso", message: "El curso solicitado no pertenece al profesor." }] };

  const analytics = courses.map(course => {
    const localWarnings = [];
    const students = new Set(asArray(course.studentIds));
    const context = { courseId: course.id, identity: { id: teacherId, role: "TEACHER" }, storage };
    const materials = resultItems(readSafely("material", readers.materials, [context], { materials: [] }, localWarnings), "materials", "material", localWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === teacherId);
    const grades = resultItems(readSafely("notas", readers.grades, [context], { grades: [] }, localWarnings), "grades", "notas", localWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === teacherId && students.has(item.studentId));
    const attendance = resultItems(readSafely("asistencia", readers.attendance, [context], { records: [] }, localWarnings), "records", "asistencia", localWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === teacherId && students.has(item.studentId));
    const announcements = resultItems(readSafely("avisos", readers.announcements, [context], { announcements: [] }, localWarnings), "announcements", "avisos", localWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === teacherId);
    const distribution = calculateGradeDistribution(grades);
    const followUpStudents = new Set(grades.filter(item => Number(item.value) >= 4 && Number(item.value) < 6).map(item => item.studentId)).size;
    return {
      courseId: course.id,
      courseName: course.nombre || course.id,
      teacherId,
      averageDemo: calculateDemoAverage(grades),
      distribution,
      attendance: calculateDemoAttendance(attendance),
      studentsFollowUp: followUpStudents,
      materialsCount: materials.length,
      gradesCount: distribution.total,
      announcementsCount: announcements.length,
      warnings: localWarnings
    };
  });

  return clone({ available: true, teacher: { id: teacher.id, name: teacher.nombre || teacher.name || "Profesor UBO" }, courses: analytics, warnings: [...warnings, ...analytics.flatMap(course => course.warnings)] });
}

/** Calcula progreso demo exclusivo de los cursos inscritos por un estudiante. */
export function getStudentAcademicAnalytics({ studentId, courseId = null, storage, sources = {} } = {}) {
  const readers = { student: getStudentById, courses: getCoursesByStudent, grades: getStudentGrades, attendance: getStudentAttendance, ...sources };
  const warnings = [];
  const student = readSafely("perfil", readers.student, [studentId], null, warnings);
  if (!student || student.id !== studentId) return { available: false, student: null, courses: [], warnings: [...warnings, { source: "perfil", message: "El estudiante solicitado no está disponible." }] };
  const courses = asArray(readSafely("cursos", readers.courses, [studentId], [], warnings))
    .filter(course => course && Array.isArray(course.studentIds) && course.studentIds.includes(studentId) && (!courseId || course.id === courseId));
  if (courseId && !courses.length) return { available: false, student: { id: student.id, name: student.nombre || student.name || "Estudiante UBO" }, courses: [], warnings: [...warnings, { source: "curso", message: "El curso solicitado no pertenece al estudiante." }] };
  const gradeResult = readSafely("notas", readers.grades, [{ studentId, courseId, storage }], { grades: [] }, warnings);
  const attendanceResult = readSafely("asistencia", readers.attendance, [{ studentId, courseId, storage }], { courses: [] }, warnings);
  const grades = resultItems(gradeResult, "grades", "notas", warnings)
    .filter(grade => courses.some(course => course.id === grade.courseId) && grade.studentId === studentId);
  const attendanceByCourse = new Map(resultItems(attendanceResult, "courses", "asistencia", warnings)
    .filter(item => courses.some(course => course.id === item.courseId)).map(item => [item.courseId, item]));
  const analytics = courses.map(course => {
    const courseGrades = grades.filter(grade => grade.courseId === course.id);
    const attendance = attendanceByCourse.get(course.id) || null;
    return {
      courseId: course.id,
      courseName: course.nombre || course.id,
      grades: courseGrades.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(b.id || "").localeCompare(String(a.id || ""))).slice(0, 3),
      averageDemo: calculateDemoAverage(courseGrades),
      trend: calculateGradeTrend(courseGrades),
      attendance: attendance?.registered ? { registered: attendance.registered, percentage: attendance.percentage } : { registered: 0, percentage: null }
    };
  });
  return clone({ available: true, student: { id: student.id, name: student.nombre || student.name || "Estudiante UBO" }, courses: analytics, warnings });
}
