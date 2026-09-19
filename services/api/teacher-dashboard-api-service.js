import { getCourseMaterials } from "./material-api-service.js";
import { getCourseStudents, getCourses } from "./course-api-service.js";
import { getEvaluations } from "./evaluation-api-service.js";
import { getMessages } from "./message-api-service.js";
import { getCourseAttendance } from "./qr-attendance-api-service.js";
import { getTeacherAnalytics, getTeacherCourseAnalytics } from "./analytics-api-service.js";

const clone = value => value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
const list = value => Array.isArray(value) ? value : [];
const byCourse = (items, courseId) => list(items).filter(item => item?.courseId === courseId);
const controlled = async operation => {
  try {
    return await operation();
  } catch {
    return { available: false, source: "client" };
  }
};

/**
 * Composición de lectura para Teacher. No transmite role, teacherId ni
 * password: cada cliente entrega solamente el x-user-id de la sesión.
 */
export async function getTeacherDashboard({
  getCoursesImpl = getCourses,
  getCourseStudentsImpl = getCourseStudents,
  getCourseMaterialsImpl = getCourseMaterials,
  getEvaluationsImpl = getEvaluations,
  getMessagesImpl = getMessages,
  getCourseAttendanceImpl = getCourseAttendance,
  getTeacherAnalyticsImpl = getTeacherAnalytics,
  getTeacherCourseAnalyticsImpl = getTeacherCourseAnalytics,
  options = {}
} = {}) {
  const coursesResult = await controlled(() => getCoursesImpl(options.courseOptions));
  if (!coursesResult.available) return { available: false, source: coursesResult.source || "demo-fallback", courses: [], partial: false };
  const courses = list(coursesResult.courses);
  const [evaluationsResult, messagesResult, analyticsResult] = await Promise.all([
    controlled(() => getEvaluationsImpl(options.evaluationOptions)),
    controlled(() => getMessagesImpl(options.messageOptions)),
    controlled(() => getTeacherAnalyticsImpl(options.analyticsOptions))
  ]);
  const records = await Promise.all(courses.map(async course => {
    const [studentsResult, materialsResult, attendanceResult, courseAnalyticsResult] = await Promise.all([
      controlled(() => getCourseStudentsImpl(course.id, options.studentOptions)),
      controlled(() => getCourseMaterialsImpl(course.id, options.materialOptions)),
      controlled(() => getCourseAttendanceImpl(course.id, options.attendanceOptions)),
      controlled(() => getTeacherCourseAnalyticsImpl(course.id, options.analyticsOptions))
    ]);
    return {
      ...clone(course),
      students: studentsResult.available ? clone(studentsResult.students) : null,
      materials: materialsResult.available ? clone(materialsResult.materials) : null,
      attendance: attendanceResult.available ? clone(list(attendanceResult.body?.records)) : null,
      evaluations: evaluationsResult.available ? clone(byCourse(evaluationsResult.evaluations, course.id)) : null,
      messages: messagesResult.available ? clone(byCourse(messagesResult.messages, course.id)) : null,
      analytics: courseAnalyticsResult.available ? clone(courseAnalyticsResult.body) : null,
      sections: {
        students: studentsResult.available ? "LMS" : "UNAVAILABLE",
        materials: materialsResult.available ? "LMS" : "UNAVAILABLE",
        attendance: attendanceResult.available ? "LMS" : "UNAVAILABLE",
        evaluations: evaluationsResult.available ? "LMS" : "UNAVAILABLE",
        messages: messagesResult.available ? "LMS" : "UNAVAILABLE",
        analytics: courseAnalyticsResult.available ? "LMS" : "UNAVAILABLE"
      }
    };
  }));
  const partial = !evaluationsResult.available || !messagesResult.available || !analyticsResult.available || records.some(course => Object.values(course.sections).some(value => value !== "LMS"));
  return { available: true, source: "LMS", partial, courses: records, analytics: analyticsResult.available ? clone(analyticsResult.body) : null };
}
