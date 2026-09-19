// Decisiones de recomendación LMS derivadas: no escriben ni crean recursos.
import { getStudentCourseIntelligence, getStudentIntelligence } from "./academic-intelligence-service.js";
import { getEvaluationsForStudent } from "./evaluation-service.js";
import { getMaterialsByCourseForStudent } from "./material-service.js";
import { getRecommendations } from "./recommendation-service.js";

const SOURCE = "LMS";
const clone = value => JSON.parse(JSON.stringify(value));

function priority(signal, risk) {
  if (signal?.code === "PENDING_EVALUATION" && risk?.level === "HIGH") return "HIGH";
  if (signal?.severity === "HIGH") return "HIGH";
  if (signal?.severity === "WARNING") return "MEDIUM";
  return "LOW";
}

function decision({ type, trigger, signal, risk, resource, evidence }) {
  return {
    type,
    priority: priority(signal, risk),
    trigger,
    reason: signal.reason,
    evidence: evidence || signal.evidence,
    resource,
    dataSource: SOURCE
  };
}

function persistedForResource(recommendations, resource) {
  return recommendations.find(item => item.resourceReference === resource.reference) || null;
}

async function resourcesFor(studentId, courseId, readers, query) {
  const [materialsResult, evaluationsResult] = await Promise.all([
    readers.materials(studentId, courseId, { query }),
    readers.evaluations(studentId, { query })
  ]);
  const materials = materialsResult?.authorized ? materialsResult.materials || [] : [];
  const evaluations = evaluationsResult?.authorized ? (evaluationsResult.evaluations || []).filter(item => item.courseId === courseId && item.status === "PUBLISHED") : [];
  return { materials, evaluations };
}

async function decideCourse(studentId, intelligence, persisted, readers, query) {
  const course = intelligence.courses[0];
  if (!course) return [];
  const { materials, evaluations } = await resourcesFor(studentId, course.courseId, readers, query);
  const decisions = [];
  const signals = intelligence.signals || [];
  for (const signal of signals) {
    if (signal.code === "PENDING_EVALUATION") {
      const evaluation = evaluations[0];
      if (!evaluation) continue;
      const resource = { type: "EVALUATION", reference: evaluation.id, title: evaluation.title, courseId: course.courseId };
      decisions.push({ ...decision({ type: "COMPLETE_EVALUATION", trigger: signal.code, signal, risk: intelligence.risk, resource }), persistedRecommendationId: persistedForResource(persisted, resource)?.id || null });
      continue;
    }
    if (!["LOW_ATTENDANCE_LMS", "LOW_SUBMISSION_RATE"].includes(signal.code)) continue;
    const material = materials[0]; // orden estable del servicio: creación y título.
    if (material) {
      const resource = { type: "MATERIAL", reference: material.id, title: material.title, courseId: course.courseId };
      decisions.push({ ...decision({ type: "REVIEW_MATERIAL", trigger: signal.code, signal, risk: intelligence.risk, resource }), persistedRecommendationId: persistedForResource(persisted, resource)?.id || null });
    } else {
      const resource = { type: "COURSE", reference: course.courseId, title: course.courseName, courseId: course.courseId };
      decisions.push(decision({ type: "REVIEW_COURSE", trigger: signal.code, signal, risk: intelligence.risk, resource }));
    }
  }
  return decisions;
}

function readersFor(overrides = {}) {
  return {
    intelligence: getStudentIntelligence,
    courseIntelligence: getStudentCourseIntelligence,
    materials: getMaterialsByCourseForStudent,
    evaluations: getEvaluationsForStudent,
    persisted: getRecommendations,
    ...overrides
  };
}

/** Decide recomendaciones temporales, explicables y no persistentes sobre recursos LMS verificados. */
export async function getIntelligentRecommendations(studentId, { courseId = null, query, sources = {} } = {}) {
  const readers = readersFor(sources);
  const intelligence = courseId
    ? await readers.courseIntelligence(studentId, courseId, { query })
    : await readers.intelligence(studentId, { query });
  if (!intelligence?.authorized) return { authorized: false, code: intelligence?.code || "STUDENT_ROLE_REQUIRED", recommendations: [] };
  const persistedResult = await readers.persisted(studentId, { query });
  const persisted = persistedResult?.authorized ? persistedResult.recommendations || [] : [];
  const scoped = courseId ? [intelligence] : await Promise.all((intelligence.courses || []).map(course => readers.courseIntelligence(studentId, course.courseId, { query })));
  const recommendations = (await Promise.all(scoped.filter(item => item?.authorized).map(item => decideCourse(studentId, item, persisted, readers, query)))).flat();
  return clone({
    authorized: true,
    source: SOURCE,
    recommendationStatus: recommendations.length ? "AVAILABLE" : "INSUFFICIENT_DATA",
    recommendations
  });
}
