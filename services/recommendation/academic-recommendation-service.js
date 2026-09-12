// Recomendador académico DEMO: solo lectura sobre LMS y persistencia aislada de sugerencias.
// No modifica notas, asistencia, evaluaciones, materiales ni datos institucionales.

import { getStudentById } from "../student-service.js";
import { getCoursesByStudent } from "../course-service.js";
import { getStudentAcademicRisk, getTeacherAcademicRiskSummary, getInstitutionalAcademicRiskSummary } from "../analytics/academic-risk-service.js";
import { getStudentEvaluations } from "../evaluation-service.js";
import { getStudentMaterials } from "../student-actions/student-material-service.js";
import { searchKnowledge } from "../ai/knowledge-base-service.js";

export const DEMO_RECOMMENDATIONS_HISTORY_STORAGE_KEY = "uboDemoRecommendationsHistory";
const clone = value => JSON.parse(JSON.stringify(value));
const asArray = value => Array.isArray(value) ? value : [];

function resolveStorage(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function safeRead(reader, args, fallback, warnings, source) { try { return reader(...args) ?? fallback; } catch { warnings.push({ source, message: `No fue posible analizar ${source} demo.` }); return fallback; } }
function readHistory(storage) {
  if (!storage) return { records: [], warning: "El historial de recomendaciones no está disponible." };
  try {
    const parsed = JSON.parse(storage.getItem(DEMO_RECOMMENDATIONS_HISTORY_STORAGE_KEY) || "[]");
    return { records: asArray(parsed).filter(item => item && typeof item.studentId === "string" && Array.isArray(item.recommendations) && typeof item.generatedAt === "string"), warning: null };
  } catch { return { records: [], warning: "No se pudo leer el historial de recomendaciones demo." }; }
}
function writeHistory(record, storage) {
  const source = readHistory(storage);
  if (!storage) return source.warning;
  try { storage.setItem(DEMO_RECOMMENDATIONS_HISTORY_STORAGE_KEY, JSON.stringify([record, ...source.records].slice(0, 40))); return null; }
  catch { return "No se pudo guardar el historial de recomendaciones demo."; }
}
function defaults() { return { student: getStudentById, courses: getCoursesByStudent, risk: getStudentAcademicRisk, evaluations: getStudentEvaluations, materials: getStudentMaterials, knowledge: searchKnowledge, teacherRisk: getTeacherAcademicRiskSummary, institutionalRisk: getInstitutionalAcademicRiskSummary }; }
function failedTopics(evaluations) {
  const topics = new Map();
  asArray(evaluations?.evaluations).flatMap(evaluation => asArray(evaluation?.submission?.autoGrade?.feedback)).forEach(item => {
    if (!item || item.correct === null || item.correct === undefined) return;
    const topic = item.topic || "Contenido sin tema";
    const totals = topics.get(topic) || { total: 0, failed: 0 };
    totals.total += 1;
    if (item.correct === false) totals.failed += 1;
    topics.set(topic, totals);
  });
  return [...topics].filter(([, totals]) => totals.total > 0 && totals.failed / totals.total > 0.5).map(([topic]) => topic);
}
function recommendedResources(topics, courses, materials, findKnowledge) {
  const resources = [];
  const seen = new Set();
  topics.forEach(topic => asArray(courses).forEach(course => asArray(findKnowledge(topic, course.id)).slice(0, 1).forEach(document => {
    if (seen.has(document.id)) return;
    seen.add(document.id);
    resources.push({ id: document.id, title: document.title, topic: document.topic, source: document.source, type: "KNOWLEDGE" });
  })));
  asArray(materials?.materials).forEach(material => {
    const title = typeof material?.title === "string" ? material.title : "";
    if (!title || seen.has(`material:${title}`)) return;
    seen.add(`material:${title}`);
    resources.push({ id: material.id || `material:${title}`, title, topic: material.topic || null, source: material.type || "Material del curso", type: "MATERIAL" });
  });
  return resources;
}
function recommendation(type, title, detail, topic = null) { return { type, title, detail, topic }; }

/** Genera recomendaciones demo para un estudiante y, por defecto, registra un snapshot aislado. */
export function generateAcademicRecommendations(studentId, { storage, sources = {}, now = new Date().toISOString(), persist = true } = {}) {
  const readers = { ...defaults(), ...sources };
  const warnings = [];
  const student = safeRead(readers.student, [studentId], null, warnings, "perfil");
  if (!student || student.id !== studentId) return clone({ available: false, studentId, status: "UNAVAILABLE", strengths: [], weaknesses: [], recommendations: [], studyPlan: [], warnings: [...warnings, { source: "perfil", message: "El estudiante solicitado no está disponible." }] });
  const courses = asArray(safeRead(readers.courses, [studentId], [], warnings, "cursos"));
  const risk = safeRead(readers.risk, [{ studentId, storage }], { available: false, metrics: {}, courses: [] }, warnings, "riesgo académico");
  const evaluations = safeRead(readers.evaluations, [{ studentId, storage }], { evaluations: [] }, warnings, "evaluaciones");
  const materials = safeRead(readers.materials, [{ studentId, storage }], { materials: [] }, warnings, "materiales");
  const average = Number.isFinite(Number(risk?.metrics?.average)) ? Number(risk.metrics.average) : null;
  const attendance = Number.isFinite(Number(risk?.metrics?.attendance)) ? Number(risk.metrics.attendance) : null;
  const pending = Number(risk?.metrics?.pendingEvaluations || 0);
  const weakTopics = failedTopics(evaluations);
  const resources = recommendedResources(weakTopics, courses, materials, readers.knowledge);
  const strengths = [];
  const weaknesses = [...weakTopics];
  const recommendations = [];
  if (average !== null && average < 4) recommendations.push(recommendation("LOW_PERFORMANCE", "Reforzar contenidos fundamentales", "Tu promedio demo está bajo 4,0. Prioriza los conceptos esenciales antes de la próxima evaluación."));
  if (attendance !== null && attendance < 75) recommendations.push(recommendation("LOW_ATTENDANCE", "Mejorar asistencia y revisar clases perdidas", "Tu asistencia demo está bajo 75%. Revisa las clases pendientes y organiza un plan de recuperación."));
  weakTopics.forEach(topic => recommendations.push(recommendation("WEAK_TOPIC", `Revisar material relacionado con ${topic}`, "Se detectaron errores demo en este tema. Revisa el material disponible y practica ejercicios guiados.", topic)));
  if (pending > 0) recommendations.push(recommendation("PENDING_EVALUATION", "Planificar evaluaciones pendientes", `Tienes ${pending} evaluación(es) demo pendiente(s). Reserva tiempo de preparación esta semana.`));
  if (average !== null && average >= 5.5 && attendance !== null && attendance >= 85) { strengths.push("Promedio y asistencia demo dentro del rango esperado"); recommendations.push(recommendation("GOOD_PERFORMANCE", "Continuar estrategia actual", "Tu rendimiento demo es positivo. Mantén tu planificación y revisa contenidos antes de cada evaluación.")); }
  asArray(risk?.courses).filter(course => course.level === "LOW").forEach(course => strengths.push(`${course.courseName}: rendimiento estable`));
  if (!recommendations.length) recommendations.push(recommendation("FOLLOW_UP", "Mantener seguimiento académico", "No hay suficientes indicadores demo para una recomendación específica. Revisa material y próximas actividades."));
  const topic = weakTopics[0] || courses[0]?.nombre || "contenidos del curso";
  const studyPlan = [
    { day: "Día 1", action: "Revisar", detail: topic, resource: resources[0]?.title || topic },
    { day: "Día 2", action: "Practicar", detail: weakTopics[0] ? `Ejercicios de ${weakTopics[0]}` : "Ejercicios del material disponible", resource: "Banco de preguntas" },
    { day: "Día 3", action: "Aplicar", detail: pending > 0 ? "Preparación de evaluación práctica" : "Autoevaluación de avance", resource: pending > 0 ? "Evaluación pendiente" : "Autoevaluación" }
  ];
  const result = { available: true, studentId: student.id, status: risk?.level || "MEDIUM", strengths: [...new Set(strengths)], weaknesses: [...new Set(weaknesses)], recommendations, studyPlan, resources, metrics: { average, attendance, pendingEvaluations: pending, materials: asArray(materials?.materials).length }, warnings: [...warnings, ...(risk?.warnings || [])] };
  if (persist) {
    const warning = writeHistory({ studentId: student.id, recommendations: clone(recommendations), studyPlan: clone(studyPlan), generatedAt: new Date(now).toISOString() }, resolveStorage(storage));
    if (warning) result.warnings.push({ source: "historial", message: warning });
  }
  return clone(result);
}

export function getAcademicRecommendationsHistory({ studentId, storage } = {}) {
  const source = readHistory(resolveStorage(storage));
  return { history: source.records.filter(record => record.studentId === studentId).sort((left, right) => right.generatedAt.localeCompare(left.generatedAt)).slice(0, 8).map(clone), warning: source.warning };
}

/** Resumen read-only de acciones sugeridas por curso para el profesor asignado. */
export function getTeacherCourseRecommendations({ teacherId, storage, sources = {} } = {}) {
  const readers = { ...defaults(), ...sources };
  const result = safeRead(readers.teacherRisk, [{ teacherId, storage }], { available: false, courses: [], warnings: [] }, [], "riesgo docente");
  if (!result.available) return clone({ available: false, courses: [], warnings: result.warnings || [] });
  return clone({ available: true, courses: asArray(result.courses).map(course => {
    const criticalTopic = course.difficultQuestions?.[0]?.topic || null;
    const actions = [];
    if (criticalTopic) actions.push(`Crear actividad complementaria sobre ${criticalTopic}.`);
    if (course.counts?.HIGH > 0) actions.push("Contactar a estudiantes con seguimiento alto.");
    if (!actions.length) actions.push("Mantener seguimiento y revisar próximas evaluaciones.");
    return { courseId: course.courseId, courseName: course.courseName, criticalTopic, actions };
  }), warnings: result.warnings || [] });
}

/** Indicador read-only para la vista administrativa. */
export function getInstitutionalAcademicRecommendations({ storage, sources = {} } = {}) {
  const readers = { ...defaults(), ...sources };
  const result = safeRead(readers.institutionalRisk, [{ storage }], { available: false, criticalCourses: [], metrics: {}, warnings: [] }, [], "riesgo institucional");
  if (!result.available) return clone({ available: false, courses: [], actions: [], warnings: result.warnings || [] });
  const courses = asArray(result.criticalCourses).map(course => ({ id: course.id, name: course.name }));
  return clone({ available: true, courses, actions: courses.length ? ["Priorizar acompañamiento académico en los cursos críticos."] : ["Mantener monitoreo preventivo institucional."], warnings: result.warnings || [] });
}
