import { databasePool } from "../config/database.js";
import { searchKnowledgeForStudent } from "./knowledge-service.js";
import { getMaterialsByCourseForStudent } from "./material-service.js";
import { getStudentCourseIntelligence, getStudentIntelligence } from "./academic-intelligence-service.js";
import { getIntelligentRecommendations } from "./intelligent-recommendation-service.js";

const clean = value => typeof value === "string" ? value.trim() : "";

function createAnswer(knowledge, materials) {
  if (knowledge[0]) return `Según ${knowledge[0].source}, ${knowledge[0].content}`;
  if (materials[0]) return `No hay una entrada específica de conocimiento para esta pregunta. Puedes revisar el material autorizado: ${materials[0].title}.`;
  return "No hay material académico autorizado disponible para responder esta consulta.";
}

function contextualNotice(question, context) {
  const normalized = clean(question).toLocaleLowerCase("es-CL");
  if ((normalized.includes("mejor") || normalized.includes("tendencia")) && context?.trend?.status === "INSUFFICIENT_DATA") return "No hay historial temporal LMS suficiente para indicar una tendencia académica.";
  const action = context?.recommendedActions?.[0];
  if (action?.resource?.title) return `Basado en tu actividad actual del LMS: ${action.reason} Recurso autorizado sugerido: ${action.resource.title}.`;
  if (context?.signals?.some(item => item.code === "INSUFFICIENT_DATA")) return "No tengo suficiente actividad registrada en el LMS para generar una señal confiable de progreso todavía.";
  return "";
}

function publicContext(course, intelligence, recommendedActions) {
  if (!intelligence) return null;
  return { source: "LMS", course: course ? { id: course.id, name: course.name, code: course.code || null } : null, progress: course ? intelligence.courses?.[0]?.evidence || null : null, signals: intelligence.signals || [], strengths: intelligence.strengths || [], attentionAreas: intelligence.attentionAreas || [], studyNeeds: intelligence.studyNeeds || [], recommendedActions: recommendedActions || [], trend: intelligence.trend || { status: "INSUFFICIENT_DATA" } };
}

async function studentReference(studentId, query) {
  const result = await query(
    `SELECT id, external_id, role
       FROM users_reference
      WHERE id = $1
      LIMIT 1`,
    [studentId]
  );
  const student = result.rows[0];
  return student?.role === "STUDENT" && student.external_id ? { id: String(student.id), externalId: String(student.external_id) } : null;
}

function resultForAuthorization(result) {
  return { answered: false, code: result.code, answer: null, sources: [], topics: [], courseId: null, conversationId: null };
}

export async function askTutor(studentId, query, courseId, { databaseQuery = databasePool.query.bind(databasePool) } = {}) {
  const question = clean(query);
  if (!question) return { answered: false, code: "QUERY_REQUIRED", answer: null, sources: [], topics: [], courseId: null, conversationId: null };
  if (!clean(courseId)) {
    const intelligence = await getStudentIntelligence(studentId, { query: databaseQuery });
    if (!intelligence.authorized) return resultForAuthorization(intelligence);
    const decisions = await getIntelligentRecommendations(studentId, { query: databaseQuery });
    const context = publicContext(null, intelligence, decisions.authorized ? decisions.recommendations : []);
    const student = await studentReference(studentId, databaseQuery);
    if (!student) return { answered: false, code: "STUDENT_NOT_FOUND", answer: null, sources: [], topics: [], courseId: null, conversationId: null };
    const answer = contextualNotice(question, context) || "Puedo orientarte usando la actividad actualmente registrada en el LMS, pero no reemplazo las fuentes institucionales oficiales.";
    const saved = await databaseQuery(`INSERT INTO tutor_conversations (student_reference, question, response, sources) VALUES ($1, $2, $3, $4::jsonb) RETURNING id`, [student.externalId, question, answer, JSON.stringify([])]);
    return { answered: true, code: null, answer, sources: [], topics: [], intelligence: context, contextSummary: "Contexto académico LMS", courseId: null, conversationId: String(saved.rows[0]?.id || "") || null, source: "LMS" };
  }
  const knowledgeResult = await searchKnowledgeForStudent(studentId, question, courseId, { databaseQuery });
  if (!knowledgeResult.authorized) return resultForAuthorization(knowledgeResult);
  const materialsResult = await getMaterialsByCourseForStudent(studentId, courseId, { query: databaseQuery });
  if (!materialsResult.authorized) return resultForAuthorization(materialsResult);
  const student = await studentReference(studentId, databaseQuery);
  if (!student) return { answered: false, code: "STUDENT_NOT_FOUND", answer: null, sources: [], topics: [], courseId: null, conversationId: null };

  const sources = knowledgeResult.knowledge.map(item => ({ title: item.title, source: item.source, topic: item.topic })).slice(0, 3);
  const topics = [...new Set(sources.map(item => item.topic).filter(Boolean))];
  let answer = createAnswer(knowledgeResult.knowledge, materialsResult.materials);
  // El contexto es opcional: una falla de inteligencia no degrada la consulta
  // RAG ni convierte ausencia de datos en una afirmación del Tutor.
  let intelligence = null;
  try {
    const context = await getStudentCourseIntelligence(studentId, knowledgeResult.course.id, { query: databaseQuery });
    if (context.authorized) {
      const decisions = await getIntelligentRecommendations(studentId, { courseId: knowledgeResult.course.id, query: databaseQuery });
      intelligence = publicContext(knowledgeResult.course, context, decisions.authorized ? decisions.recommendations : []);
    }
  } catch { intelligence = null; }
  const contextual = contextualNotice(question, intelligence);
  if (contextual) answer = `${contextual} ${answer}`;
  const saved = await databaseQuery(
    `INSERT INTO tutor_conversations (student_reference, question, response, sources)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id`,
    [student.externalId, question, answer, JSON.stringify(sources)]
  );
  return {
    answered: true,
    code: null,
    answer,
    sources,
    topics,
    intelligence,
    courseId: knowledgeResult.course.id,
    conversationId: String(saved.rows[0]?.id || "") || null,
    contextSummary: intelligence ? "Contexto académico LMS" : null,
    source: intelligence?.source || "LMS"
  };
}

export async function getTutorHistory(studentId, { databaseQuery = databasePool.query.bind(databasePool) } = {}) {
  const student = await studentReference(studentId, databaseQuery);
  if (!student) return { authorized: false, code: "STUDENT_NOT_FOUND", history: [] };
  const result = await databaseQuery(
    `SELECT tc.id, tc.question, tc.response, tc.sources, tc.created_at
       FROM tutor_conversations tc
      WHERE tc.student_reference = $1
      ORDER BY tc.created_at DESC
      LIMIT 20`,
    [student.externalId]
  );
  const history = result.rows.filter(row => row?.id && row?.question && row?.response).map(row => ({
    id: String(row.id), question: String(row.question), answer: String(row.response),
    sources: Array.isArray(row.sources) ? row.sources.map(source => ({ ...source })) : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
  }));
  return { authorized: true, code: null, history };
}
