import { databasePool } from "../config/database.js";
import { canUserAccessCourse, getCourseById } from "./course-service.js";
import { getPublicUserById } from "./user-service.js";
import { resolveCourseIdentity } from "./course-identity-service.js";

function normalizeId(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function toMaterial(row) {
  if (!row?.id || !row?.course_id || !row?.title || !row?.external_course_id) return null;
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    externalCourseId: String(row.external_course_id),
    title: String(row.title),
    content: String(row.content || ""),
    topic: row.topic ? String(row.topic) : null,
    keywords: Array.isArray(row.keywords) ? [...row.keywords] : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
  };
}

const materialColumns = `m.id, m.lms_course_id AS course_id, c.external_course_id,
  m.title, m.content, m.topic, m.keywords, m.created_at`;

export async function getMaterialsByCourse(courseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedCourseId = normalizeId(courseId);
  if (!normalizedCourseId) return [];
  const result = await query(
    `SELECT ${materialColumns}
       FROM learning_materials m
       INNER JOIN lms_courses c ON c.id = m.lms_course_id
      WHERE c.id::text = $1 OR c.external_course_id = $1
      ORDER BY m.created_at ASC, m.title ASC`,
    [normalizedCourseId]
  );
  return result.rows.map(toMaterial).filter(Boolean);
}

export async function getMaterialById(materialId, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedMaterialId = normalizeId(materialId);
  if (!normalizedMaterialId) return null;
  const result = await query(
    `SELECT ${materialColumns}
       FROM learning_materials m
       INNER JOIN lms_courses c ON c.id = m.lms_course_id
      WHERE m.id::text = $1
      LIMIT 1`,
    [normalizedMaterialId]
  );
  return toMaterial(result.rows[0]);
}

/** Recuperación autorizada para Student; no sustituye las consultas docentes/Admin existentes. */
export async function getMaterialsByCourseForStudent(studentId, courseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const student = await getPublicUserById(studentId, { query });
  if (!student) return { authorized: false, code: "STUDENT_NOT_FOUND", course: null, materials: [] };
  if (student.role !== "STUDENT") return { authorized: false, code: "STUDENT_ROLE_REQUIRED", course: null, materials: [] };
  const identity = await resolveCourseIdentity(courseId, { query });
  const course = identity ? await getCourseById(identity.lmsCourseId, { query }) : null;
  if (!course) return { authorized: false, code: "COURSE_NOT_FOUND", course: null, materials: [] };
  if (!await canUserAccessCourse(student, course, { query })) return { authorized: false, code: "COURSE_ACCESS_DENIED", course: null, materials: [] };
  return { authorized: true, code: null, course, materials: await getMaterialsByCourse(course.id, { query }) };
}
