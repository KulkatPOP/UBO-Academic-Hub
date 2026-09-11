// Resumen docente demo de solo lectura. Deriva métricas locales sin alterar
// registros, sesión ni fuentes académicas institucionales.

import { getCoursesByProfessor } from "../course-service.js";
import { getProfessorById } from "../professor-service.js";
import { getStudentsByCourse } from "../student-service.js";
import { getTeacherCourseMaterials } from "./teacher-material-management-service.js";
import { getTeacherCourseGrades } from "./teacher-grade-management-service.js";
import { getTeacherCourseAttendance } from "./teacher-attendance-management-service.js";
import { getTeacherCourseAnnouncements } from "./teacher-announcement-management-service.js";

const clone = value => JSON.parse(JSON.stringify(value));
const ATTENDANCE_STATUSES = new Set(["PRESENT", "ABSENT", "JUSTIFIED"]);

const defaultSources = Object.freeze({
  professor: getProfessorById,
  courses: getCoursesByProfessor,
  students: getStudentsByCourse,
  materials: getTeacherCourseMaterials,
  grades: getTeacherCourseGrades,
  attendance: getTeacherCourseAttendance,
  announcements: getTeacherCourseAnnouncements
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeRead(name, reader, args, fallback, warnings) {
  try {
    const result = reader(...args);
    if (result === undefined || result === null) return fallback;
    return result;
  } catch {
    warnings.push({ source: name, message: `No fue posible leer ${name} demo.` });
    return fallback;
  }
}

function getRecords(result, key, source, warnings) {
  if (!result || typeof result !== "object") return [];
  if (result.warning) warnings.push({ source, message: String(result.warning) });
  if (Object.hasOwn(result, key) && !Array.isArray(result[key])) {
    warnings.push({ source, message: `Se ignoraron datos demo inválidos de ${source}.` });
  }
  return asArray(result[key]);
}

function isCourseForTeacher(course, teacherId) {
  return Boolean(course && typeof course.id === "string" && course.professorId === teacherId && Array.isArray(course.studentIds));
}

function validGrade(record, courseId, teacherId, studentIds) {
  return Boolean(record && record.courseId === courseId && record.teacherId === teacherId
    && studentIds.has(record.studentId) && Number.isFinite(Number(record.value))
    && Number(record.value) >= 1 && Number(record.value) <= 7);
}

function validAttendance(record, courseId, teacherId, studentIds) {
  return Boolean(record && record.courseId === courseId && record.teacherId === teacherId
    && studentIds.has(record.studentId) && ATTENDANCE_STATUSES.has(record.status));
}

function activityFrom(records, type, course, teacherId, studentIds) {
  return records
    .filter(record => record && record.courseId === course.id && record.teacherId === teacherId
      && (!record.studentId || studentIds.has(record.studentId)))
    .map(record => ({
      id: `${type}:${record.id || "registro"}`,
      courseId: course.id,
      courseName: course.nombre || course.id,
      type,
      label: type === "MATERIAL" ? "Material publicado" : type === "ANNOUNCEMENT" ? "Aviso enviado" : type === "GRADE" ? "Nota demo registrada" : "Asistencia demo registrada",
      createdAt: record.updatedAt || record.createdAt || "",
      title: typeof record.title === "string" ? record.title : typeof record.assessmentName === "string" ? record.assessmentName : "Actividad demo"
    }));
}

/**
 * Prepara métricas demo para la UI del profesor. Las fuentes se pueden inyectar
 * en pruebas; el servicio no escribe ni administra almacenamiento propio.
 */
export function getTeacherDashboardSummary({ teacherId, storage, sources = {} } = {}) {
  const readers = { ...defaultSources, ...sources };
  const warnings = [];
  const professor = safeRead("perfil", readers.professor, [teacherId], null, warnings);

  if (!professor || professor.id !== teacherId || professor.role !== "TEACHER") {
    return { available: false, teacher: null, courses: [], activity: [], warnings: [...warnings, { source: "perfil", message: "El profesor solicitado no está disponible." }] };
  }

  const courses = asArray(safeRead("cursos", readers.courses, [teacherId], [], warnings))
    .filter(course => isCourseForTeacher(course, teacherId));

  const summaries = courses.map(course => {
    const courseWarnings = [];
    const expectedStudentIds = new Set(course.studentIds);
    const listedStudents = asArray(safeRead("estudiantes", readers.students, [course.id], [], courseWarnings));
    const studentIds = new Set(listedStudents.map(student => student?.id).filter(id => expectedStudentIds.has(id)));

    const context = { courseId: course.id, identity: { id: teacherId, role: "TEACHER" }, storage };
    const materialsResult = safeRead("materiales", readers.materials, [context], { allowed: true, materials: [] }, courseWarnings);
    const gradesResult = safeRead("notas", readers.grades, [context], { allowed: true, grades: [] }, courseWarnings);
    const attendanceResult = safeRead("asistencia", readers.attendance, [context], { allowed: true, records: [] }, courseWarnings);
    const announcementsResult = safeRead("avisos", readers.announcements, [context], { allowed: true, announcements: [] }, courseWarnings);

    const materials = getRecords(materialsResult, "materials", "materiales", courseWarnings)
      .filter(record => record && record.courseId === course.id && record.teacherId === teacherId);
    const grades = getRecords(gradesResult, "grades", "notas", courseWarnings)
      .filter(record => validGrade(record, course.id, teacherId, studentIds));
    const attendance = getRecords(attendanceResult, "records", "asistencia", courseWarnings)
      .filter(record => validAttendance(record, course.id, teacherId, studentIds));
    const announcements = getRecords(announcementsResult, "announcements", "avisos", courseWarnings)
      .filter(record => record && record.courseId === course.id && record.teacherId === teacherId);

    const attended = attendance.filter(record => record.status === "PRESENT" || record.status === "JUSTIFIED").length;
    const attendancePercentage = attendance.length ? Number(((attended / attendance.length) * 100).toFixed(1)) : null;
    const averageDemo = grades.length ? Number((grades.reduce((total, grade) => total + Number(grade.value), 0) / grades.length).toFixed(1)) : null;

    return {
      courseId: course.id,
      courseName: course.nombre || course.id,
      courseCode: course.codigo || "",
      teacherId,
      studentsCount: studentIds.size,
      materialsCount: materials.length,
      gradesCount: grades.length,
      announcementsCount: announcements.length,
      attendancePercentage,
      attendanceRecordsCount: attendance.length,
      averageDemo,
      activity: [
        ...activityFrom(materials, "MATERIAL", course, teacherId, studentIds),
        ...activityFrom(grades, "GRADE", course, teacherId, studentIds),
        ...activityFrom(attendance, "ATTENDANCE", course, teacherId, studentIds),
        ...activityFrom(announcements, "ANNOUNCEMENT", course, teacherId, studentIds)
      ],
      warnings: courseWarnings
    };
  });

  const activity = summaries.flatMap(summary => summary.activity)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id))
    .slice(0, 5);

  return clone({
    available: true,
    teacher: { id: professor.id, name: professor.nombre || professor.name || "Profesor UBO", department: professor.departamento || professor.department || null },
    courses: summaries.map(({ activity: ignored, ...summary }) => summary),
    activity,
    warnings: [...warnings, ...summaries.flatMap(summary => summary.warnings)]
  });
}
