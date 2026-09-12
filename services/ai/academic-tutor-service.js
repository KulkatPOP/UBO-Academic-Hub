// Tutor académico DEMO basado en reglas locales y contexto read-only.
// No usa APIs externas ni modifica notas, asistencia o evaluaciones.

import { getCoursesByStudent } from "../course-service.js";
import { getStudentById } from "../student-service.js";
import { getStudentAcademicRisk } from "../analytics/academic-risk-service.js";
import { getStudentMaterials } from "../student-actions/student-material-service.js";
import { getStudentEvaluations } from "../evaluation-service.js";
import { searchKnowledge } from "./knowledge-base-service.js";
import { generateAcademicRecommendations } from "../recommendation/academic-recommendation-service.js";

export const DEMO_TUTOR_HISTORY_STORAGE_KEY = "uboDemoTutorHistory";
const clone = value => JSON.parse(JSON.stringify(value));
const clean = value => typeof value === "string" ? value.trim() : "";
const asArray = value => Array.isArray(value) ? value : [];

function resolveStorage(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function safeRead(reader, args, fallback, warnings, source) { try { return reader(...args) ?? fallback; } catch { warnings.push({ source, message: `No fue posible leer ${source} demo.` }); return fallback; } }
function readHistory(storage) {
  if (!storage) return { records: [], warning: "El historial local no está disponible." };
  try { const parsed = JSON.parse(storage.getItem(DEMO_TUTOR_HISTORY_STORAGE_KEY) || "[]"); return { records: asArray(parsed).filter(item => item && typeof item.id === "string" && typeof item.studentId === "string" && typeof item.question === "string" && typeof item.response === "string" && typeof item.createdAt === "string"), warning: null }; }
  catch { return { records: [], warning: "No se pudo cargar el historial del tutor demo." }; }
}

function defaultSources() { return { student: getStudentById, courses: getCoursesByStudent, risk: getStudentAcademicRisk, materials: getStudentMaterials, evaluations: getStudentEvaluations, knowledge: searchKnowledge, recommendations: generateAcademicRecommendations }; }

function findCourseKnowledge(question, context, reader) {
  const seen = new Set();
  return asArray(context?.courses).flatMap(course => {
    try { return asArray(reader(question, course.id)); } catch { return []; }
  }).filter(item => item && typeof item.id === "string" && !seen.has(item.id) && seen.add(item.id))
    .sort((left, right) => Number(right.relevance || 0) - Number(left.relevance || 0) || String(left.title || "").localeCompare(String(right.title || ""), "es"))
    .slice(0, 3).map(clone);
}

export function buildStudentLearningContext(studentId, { storage, sources = {} } = {}) {
  const readers = { ...defaultSources(), ...sources };
  const warnings = [];
  const student = safeRead(readers.student, [studentId], null, warnings, "perfil");
  if (!student || student.id !== studentId) return clone({ available: false, student: null, courses: [], strengths: [], weaknesses: [], pendingEvaluations: 0, materials: [], warnings: [...warnings, { source: "perfil", message: "No se encontró el estudiante solicitado." }] });
  const courses = asArray(safeRead(readers.courses, [studentId], [], warnings, "cursos"));
  const risk = safeRead(readers.risk, [{ studentId, storage }], { available: false, courses: [], metrics: {} }, warnings, "analítica académica");
  const materials = safeRead(readers.materials, [{ studentId, storage }], { materials: [] }, warnings, "materiales");
  const evaluations = safeRead(readers.evaluations, [{ studentId, storage }], { evaluations: [] }, warnings, "evaluaciones");
  const failed = asArray(evaluations?.evaluations).flatMap(evaluation => asArray(evaluation?.submission?.autoGrade?.feedback)
    .filter(item => item?.correct === false).map(item => ({ courseId: evaluation.courseId, courseName: evaluation.courseName, topic: item.topic || "Sin tema" })));
  const weaknesses = [...new Set([...failed.map(item => item.topic), ...asArray(risk?.courses).filter(item => item.level === "HIGH" || item.level === "MEDIUM").flatMap(item => item.reasons || [])])];
  const strengths = asArray(risk?.courses).filter(item => item.level === "LOW").map(item => item.courseName);
  const pendingEvaluations = asArray(evaluations?.evaluations).filter(item => item?.open && !item?.submission).length;
  return clone({
    available: true,
    student: { id: student.id, name: student.nombre || student.name || "Estudiante UBO" },
    courses: courses.map(course => ({ id: course.id, name: course.nombre || course.name || course.id })),
    metrics: risk?.metrics || { average: null, attendance: null, trend: "SIN_DATOS" },
    level: risk?.level || "MEDIUM",
    strengths,
    weaknesses,
    failedQuestions: failed,
    pendingEvaluations,
    materials: asArray(materials?.materials).map(item => ({ courseId: item.courseId, title: item.title || "Material demo", type: item.type || "Material" })),
    warnings: [...warnings, ...(risk?.warnings || [])]
  });
}

export function generateTutorResponse(question, context, knowledge = [], academicRecommendations = null) {
  const prompt = clean(question);
  if (!prompt) return { response: "Escribe una pregunta para que pueda orientarte con tu información académica demo.", recommendations: [] };
  const normalized = prompt.toLowerCase();
  const weakTopic = context?.failedQuestions?.find(item => normalized.includes(String(item.topic).toLowerCase()))?.topic || context?.failedQuestions?.[0]?.topic || null;
  const recommendations = [];
  const sources = asArray(knowledge).map(item => `${item.source || "Material del curso"} · ${item.title || item.topic || "Contenido académico"}`);
  const topics = [...new Set(asArray(knowledge).map(item => item.topic).filter(Boolean))];
  let response;
  if (/cómo puedo mejorar|como puedo mejorar|cómo mejorar|como mejorar|recomend/.test(normalized) && academicRecommendations?.recommendations?.length) {
    const primary = academicRecommendations.recommendations[0];
    response = `Según tu rendimiento demo, te recomiendo ${String(primary.title || "mantener seguimiento académico").toLowerCase()}. ${primary.detail || ""}`.trim();
    academicRecommendations.recommendations.slice(0, 2).forEach(item => recommendations.push(item.title));
  } else if (knowledge[0]) {
    response = `Según el material del curso, ${knowledge[0].content}`;
  } else if (/cómo voy|como voy|rendimiento|progreso/.test(normalized)) {
    response = context?.level === "HIGH" ? "Tu seguimiento demo indica que conviene actuar pronto. Revisa los motivos y organiza apoyo académico." : context?.level === "LOW" ? "Tu desempeño demo es positivo. Mantén tu estrategia de estudio actual." : "Tu información demo sugiere seguimiento preventivo. Revisa asistencia, próximas evaluaciones y temas pendientes.";
  } else if (/qué debo estudiar|que debo estudiar|plan de estudio|estudiar/.test(normalized)) {
    response = weakTopic ? `Te conviene priorizar ${weakTopic}. Revisa el material asociado y practica con ejercicios antes de la próxima evaluación.` : "Prioriza tus evaluaciones pendientes y repasa el último material disponible de cada curso.";
  } else if (/sql|normaliz|modelo relacional|base de datos/.test(normalized)) {
    response = weakTopic ? `Según tus resultados demo, necesitas reforzar ${weakTopic}. Te recomiendo revisar el material del curso y practicar ejercicios paso a paso.` : "Para avanzar en este contenido, revisa conceptos clave, consulta el material del curso y practica un ejercicio breve por sesión.";
  } else {
    response = "Puedo ayudarte a organizar estudio, revisar tu avance demo o reforzar contenidos. Cuéntame qué tema o curso necesitas trabajar.";
  }
  if (context?.metrics?.attendance !== null && context?.metrics?.attendance !== undefined && context.metrics.attendance < 75) recommendations.push("Tu asistencia demo está bajo el rango recomendado. Organiza un plan de recuperación.");
  if (context?.pendingEvaluations > 0) recommendations.push(`Tienes ${context.pendingEvaluations} evaluación(es) demo pendiente(s). Planifica tiempo de preparación.`);
  if (weakTopic) recommendations.push(`Revisa material relacionado con ${weakTopic}.`);
  if (!recommendations.length && context?.level === "LOW") recommendations.push("Continúa con tu estrategia actual de estudio.");
  return clone({ response, recommendations, sources, topics });
}

export function getTutorHistory({ studentId, storage } = {}) {
  const source = readHistory(resolveStorage(storage));
  return { history: source.records.filter(item => item.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map(clone), warning: source.warning };
}

export function askAcademicTutor({ studentId, question, storage, now = new Date().toISOString(), sources = {} } = {}) {
  if (!clean(question)) return { answered: false, response: null, recommendations: [], errors: ["Escribe una pregunta para consultar al tutor académico demo."] };
  const context = buildStudentLearningContext(studentId, { storage, sources });
  if (!context.available) return { answered: false, response: null, recommendations: [], errors: [context.warnings?.[0]?.message || "No fue posible cargar tu contexto académico demo."] };
  const readers = { ...defaultSources(), ...sources };
  const knowledge = findCourseKnowledge(question, context, readers.knowledge);
  let academicRecommendations = null;
  try { academicRecommendations = readers.recommendations(studentId, { storage, persist: false }); } catch { academicRecommendations = null; }
  const answer = generateTutorResponse(question, context, knowledge, academicRecommendations);
  const target = resolveStorage(storage); const source = readHistory(target);
  if (!target) return { answered: false, response: null, recommendations: [], errors: [source.warning] };
  const record = { id: `tutor-${new Date(now).getTime()}-${source.records.length + 1}`, studentId, question: clean(question), response: answer.response, recommendations: answer.recommendations, sources: answer.sources, topics: answer.topics, createdAt: new Date(now).toISOString() };
  try { target.setItem(DEMO_TUTOR_HISTORY_STORAGE_KEY, JSON.stringify([record, ...source.records.filter(item => item.studentId !== studentId || item.id !== record.id)].slice(0, 40))); }
  catch { return { answered: false, response: null, recommendations: [], errors: ["No fue posible guardar el historial del tutor demo."] }; }
  return clone({ answered: true, response: answer.response, recommendations: answer.recommendations, sources: answer.sources, topics: answer.topics, context });
}
