// Inteligencia académica LMS derivada: no persiste perfiles ni modifica fuentes.
// Sus señales describen evidencia DEMO del LMS; no son una evaluación oficial UBO.

import { calculateLmsRisk, getStudentAnalytics, getStudentCourseAnalytics } from "./analytics-service.js";
import { getStudentProgress, getStudentCourseProgress } from "./progress-service.js";
import { getRecommendations } from "./recommendation-service.js";

const SOURCE = "LMS";
const clone = value => JSON.parse(JSON.stringify(value));
const number = value => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;

const readersFor = overrides => ({
  progress: getStudentProgress,
  courseProgress: getStudentCourseProgress,
  analytics: getStudentAnalytics,
  courseAnalytics: getStudentCourseAnalytics,
  recommendations: getRecommendations,
  ...overrides
});

function evidence(code, severity, reason, values, course) {
  return { code, severity, reason, evidence: values, dataSource: SOURCE, courseId: course.courseId, courseName: course.courseName };
}

function deriveCourse(course) {
  const signals = [], strengths = [], attentionAreas = [], studyNeeds = [];
  const evaluations = course.evaluations || {}, attendance = course.attendance || {}, materials = course.materials || {}, activity = course.activity || {};
  const published = number(evaluations.published), submitted = number(evaluations.submitted), pending = number(evaluations.pending);
  const sessions = number(attendance.sessions), attended = number(attendance.attended), attendanceRate = number(attendance.attendanceRate);
  const viewed = number(materials.viewed), availableMaterials = number(materials.available);
  const hasEvaluationEvidence = published !== null && published > 0;
  const hasAttendanceEvidence = sessions !== null && sessions > 0 && attendanceRate !== null;
  const hasMaterialEvidence = viewed !== null && viewed > 0;

  if (hasEvaluationEvidence) {
    const values = { published, submitted: submitted ?? 0, pending: pending ?? Math.max(0, published - (submitted ?? 0)), submissionRate: number(evaluations.submissionRate) };
    if (values.pending > 0) {
      const item = evidence("PENDING_EVALUATION", values.pending >= 2 ? "WARNING" : "INFO", "Existen evaluaciones LMS publicadas sin entrega registrada.", values, course);
      signals.push(item); attentionAreas.push(item);
      studyNeeds.push({ code: "COMPLETE_PENDING_EVALUATION", reason: "Completar las evaluaciones LMS pendientes del curso.", evidence: values, dataSource: SOURCE, courseId: course.courseId, courseName: course.courseName });
    }
    if (values.pending >= 2) {
      const item = evidence("LOW_SUBMISSION_RATE", "WARNING", "Hay dos o más evaluaciones LMS pendientes en el curso.", values, course);
      signals.push(item); attentionAreas.push(item);
      studyNeeds.push({ code: "REVIEW_COURSE_CONTENT", reason: "Revisar el contenido disponible antes de completar evaluaciones LMS pendientes.", evidence: values, dataSource: SOURCE, courseId: course.courseId, courseName: course.courseName });
    }
    if (values.pending === 0 && values.submitted >= published) strengths.push(evidence("HIGH_EVALUATION_COMPLETION", "INFO", "Las evaluaciones LMS publicadas del curso tienen una entrega registrada.", values, course));
  }

  if (hasAttendanceEvidence) {
    const values = { sessions, attended: attended ?? 0, attendanceRate };
    if (attendanceRate < 75) {
      const item = evidence("LOW_ATTENDANCE_LMS", "HIGH", "La asistencia registrada en sesiones LMS está bajo el umbral existente de 75%.", values, course);
      signals.push(item); attentionAreas.push(item);
    } else {
      strengths.push(evidence("GOOD_ATTENDANCE_LMS", "INFO", "La asistencia registrada en sesiones LMS cumple el umbral existente de 75%.", values, course));
    }
  }

  if (hasMaterialEvidence) {
    strengths.push(evidence("MATERIAL_ENGAGEMENT", "INFO", "Existe actividad registrada sobre materiales LMS del curso.", { available: availableMaterials, viewed, materialEvents: number(activity.events) }, course));
  }

  if (!hasEvaluationEvidence && !hasAttendanceEvidence && !hasMaterialEvidence) {
    signals.push(evidence("INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "No hay evidencia LMS suficiente de evaluaciones, asistencia registrada o interacción con materiales para generar una señal confiable.", { publishedEvaluations: published, attendanceSessions: sessions, materialViews: viewed, activityEvents: number(activity.events) }, course));
  }

  return { ...course, signals, strengths, attentionAreas, studyNeeds };
}

function deriveRecommendedActions(courses, recommendations) {
  const actions = [];
  courses.forEach(course => course.studyNeeds.forEach(need => actions.push({
    code: need.code, priority: need.code === "COMPLETE_PENDING_EVALUATION" ? "WARNING" : "INFO", trigger: need.code === "COMPLETE_PENDING_EVALUATION" ? "PENDING_EVALUATION" : "LOW_SUBMISSION_RATE", reason: need.reason, dataSource: SOURCE, courseId: need.courseId, courseName: need.courseName, resourceReference: null
  })));
  recommendations.forEach(item => {
    if (!item?.courseId || !courses.some(course => course.courseId === item.courseId)) return;
    const triggers = courses.find(course => course.courseId === item.courseId)?.attentionAreas || [];
    if (!triggers.length || !item.resourceReference) return;
    actions.push({ code: "AVAILABLE_LMS_RESOURCE", priority: item.priority || "INFO", trigger: triggers[0].code, reason: `El recurso LMS existente es relevante por: ${triggers[0].reason}`, dataSource: SOURCE, courseId: item.courseId, courseName: item.courseName || null, resourceReference: item.resourceReference, resourceTitle: item.resourceTitle || null });
  });
  return actions;
}

function assemble(studentId, progress, analytics, recommendations) {
  const courses = (Array.isArray(progress.courses) ? progress.courses : []).map(deriveCourse);
  const published = courses.reduce((sum, course) => sum + (number(course.evaluations?.published) || 0), 0);
  const pending = courses.reduce((sum, course) => sum + (number(course.evaluations?.pending) || 0), 0);
  const sessions = courses.reduce((sum, course) => sum + (number(course.attendance?.sessions) || 0), 0);
  const attended = courses.reduce((sum, course) => sum + (number(course.attendance?.attended) || 0), 0);
  const attendanceRate = sessions > 0 ? Number(((attended / sessions) * 100).toFixed(2)) : null;
  const averageScore = number(analytics?.evaluations?.averageScore);
  const riskEvidence = published > 0 || sessions > 0 || averageScore !== null;
  const calculatedRisk = riskEvidence ? calculateLmsRisk({ pendingEvaluations: published > 0 ? pending : null, averageScore, attendanceRate }) : { risk: "INSUFFICIENT_DATA", reasons: [] };
  const signals = courses.flatMap(course => course.signals);
  const strengths = courses.flatMap(course => course.strengths);
  const attentionAreas = courses.flatMap(course => course.attentionAreas);
  const studyNeeds = courses.flatMap(course => course.studyNeeds);
  if (averageScore !== null && averageScore < 5) {
    const averageSignal = { code: "LOW_AVERAGE_SCORE_LMS", severity: averageScore < 4 ? "HIGH" : "WARNING", reason: averageScore < 4 ? "El promedio calculado desde entregas LMS está bajo el umbral existente de 4,0." : "El promedio calculado desde entregas LMS está bajo el rango 5,0 usado por Analytics LMS.", evidence: { averageScore }, dataSource: SOURCE, courseId: null, courseName: null };
    signals.push(averageSignal); attentionAreas.push(averageSignal);
  }
  const riskReasons = attentionAreas.filter(item => item.severity === "WARNING" || item.severity === "HIGH");
  const risk = {
    level: calculatedRisk.risk,
    reasons: riskReasons.length ? riskReasons : calculatedRisk.risk === "INSUFFICIENT_DATA" ? signals.filter(item => item.code === "INSUFFICIENT_DATA") : [],
    evidence: { publishedEvaluations: published || null, pendingEvaluations: published ? pending : null, attendanceSessions: sessions || null, attendanceRate, averageScore },
    dataSource: SOURCE
  };
  return {
    authorized: true,
    source: SOURCE,
    studentId,
    risk,
    trend: { status: "INSUFFICIENT_DATA", reason: "No existe historial temporal LMS suficiente para calcular una tendencia.", dataSource: SOURCE },
    courses: courses.map(course => ({ courseId: course.courseId, courseName: course.courseName, evidence: { materials: course.materials, evaluations: course.evaluations, attendance: course.attendance, activity: course.activity } })),
    signals,
    strengths,
    attentionAreas,
    studyNeeds,
    recommendedActions: deriveRecommendedActions(courses, recommendations)
  };
}

/** Calcula un perfil temporal, explicable y de sólo lectura desde fuentes LMS existentes. */
export async function getStudentIntelligence(studentId, { query, sources = {} } = {}) {
  const readers = readersFor(sources);
  const progress = await readers.progress(studentId, { query });
  if (!progress?.authorized) return { authorized: false, code: progress?.code || "STUDENT_ROLE_REQUIRED" };
  const [analytics, recommendationResult] = await Promise.all([
    readers.analytics(studentId, { query }),
    readers.recommendations(studentId, { query })
  ]);
  return clone(assemble(studentId, progress, analytics?.authorized ? analytics : null, recommendationResult?.authorized ? recommendationResult.recommendations || [] : []));
}

/** Igual que el resumen estudiantil, limitado a un curso validado por progreso LMS. */
export async function getStudentCourseIntelligence(studentId, courseId, { query, sources = {} } = {}) {
  const readers = readersFor(sources);
  const progress = await readers.courseProgress(studentId, courseId, { query });
  if (!progress?.authorized) return { authorized: false, code: progress?.code || "COURSE_ACCESS_DENIED" };
  const [analytics, recommendationResult] = await Promise.all([
    readers.courseAnalytics(studentId, courseId, { query }),
    readers.recommendations(studentId, { query })
  ]);
  const scopedProgress = { courses: progress.course ? [progress.course] : [] };
  return clone(assemble(studentId, scopedProgress, analytics?.authorized ? analytics : null, recommendationResult?.authorized ? recommendationResult.recommendations || [] : []));
}

/** Contexto mínimo y estructurado que el Tutor puede consumir sin recibir credenciales ni mensajes privados. */
export async function getStudentCourseIntelligenceContext(studentId, courseId, options = {}) {
  const result = await getStudentCourseIntelligence(studentId, courseId, options);
  if (!result.authorized) return result;
  return {
    authorized: true,
    source: SOURCE,
    studentId: result.studentId,
    courseId: result.courses[0]?.courseId || null,
    signals: result.signals,
    strengths: result.strengths,
    attentionAreas: result.attentionAreas,
    recommendedActions: result.recommendedActions
  };
}
