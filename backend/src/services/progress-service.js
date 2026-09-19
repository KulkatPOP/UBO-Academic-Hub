import { databasePool } from "../config/database.js";
import { canUserAccessCourse, getCourseById, getCoursesForStudent } from "./course-service.js";
import { getPublicUserById } from "./user-service.js";

const SOURCE = "LMS";
const number = value => Number(value || 0);
const percent = (part, total) => total > 0 ? Number(((part / total) * 100).toFixed(2)) : null;

async function resolveStudent(userId, query) {
  const user = await getPublicUserById(userId, { query });
  return user?.role === "STUDENT" ? user : null;
}

async function courseProgress(student, course, query) {
  const materialsResult = await query("SELECT COUNT(*)::int AS count FROM learning_materials WHERE lms_course_id=$1", [course.id]);
  const materialsAvailable = number(materialsResult.rows[0]?.count);
  const materialEvents = await query(
    `SELECT COUNT(*)::int AS event_count, COUNT(DISTINCT payload->>'materialId')::int AS viewed_count
       FROM analytics_events WHERE student_reference=(SELECT external_id FROM users_reference WHERE id=$1)
       AND event_type='MATERIAL_VIEW' AND (payload->>'courseId'=$2 OR payload->>'courseId'=$3)`,
    [student.id, course.id, course.externalCourseId]
  );
  const materialEventCount = number(materialEvents.rows[0]?.event_count);
  const viewed = materialEventCount ? Math.min(materialsAvailable, number(materialEvents.rows[0]?.viewed_count)) : null;

  const evaluationsResult = await query("SELECT COUNT(*)::int AS count FROM lms_evaluations WHERE course_id=$1 AND status='PUBLISHED'", [course.id]);
  const published = number(evaluationsResult.rows[0]?.count);
  const submissionsResult = await query(
    `SELECT COUNT(*)::int AS count FROM lms_submissions submission INNER JOIN lms_evaluations evaluation ON evaluation.id=submission.evaluation_id
       WHERE evaluation.course_id=$1 AND evaluation.status='PUBLISHED' AND submission.student_reference=(SELECT external_id FROM users_reference WHERE id=$2)`,
    [course.id, student.id]
  );
  const submitted = Math.min(published, number(submissionsResult.rows[0]?.count));

  const sessionsResult = await query("SELECT COUNT(*)::int AS count FROM lms_attendance_sessions WHERE course_id=$1", [course.id]);
  const sessions = number(sessionsResult.rows[0]?.count);
  const attendanceResult = await query("SELECT COUNT(*)::int AS count FROM lms_attendance_records WHERE course_id=$1 AND student_reference=$2", [course.id, student.id]);
  const attended = Math.min(sessions, number(attendanceResult.rows[0]?.count));

  const activityResult = await query(
    `SELECT COUNT(*)::int AS count FROM analytics_events WHERE student_reference=(SELECT external_id FROM users_reference WHERE id=$1)
       AND event_type IN ('MATERIAL_VIEW','EVALUATION_VIEW','EVALUATION_SUBMISSION','TUTOR_QUERY','MESSAGE_READ','QR_ATTENDANCE')
       AND (payload->>'courseId'=$2 OR payload->>'courseId'=$3)`,
    [student.id, course.id, course.externalCourseId]
  );
  const events = number(activityResult.rows[0]?.count);
  return {
    courseId: course.id, courseName: course.name,
    materials: { available: materialsAvailable, viewed, percentageViewed: viewed === null ? null : percent(viewed, materialsAvailable), status: materialEventCount ? "AVAILABLE" : "INSUFFICIENT_DATA" },
    evaluations: { published, submitted, pending: published ? Math.max(0, published - submitted) : null, submissionRate: published ? percent(submitted, published) : null, status: published ? "AVAILABLE" : "INSUFFICIENT_DATA" },
    attendance: { sessions, attended: sessions ? attended : null, attendanceRate: sessions ? percent(attended, sessions) : null, status: sessions ? "AVAILABLE" : "INSUFFICIENT_DATA" },
    activity: { events: events || null, status: events ? "AVAILABLE" : "INSUFFICIENT_DATA" }
  };
}

export async function getStudentProgress(userId, { query = databasePool.query.bind(databasePool) } = {}) {
  const student = await resolveStudent(userId, query);
  if (!student) return { authorized: false, code: "STUDENT_ROLE_REQUIRED", courses: [] };
  const courses = await getCoursesForStudent(student.id, { query });
  return { authorized: true, source: SOURCE, studentId: student.id, courses: await Promise.all(courses.map(course => courseProgress(student, course, query))), overall: null };
}

export async function getStudentCourseProgress(userId, courseId, { query = databasePool.query.bind(databasePool) } = {}) {
  const student = await resolveStudent(userId, query);
  if (!student) return { authorized: false, code: "STUDENT_ROLE_REQUIRED", course: null };
  const course = await getCourseById(courseId, { query });
  if (!course) return { authorized: false, code: "COURSE_NOT_FOUND", course: null };
  if (!await canUserAccessCourse(student, course, { query })) return { authorized: false, code: "COURSE_ACCESS_DENIED", course: null };
  return { authorized: true, source: SOURCE, studentId: student.id, course: await courseProgress(student, course, query), overall: null };
}
