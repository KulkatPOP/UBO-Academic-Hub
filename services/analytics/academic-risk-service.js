// Analítica predictiva DEMO, transparente y exclusivamente de lectura.
// No altera notas, asistencia, evaluaciones ni almacenamiento institucional.

import { getCourses, getCoursesByProfessor, getCoursesByStudent } from "../course-service.js";
import { getStudentById, getStudents, getStudentsByCourse } from "../student-service.js";
import { getStudentGrades } from "../student-actions/student-grade-service.js";
import { getStudentAttendance } from "../student-actions/student-attendance-service.js";
import { getEvaluationAutoGradeStatistics, getStudentEvaluations, getTeacherCourseEvaluations } from "../evaluation-service.js";

const clone = value => JSON.parse(JSON.stringify(value));
const asArray = value => Array.isArray(value) ? value : [];
const LEVEL_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export const ACADEMIC_RISK_RECOMMENDATIONS = Object.freeze({
  HIGH: "Se recomienda contacto con estudiante",
  MEDIUM: "Realizar seguimiento preventivo",
  LOW: "Continuar rendimiento actual"
});

function safeRead(reader, args, fallback, warnings, source) {
  try { return reader(...args) ?? fallback; }
  catch { warnings.push({ source, message: `No fue posible leer ${source} demo.` }); return fallback; }
}

function numericAverage(grades) {
  const values = asArray(grades).map(item => Number(item?.value)).filter(value => Number.isFinite(value) && value >= 1 && value <= 7);
  return values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)) : null;
}

function attendancePercentage(courses, courseId) {
  const attendance = asArray(courses).find(item => item?.courseId === courseId);
  if (!attendance || !Number.isFinite(Number(attendance.registered)) || Number(attendance.registered) < 1) return null;
  return attendance.percentage === null || attendance.percentage === undefined || !Number.isFinite(Number(attendance.percentage)) ? null : Number(attendance.percentage);
}

function gradeTrend(grades) {
  const ordered = asArray(grades).filter(item => Number.isFinite(Number(item?.value)))
    .slice().sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || String(a.id || "").localeCompare(String(b.id || "")));
  if (ordered.length < 2) return "SIN_DATOS";
  const delta = Number(ordered.at(-1).value) - Number(ordered.at(-2).value);
  if (delta > 0.2) return "EN_MEJORA";
  if (delta < -0.2) return "EN_DESCENSO";
  return "ESTABLE";
}

function evaluateRisk({ average, attendance, pendingEvaluations }) {
  const highReasons = [];
  if (attendance !== null && attendance < 75) highReasons.push(`Asistencia ${attendance.toFixed(1).replace(".", ",")}% bajo 75%.`);
  if (average !== null && average < 4) highReasons.push(`Promedio demo ${average.toFixed(1).replace(".", ",")} bajo 4,0.`);
  if (pendingEvaluations >= 2) highReasons.push("Hay 2 o más evaluaciones demo pendientes.");
  if (highReasons.length) return { level: "HIGH", reasons: highReasons };

  const mediumReasons = [];
  if (attendance !== null && attendance >= 75 && attendance < 85) mediumReasons.push(`Asistencia ${attendance.toFixed(1).replace(".", ",")}% entre 75% y 85%.`);
  if (average !== null && average >= 4 && average < 5) mediumReasons.push(`Promedio demo ${average.toFixed(1).replace(".", ",")} entre 4,0 y 5,0.`);
  if (mediumReasons.length) return { level: "MEDIUM", reasons: mediumReasons };

  if (average !== null && average >= 5 && attendance !== null && attendance >= 85) return { level: "LOW", reasons: ["Promedio y asistencia demo dentro del rango esperado."] };
  return { level: "MEDIUM", reasons: ["Información académica demo parcial; se recomienda seguimiento preventivo."] };
}

function riskCourse(course, grades, attendanceCourses, evaluations) {
  const courseGrades = asArray(grades).filter(item => item?.courseId === course.id);
  const courseEvaluations = asArray(evaluations).filter(item => item?.courseId === course.id);
  const average = numericAverage(courseGrades);
  const attendance = attendancePercentage(attendanceCourses, course.id);
  const pendingEvaluations = courseEvaluations.filter(item => item?.open === true && !item.submission).length;
  const result = evaluateRisk({ average, attendance, pendingEvaluations });
  return {
    courseId: course.id,
    courseName: course.nombre || course.name || course.id,
    average,
    attendance,
    pendingEvaluations,
    trend: gradeTrend(courseGrades),
    ...result,
    recommendation: ACADEMIC_RISK_RECOMMENDATIONS[result.level]
  };
}

function worstLevel(courses) {
  return asArray(courses).reduce((current, item) => LEVEL_ORDER[item.level] > LEVEL_ORDER[current] ? item.level : current, "LOW");
}

function defaultSources() {
  return {
    student: getStudentById,
    students: getStudents,
    coursesByStudent: getCoursesByStudent,
    coursesByProfessor: getCoursesByProfessor,
    courses: getCourses,
    studentsByCourse: getStudentsByCourse,
    grades: getStudentGrades,
    attendance: getStudentAttendance,
    evaluations: getStudentEvaluations,
    teacherEvaluations: getTeacherCourseEvaluations,
    evaluationStatistics: getEvaluationAutoGradeStatistics
  };
}

/** Obtiene el riesgo DEMO de un estudiante; no escribe sobre ninguna fuente. */
export function getStudentAcademicRisk({ studentId, courseId = null, storage, sources = {} } = {}) {
  const readers = { ...defaultSources(), ...sources };
  const warnings = [];
  const student = safeRead(readers.student, [studentId], null, warnings, "perfil");
  if (!student || student.id !== studentId) return clone({ available: false, student: null, courses: [], level: null, reasons: [], warnings: [...warnings, { source: "perfil", message: "El estudiante solicitado no está disponible." }] });

  const courses = asArray(safeRead(readers.coursesByStudent, [studentId], [], warnings, "cursos"))
    .filter(course => course?.id && (!courseId || course.id === courseId));
  if (courseId && !courses.length) return clone({ available: false, student: { id: student.id, name: student.nombre || student.name || "Estudiante UBO" }, courses: [], level: null, reasons: [], warnings: [...warnings, { source: "curso", message: "El curso solicitado no pertenece al estudiante." }] });

  const gradeResult = safeRead(readers.grades, [{ studentId, courseId, storage }], { grades: [] }, warnings, "notas");
  const attendanceResult = safeRead(readers.attendance, [{ studentId, courseId, storage }], { courses: [] }, warnings, "asistencia");
  const evaluationResult = safeRead(readers.evaluations, [{ studentId, storage }], { evaluations: [] }, warnings, "evaluaciones");
  if (gradeResult?.warning) warnings.push({ source: "notas", message: String(gradeResult.warning) });
  if (attendanceResult?.warning) warnings.push({ source: "asistencia", message: String(attendanceResult.warning) });
  if (evaluationResult?.warning) warnings.push({ source: "evaluaciones", message: String(evaluationResult.warning) });

  const courseRisks = courses.map(course => riskCourse(course, gradeResult?.grades, attendanceResult?.courses, evaluationResult?.evaluations));
  const averages = courseRisks.map(item => item.average).filter(value => value !== null);
  const attendances = courseRisks.map(item => item.attendance).filter(value => value !== null);
  const level = worstLevel(courseRisks);
  const reasons = [...new Set(courseRisks.filter(item => item.level === level).flatMap(item => item.reasons))];
  return clone({
    available: true,
    student: { id: student.id, name: student.nombre || student.name || "Estudiante UBO" },
    level,
    reasons,
    recommendation: ACADEMIC_RISK_RECOMMENDATIONS[level],
    metrics: {
      average: averages.length ? Number((averages.reduce((total, value) => total + value, 0) / averages.length).toFixed(1)) : null,
      attendance: attendances.length ? Number((attendances.reduce((total, value) => total + value, 0) / attendances.length).toFixed(1)) : null,
      pendingEvaluations: courseRisks.reduce((total, item) => total + item.pendingEvaluations, 0),
      trend: courseRisks.some(item => item.trend === "EN_DESCENSO") ? "EN_DESCENSO" : courseRisks.some(item => item.trend === "EN_MEJORA") ? "EN_MEJORA" : "ESTABLE"
    },
    courses: courseRisks,
    warnings
  });
}

/** Resume riesgos de los alumnos de los cursos asignados a un profesor. */
export function getTeacherAcademicRiskSummary({ teacherId, courseId = null, storage, sources = {} } = {}) {
  const readers = { ...defaultSources(), ...sources };
  const warnings = [];
  const courses = asArray(safeRead(readers.coursesByProfessor, [teacherId], [], warnings, "cursos"))
    .filter(course => course?.professorId === teacherId && (!courseId || course.id === courseId));
  if (courseId && !courses.length) return clone({ available: false, courses: [], warnings: [...warnings, { source: "curso", message: "El curso solicitado no pertenece al profesor." }] });
  const summaries = courses.map(course => {
    const students = asArray(safeRead(readers.studentsByCourse, [course.id], [], warnings, "estudiantes"));
    const risks = students.map(student => getStudentAcademicRisk({ studentId: student.id, courseId: course.id, storage, sources: readers }))
      .filter(result => result.available).map(result => ({ studentId: result.student.id, studentName: result.student.name, level: result.level, reasons: result.reasons, recommendation: result.recommendation, metrics: result.metrics }));
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    risks.forEach(risk => { counts[risk.level] += 1; });
    const identity = { id: teacherId, role: "TEACHER" };
    const evaluations = safeRead(readers.teacherEvaluations, [{ courseId: course.id, identity, storage }], { evaluations: [] }, warnings, "evaluaciones");
    const difficultQuestions = asArray(evaluations?.evaluations).flatMap(evaluation => {
      const statistics = safeRead(readers.evaluationStatistics, [{ evaluationId: evaluation.id, identity, storage }], { statistics: null }, warnings, "corrección automática");
      return asArray(statistics?.statistics?.difficultQuestions).map(question => ({ ...question, evaluationTitle: evaluation.title }));
    }).filter(question => question.correctPercentage !== null).sort((a, b) => a.correctPercentage - b.correctPercentage).slice(0, 1);
    return { courseId: course.id, courseName: course.nombre || course.name || course.id, totalStudents: risks.length, counts, studentsAtRisk: risks.filter(item => item.level !== "LOW"), difficultQuestions };
  });
  return clone({ available: true, courses: summaries, warnings });
}

/** Compone analítica institucional DEMO. Todas las métricas son derivadas. */
export function getInstitutionalAcademicRiskSummary({ storage, sources = {} } = {}) {
  const readers = { ...defaultSources(), ...sources };
  const warnings = [];
  const students = asArray(safeRead(readers.students, [], [], warnings, "estudiantes"));
  const courses = asArray(safeRead(readers.courses, [], [], warnings, "cursos"));
  const risks = students.map(student => getStudentAcademicRisk({ studentId: student.id, storage, sources: readers })).filter(result => result.available);
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  risks.forEach(risk => { counts[risk.level] += 1; });
  const values = risks.map(risk => risk.metrics.average).filter(value => value !== null);
  const attendance = risks.map(risk => risk.metrics.attendance).filter(value => value !== null);
  const criticalCourses = courses.filter(course => risks.some(risk => risk.courses.some(item => item.courseId === course.id && item.level === "HIGH"))).map(course => ({ id: course.id, name: course.nombre || course.name || course.id }));
  return clone({ available: true, metrics: { studentsAnalyzed: risks.length, criticalCourses: criticalCourses.length, average: values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)) : null, attendance: attendance.length ? Number((attendance.reduce((total, value) => total + value, 0) / attendance.length).toFixed(1)) : null, alerts: counts.HIGH + counts.MEDIUM, counts }, criticalCourses, risks: risks.map(risk => ({ student: risk.student, level: risk.level, reasons: risk.reasons })), warnings });
}
