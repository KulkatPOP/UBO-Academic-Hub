import { databasePool } from "../config/database.js";

function normalizeId(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function toCourse(row) {
  if (!row?.id || !row?.external_course_id || !row?.name || !row?.code || !row?.teacher_reference) return null;
  return {
    id: String(row.id),
    externalCourseId: String(row.external_course_id),
    name: String(row.name),
    code: String(row.code),
    teacherReference: String(row.teacher_reference),
    description: String(row.description || "")
  };
}

function toPublicMember(row) {
  if (!row?.id || !row?.name || !row?.role) return null;
  return { id: String(row.id), name: String(row.name), role: String(row.role) };
}

const courseColumns = `id, external_course_id, name, code, teacher_reference, description`;

export async function getCourseById(courseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedCourseId = normalizeId(courseId);
  if (!normalizedCourseId) return null;
  const result = await query(
    `SELECT ${courseColumns}
       FROM lms_courses
      WHERE id::text = $1 OR external_course_id = $1
      LIMIT 1`,
    [normalizedCourseId]
  );
  return toCourse(result.rows[0]);
}

export async function getCoursesForStudent(studentId, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedStudentId = normalizeId(studentId);
  if (!normalizedStudentId) return [];
  const result = await query(
    `SELECT c.${courseColumns}
       FROM lms_courses c
       INNER JOIN lms_course_members m ON m.course_id = c.id
      WHERE m.student_reference = $1
      ORDER BY c.name ASC`,
    [normalizedStudentId]
  );
  return result.rows.map(toCourse).filter(Boolean);
}

export async function getCoursesForTeacher(teacherId, { query = databasePool.query.bind(databasePool) } = {}) {
  const normalizedTeacherId = normalizeId(teacherId);
  if (!normalizedTeacherId) return [];
  const result = await query(
    `SELECT ${courseColumns}
       FROM lms_courses
      WHERE teacher_reference = $1
      ORDER BY name ASC`,
    [normalizedTeacherId]
  );
  return result.rows.map(toCourse).filter(Boolean);
}

export async function getAllCourses({ query = databasePool.query.bind(databasePool) } = {}) {
  const result = await query(`SELECT ${courseColumns} FROM lms_courses ORDER BY name ASC`);
  return result.rows.map(toCourse).filter(Boolean);
}

export async function getCourseMembers(courseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const course = await getCourseById(courseId, { query });
  if (!course) return [];
  const result = await query(
    `SELECT u.id, u.name, u.role
       FROM lms_course_members m
       INNER JOIN users_reference u ON u.id = m.student_reference
      WHERE m.course_id = $1
      ORDER BY u.name ASC`,
    [course.id]
  );
  return result.rows.map(toPublicMember).filter(Boolean);
}

export async function canUserAccessCourse(user, course, { query = databasePool.query.bind(databasePool) } = {}) {
  if (!user?.id || !user?.role || !course?.id) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "TEACHER") return course.teacherReference === String(user.id);
  if (user.role !== "STUDENT") return false;
  const courses = await getCoursesForStudent(user.id, { query });
  return courses.some(item => item.id === course.id);
}
