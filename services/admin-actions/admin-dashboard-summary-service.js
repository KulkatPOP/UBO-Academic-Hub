// Resumen administrativo demo de solo lectura. Compone datos existentes sin
// crear almacenamiento, modificar registros ni exponer operaciones de gestión.

import { demoUsers } from "../../data/users.js";
import { getCourses } from "../course-service.js";
import { getStudents } from "../student-service.js";
import { getTeacherCourseMaterials } from "../teacher-actions/teacher-material-management-service.js";
import { getTeacherCourseGrades } from "../teacher-actions/teacher-grade-management-service.js";
import { getTeacherCourseAttendance } from "../teacher-actions/teacher-attendance-management-service.js";
import { getTeacherCourseAnnouncements } from "../teacher-actions/teacher-announcement-management-service.js";
import { getStudentAcademicAlerts } from "../student-actions/student-alert-service.js";

const clone = value => JSON.parse(JSON.stringify(value));
const asArray = value => Array.isArray(value) ? value : [];

function safelyRead(source, reader, args, fallback, warnings) {
  try { return reader(...args) ?? fallback; }
  catch { warnings.push({ source, message: `No fue posible leer ${source} demo.` }); return fallback; }
}

function readItems(result, key, source, warnings) {
  if (!result || typeof result !== "object") return [];
  if (result.warning) warnings.push({ source, message: String(result.warning) });
  if (Object.hasOwn(result, key) && !Array.isArray(result[key])) warnings.push({ source, message: `Se ignoraron datos demo inválidos de ${source}.` });
  return asArray(result[key]);
}

function defaultSources() {
  return {
    users: () => demoUsers.map(user => ({ ...user, permissions: [...(user.permissions || [])] })),
    courses: getCourses,
    students: getStudents,
    materials: getTeacherCourseMaterials,
    grades: getTeacherCourseGrades,
    attendance: getTeacherCourseAttendance,
    announcements: getTeacherCourseAnnouncements,
    alerts: getStudentAcademicAlerts
  };
}

function latestActivity(records, type, course) {
  return records.map(record => ({
    id: `${type}:${record.id || "registro"}`,
    type,
    courseId: course.id,
    courseName: course.nombre || course.id,
    label: type === "MATERIAL" ? "Material publicado" : type === "GRADE" ? "Nota demo registrada" : type === "ATTENDANCE" ? "Asistencia demo registrada" : "Aviso enviado",
    title: typeof record.title === "string" ? record.title : typeof record.assessmentName === "string" ? record.assessmentName : "Actividad demo",
    createdAt: record.updatedAt || record.createdAt || ""
  }));
}

/** Genera métricas agregadas de plataforma demo para una interfaz ADMIN. */
export function getAdminDashboardSummary({ storage, sources = {} } = {}) {
  const readers = { ...defaultSources(), ...sources };
  const warnings = [];
  const users = asArray(safelyRead("usuarios", readers.users, [], [], warnings)).filter(user => user && typeof user.id === "string");
  const courses = asArray(safelyRead("cursos", readers.courses, [], [], warnings)).filter(course => course && typeof course.id === "string" && typeof course.professorId === "string");
  const students = asArray(safelyRead("estudiantes", readers.students, [], [], warnings)).filter(student => student && typeof student.id === "string");
  const studentIds = new Set(students.map(student => student.id));
  const records = { materials: [], grades: [], attendance: [], announcements: [] };

  courses.forEach(course => {
    const courseWarnings = [];
    const context = { courseId: course.id, identity: { id: course.professorId, role: "TEACHER" }, storage };
    const materials = readItems(safelyRead("material", readers.materials, [context], { materials: [] }, courseWarnings), "materials", "material", courseWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === course.professorId);
    const grades = readItems(safelyRead("notas", readers.grades, [context], { grades: [] }, courseWarnings), "grades", "notas", courseWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === course.professorId && course.studentIds?.includes(item.studentId));
    const attendance = readItems(safelyRead("asistencia", readers.attendance, [context], { records: [] }, courseWarnings), "records", "asistencia", courseWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === course.professorId && course.studentIds?.includes(item.studentId));
    const announcements = readItems(safelyRead("avisos", readers.announcements, [context], { announcements: [] }, courseWarnings), "announcements", "avisos", courseWarnings)
      .filter(item => item?.courseId === course.id && item.teacherId === course.professorId);
    records.materials.push(...materials);
    records.grades.push(...grades);
    records.attendance.push(...attendance);
    records.announcements.push(...announcements);
    warnings.push(...courseWarnings);
  });

  const alerts = [];
  students.forEach(student => {
    const result = safelyRead("alertas", readers.alerts, [{ studentId: student.id, storage }], { alerts: [] }, warnings);
    alerts.push(...readItems(result, "alerts", "alertas", warnings).filter(alert => alert?.courseId && courses.some(course => course.id === alert.courseId && course.studentIds?.includes(student.id))));
  });
  const activity = [
    ...latestActivity(records.materials, "MATERIAL", { id: "", nombre: "" }),
    ...latestActivity(records.grades, "GRADE", { id: "", nombre: "" }),
    ...latestActivity(records.attendance, "ATTENDANCE", { id: "", nombre: "" }),
    ...latestActivity(records.announcements, "ANNOUNCEMENT", { id: "", nombre: "" })
  ].map(item => {
    const record = [...records.materials, ...records.grades, ...records.attendance, ...records.announcements].find(candidate => `${item.type}:${candidate.id || "registro"}` === item.id);
    const course = courses.find(candidate => candidate.id === record?.courseId);
    return { ...item, courseId: course?.id || "", courseName: course?.nombre || "Curso demo" };
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id)).slice(0, 6);
  const coursesWithActivity = courses.filter(course => [records.materials, records.grades, records.attendance, records.announcements].some(group => group.some(record => record.courseId === course.id))).length;
  const metrics = {
    usersCount: users.length,
    studentsCount: users.filter(user => user.role === "STUDENT").length,
    teachersCount: users.filter(user => user.role === "TEACHER").length,
    coursesCount: courses.length,
    materialsCount: records.materials.length,
    gradesCount: records.grades.length,
    attendanceRecordsCount: records.attendance.length,
    announcementsCount: records.announcements.length,
    alertsCount: alerts.length
  };
  return clone({
    available: true,
    metrics,
    activity,
    status: { label: "Plataforma operativa", coursesWithActivity, recordsCount: records.materials.length + records.grades.length + records.attendance.length + records.announcements.length, alertsCount: alerts.length },
    warnings
  });
}
