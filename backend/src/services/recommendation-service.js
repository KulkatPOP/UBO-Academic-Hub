import { databasePool } from "../config/database.js";
import { getCoursesForStudent } from "./course-service.js";
import { getMaterialsByCourse } from "./material-service.js";
import { getPublicUserById } from "./user-service.js";

const clean = value => typeof value === "string" ? value.trim() : "";

function toRecommendation(row) {
  if (!row?.id || !row?.title || !row?.description || !row?.type) return null;
  return {
    id: String(row.id),
    courseId: row.course_id ? String(row.course_id) : null,
    courseName: row.course_name ? String(row.course_name) : null,
    type: String(row.type),
    title: String(row.title),
    description: String(row.description),
    priority: row.priority ? String(row.priority) : null,
    reason: row.reason ? String(row.reason) : null,
    resourceReference: row.resource_reference ? String(row.resource_reference) : null,
    resourceTitle: row.resource_title ? String(row.resource_title) : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null
  };
}

async function authorizeStudent(studentId, query) {
  const student = await getPublicUserById(studentId, { query });
  if (!student) return { authorized: false, code: "STUDENT_NOT_FOUND", student: null };
  if (student.role !== "STUDENT") return { authorized: false, code: "STUDENT_ROLE_REQUIRED", student: null };
  const external = await query(
    `SELECT external_id
       FROM users_reference
      WHERE id = $1 AND role = 'STUDENT'
      LIMIT 1`,
    [student.id]
  );
  const externalId = clean(external.rows[0]?.external_id);
  return externalId
    ? { authorized: true, code: null, student: { ...student, externalId } }
    : { authorized: false, code: "STUDENT_NOT_FOUND", student: null };
}

const persistedColumns = `r.id, r.course_id, c.name AS course_name, r.type, r.title, r.description,
  r.priority, r.reason, r.resource_reference, m.title AS resource_title, r.created_at, r.expires_at`;

async function readPersisted(studentExternalId, recommendationId, query) {
  const condition = recommendationId ? "AND r.id::text = $2" : "";
  const values = recommendationId ? [studentExternalId, recommendationId] : [studentExternalId];
  const result = await query(
    `SELECT ${persistedColumns}
       FROM recommendations r
       LEFT JOIN lms_courses c ON c.id = r.course_id
       LEFT JOIN learning_materials m ON m.id = r.resource_reference
      WHERE r.student_reference = $1 ${condition}
      ORDER BY r.created_at DESC`,
    values
  );
  return result.rows.map(toRecommendation).filter(Boolean);
}

/** Devuelve sólo recomendaciones persistidas del estudiante autenticado. */
export async function getRecommendations(studentId, { query = databasePool.query.bind(databasePool) } = {}) {
  const authorization = await authorizeStudent(studentId, query);
  if (!authorization.authorized) return { authorized: false, code: authorization.code, recommendations: [] };
  return { authorized: true, code: null, recommendations: await readPersisted(authorization.student.externalId, null, query) };
}

/** Obtiene una recomendación únicamente dentro del historial propio del estudiante. */
export async function getRecommendationById(studentId, recommendationId, { query = databasePool.query.bind(databasePool) } = {}) {
  const authorization = await authorizeStudent(studentId, query);
  if (!authorization.authorized) return { authorized: false, code: authorization.code, recommendation: null };
  const id = clean(recommendationId);
  if (!id) return { authorized: true, code: null, recommendation: null };
  const [recommendation] = await readPersisted(authorization.student.externalId, id, query);
  return { authorized: true, code: null, recommendation: recommendation || null };
}

/**
 * Genera sólo sugerencias respaldadas por recursos LMS realmente disponibles.
 * Métricas de rendimiento no presentes en PostgreSQL permanecen fuera de esta
 * capa para no convertir ausencia de datos en riesgo o bajo desempeño.
 */
export async function generateRecommendations(studentId, { query = databasePool.query.bind(databasePool) } = {}) {
  const authorization = await authorizeStudent(studentId, query);
  if (!authorization.authorized) return { authorized: false, code: authorization.code, generated: false, dataSufficient: false, recommendations: [], warnings: [] };

  const courses = await getCoursesForStudent(authorization.student.id, { query });
  if (!courses.length) {
    return { authorized: true, code: "NO_LMS_COURSES", generated: false, dataSufficient: false, recommendations: [], warnings: ["No hay cursos LMS DEMO autorizados para generar recomendaciones."] };
  }

  const generated = [];
  const warnings = [];
  for (const course of courses) {
    const [resource] = await getMaterialsByCourse(course.id, { query });
    if (!resource) {
      warnings.push(`No hay material LMS disponible para ${course.name}.`);
      continue;
    }
    const title = `Revisar recurso disponible de ${course.name}`;
    const description = `Tienes disponible el recurso LMS “${resource.title}”. Úsalo para planificar una revisión preventiva del curso.`;
    const reason = "Recomendación derivada únicamente de un recurso LMS disponible; no infiere rendimiento académico.";
    const saved = await query(
      `INSERT INTO recommendations (student_reference, course_id, type, title, description, priority, reason, resource_reference)
       VALUES ($1, $2, 'AVAILABLE_RESOURCE', $3, $4, 'LOW', $5, $6)
       ON CONFLICT (student_reference, course_id, type, resource_reference)
       WHERE course_id IS NOT NULL AND resource_reference IS NOT NULL
       DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description,
                     priority = EXCLUDED.priority, reason = EXCLUDED.reason, created_at = NOW()
       RETURNING id, course_id, type, title, description, priority, reason, resource_reference, created_at, expires_at`,
      [authorization.student.externalId, course.id, title, description, reason, resource.id]
    );
    const row = saved.rows[0];
    const recommendation = toRecommendation({ ...row, course_name: course.name, resource_title: resource.title });
    if (recommendation) generated.push(recommendation);
  }
  return {
    authorized: true,
    code: generated.length ? null : "INSUFFICIENT_LMS_DATA",
    generated: generated.length > 0,
    dataSufficient: generated.length > 0,
    recommendations: generated,
    warnings
  };
}
