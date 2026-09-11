// Alertas académicas demo de solo lectura para Student.
// Deriva recomendaciones orientativas desde las vistas Student existentes.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { getStudentAnnouncements } from "./student-announcement-service.js";
import { getStudentAttendance } from "./student-attendance-service.js";
import { getStudentGrades } from "./student-grade-service.js";
import { getStudentMaterials } from "./student-material-service.js";

const clone = value => JSON.parse(JSON.stringify(value));
const severityOrder = { HIGH: 0, MEDIUM: 1, INFO: 2 };

function warning(source, message) { return { source, message }; }

function safeSource(source, name, params, fallback, warnings) {
  try {
    const result = source(params);
    if (!result || typeof result !== "object") {
      warnings.push(warning(name, "No se pudo cargar esta fuente demo."));
      return fallback;
    }
    if (result.warning) warnings.push(warning(name, result.warning));
    return result;
  } catch {
    warnings.push(warning(name, "No se pudo cargar esta fuente demo."));
    return fallback;
  }
}

function firstByCourse(items) {
  const values = [...items].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(a.id || "").localeCompare(String(b.id || "")));
  const grouped = new Map();
  values.forEach(item => {
    if (item && typeof item.courseId === "string" && !grouped.has(item.courseId)) grouped.set(item.courseId, item);
  });
  return [...grouped.values()];
}

function createAlert({ type, severity, title, description, courseId, courseName, createdAt, sourceId }) {
  return {
    id: `${type}:${courseId}:${sourceId || "summary"}`,
    type,
    severity,
    title,
    description,
    courseId,
    courseName,
    createdAt: typeof createdAt === "string" ? createdAt : ""
  };
}

function sourceSet(overrides = {}) {
  return {
    grades: overrides.grades || getStudentGrades,
    attendance: overrides.attendance || getStudentAttendance,
    materials: overrides.materials || getStudentMaterials,
    announcements: overrides.announcements || getStudentAnnouncements
  };
}

/**
 * Genera recomendaciones demo sin modificar fuentes, sesión ni almacenamiento.
 * `sources` permite probar degradación parcial sin cambiar los servicios reales.
 */
export function getStudentAcademicAlerts({ studentId, courseId = null, storage, sources } = {}) {
  const student = getStudentById(studentId);
  if (!student) return { available: false, alerts: [], warnings: [warning("student", "No se encontró el estudiante solicitado.")] };

  const courseMap = new Map(getCoursesByStudent(student.id).map(course => [course.id, course]));
  if (courseId && !courseMap.has(courseId)) return { available: false, alerts: [], warnings: [warning("course", "No tienes acceso a las alertas de este curso.")] };

  const warnings = [];
  const selectedSources = sourceSet(sources);
  const params = { studentId: student.id, courseId, storage };
  const gradesResult = safeSource(selectedSources.grades, "notas", params, { available: false, grades: [] }, warnings);
  const attendanceResult = safeSource(selectedSources.attendance, "asistencia", params, { available: false, courses: [] }, warnings);
  const materialsResult = safeSource(selectedSources.materials, "material", params, { available: false, materials: [] }, warnings);
  const announcementsResult = safeSource(selectedSources.announcements, "avisos", params, { available: false, announcements: [] }, warnings);
  const alerts = [];
  const visibleCourse = id => courseMap.get(id) && (!courseId || id === courseId);

  (Array.isArray(attendanceResult.courses) ? attendanceResult.courses : []).forEach(item => {
    if (!visibleCourse(item?.courseId) || !item.registered || !Number.isFinite(item.percentage) || item.percentage >= 75) return;
    const course = courseMap.get(item.courseId);
    const latest = Array.isArray(item.records) ? item.records[0] : null;
    alerts.push(createAlert({ type: "ATTENDANCE_WARNING", severity: "HIGH", title: "Asistencia baja", description: `Tu asistencia demo en ${course.nombre} está bajo el nivel recomendado.`, courseId: course.id, courseName: course.nombre, createdAt: latest?.createdAt || latest?.date || "", sourceId: latest?.id }));
  });

  firstByCourse(Array.isArray(gradesResult.grades) ? gradesResult.grades : []).forEach(item => {
    if (!visibleCourse(item.courseId) || !Number.isFinite(item.value)) return;
    const course = courseMap.get(item.courseId);
    if (item.value < 4) alerts.push(createAlert({ type: "GRADE_WARNING", severity: "MEDIUM", title: "Revisar rendimiento", description: `Existe una evaluación demo bajo el nivel esperado en ${course.nombre}.`, courseId: course.id, courseName: course.nombre, createdAt: item.createdAt, sourceId: item.id }));
    else if (item.value >= 6) alerts.push(createAlert({ type: "GOOD_PERFORMANCE", severity: "INFO", title: "Buen desempeño", description: `Tu rendimiento demo reciente en ${course.nombre} es destacado.`, courseId: course.id, courseName: course.nombre, createdAt: item.createdAt, sourceId: item.id }));
  });

  firstByCourse(Array.isArray(materialsResult.materials) ? materialsResult.materials : []).forEach(item => {
    if (!visibleCourse(item.courseId)) return;
    const course = courseMap.get(item.courseId);
    alerts.push(createAlert({ type: "NEW_MATERIAL", severity: "INFO", title: "Nuevo material disponible", description: `Tu profesor publicó contenido demo para ${course.nombre}.`, courseId: course.id, courseName: course.nombre, createdAt: item.createdAt, sourceId: item.id }));
  });

  firstByCourse(Array.isArray(announcementsResult.announcements) ? announcementsResult.announcements : []).forEach(item => {
    if (!visibleCourse(item.courseId)) return;
    const course = courseMap.get(item.courseId);
    alerts.push(createAlert({ type: "NEW_ANNOUNCEMENT", severity: "INFO", title: "Nuevo aviso del profesor", description: `Hay un aviso demo reciente en ${course.nombre}.`, courseId: course.id, courseName: course.nombre, createdAt: item.createdAt, sourceId: item.id }));
  });

  const ordered = alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id)).slice(0, 5);
  return { available: true, alerts: clone(ordered), warnings: clone(warnings) };
}
