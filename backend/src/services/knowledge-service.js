import { databasePool } from "../config/database.js";
import { canUserAccessCourse, getCourseById } from "./course-service.js";
import { getPublicUserById } from "./user-service.js";
import { resolveCourseIdentity } from "./course-identity-service.js";

const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const clean = value => typeof value === "string" ? value.trim() : "";
const stopWords = new Set(["como", "para", "sobre", "quiero", "necesito", "puedo", "puedes", "explica", "explicame", "que", "una", "uno", "los", "las", "del", "con", "por", "esta", "este", "es"]);

function tokensFor(value) {
  return [...new Set(normalize(value).split(/[^a-z0-9]+/).filter(token => token.length > 1 && !stopWords.has(token)))];
}

function toKnowledge(row, searchQuery = "") {
  if (!row?.id || !row?.title || !row?.content || !row?.material_title) return null;
  const tokens = tokensFor(searchQuery);
  const title = normalize(row.title), topic = normalize(row.topic), content = normalize(row.content);
  const keywords = Array.isArray(row.keywords) ? row.keywords.map(normalize) : [];
  const relevance = tokens.reduce((score, token) => score
    + (title.includes(token) ? 4 : 0)
    + (topic.includes(token) ? 4 : 0)
    + (keywords.some(keyword => keyword.includes(token)) ? 3 : 0)
    + (content.includes(token) ? 1 : 0), 0);
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    topic: row.topic ? String(row.topic) : null,
    keywords: Array.isArray(row.keywords) ? [...row.keywords] : [],
    source: String(row.material_title),
    relevance
  };
}

async function authorizeStudentCourse(studentId, courseId, query) {
  const student = await getPublicUserById(studentId, { query });
  if (!student) return { allowed: false, code: "STUDENT_NOT_FOUND", course: null };
  if (student.role !== "STUDENT") return { allowed: false, code: "STUDENT_ROLE_REQUIRED", course: null };
  const identity = await resolveCourseIdentity(courseId, { query });
  const course = identity ? await getCourseById(identity.lmsCourseId, { query }) : null;
  if (!course) return { allowed: false, code: "COURSE_NOT_FOUND", course: null };
  if (!await canUserAccessCourse(student, course, { query })) return { allowed: false, code: "COURSE_ACCESS_DENIED", course: null };
  return { allowed: true, code: null, course, student };
}

async function readKnowledge(courseId, searchQuery, query) {
  const result = await query(
    `SELECT kb.id, kb.title, kb.content, kb.topic, kb.keywords, lm.title AS material_title
       FROM knowledge_base kb
       INNER JOIN learning_materials lm ON lm.id = kb.material_id
      WHERE lm.lms_course_id = $1
      ORDER BY kb.title ASC`,
    [courseId]
  );
  const hasSearch = Boolean(clean(searchQuery));
  return result.rows.map(row => toKnowledge(row, searchQuery)).filter(Boolean)
    .filter(item => !hasSearch || item.relevance > 0)
    .sort((left, right) => right.relevance - left.relevance || left.title.localeCompare(right.title, "es"));
}

export async function searchKnowledgeForStudent(studentId, query, courseId, { databaseQuery = databasePool.query.bind(databasePool) } = {}) {
  const authorization = await authorizeStudentCourse(studentId, courseId, databaseQuery);
  if (!authorization.allowed) return { authorized: false, code: authorization.code, course: null, knowledge: [] };
  if (!clean(query)) return { authorized: true, code: null, course: authorization.course, knowledge: [] };
  return { authorized: true, code: null, course: authorization.course, knowledge: await readKnowledge(authorization.course.id, query, databaseQuery) };
}

export async function getKnowledgeByCourse(studentId, courseId, { databaseQuery = databasePool.query.bind(databasePool) } = {}) {
  const authorization = await authorizeStudentCourse(studentId, courseId, databaseQuery);
  if (!authorization.allowed) return { authorized: false, code: authorization.code, course: null, knowledge: [] };
  return { authorized: true, code: null, course: authorization.course, knowledge: await readKnowledge(authorization.course.id, "", databaseQuery) };
}
