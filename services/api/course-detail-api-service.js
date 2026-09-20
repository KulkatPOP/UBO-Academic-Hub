import { getCourse } from "./course-api-service.js";
import { resolveCourseByLegacyIdResult } from "./course-identity-api-service.js";
import { getEvaluations } from "./evaluation-api-service.js";
import { getCourseMaterials } from "./material-api-service.js";
import { getMessages } from "./message-api-service.js";
import { getStudentCourseProgress } from "./progress-api-service.js";
import { getStudentAttendance } from "./qr-attendance-api-service.js";
import { getIntelligentRecommendations } from "./recommendation-api-service.js";

const clone = value => value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
const list = value => Array.isArray(value) ? value : [];
const byCourse = (items, courseId) => list(items).filter(item => item?.courseId === courseId);

/**
 * Compone el detalle LMS con clientes existentes. Cada cliente continúa
 * enviando exclusivamente x-user-id y el backend conserva la autorización.
 * No crea una métrica overall ni transforma ausencia de evidencia en cero.
 */
export async function getStudentCourseDetail(legacyCourseId, {
  resolveLegacyCourse = resolveCourseByLegacyIdResult,
  getCourseImpl = getCourse,
  getCourseMaterialsImpl = getCourseMaterials,
  getEvaluationsImpl = getEvaluations,
  getStudentCourseProgressImpl = getStudentCourseProgress,
  getStudentAttendanceImpl = getStudentAttendance,
  getIntelligentRecommendationsImpl = getIntelligentRecommendations,
  // Compatibilidad de pruebas/adaptadores anteriores: si se inyecta, conserva
  // el filtrado histórico sin cambiar su contrato. La aplicación usa siempre
  // la decisión inteligente del LMS por curso.
  getRecommendationsImpl = null,
  getMessagesImpl = getMessages,
  options = {}
} = {}) {
  const legacyId = typeof legacyCourseId === "string" ? legacyCourseId.trim() : "";
  if (!legacyId) return { available: false, source: "demo-fallback", reason: "IDENTIFIER_REQUIRED", partial: false };

  const identityResult = await resolveLegacyCourse(legacyId, options.identityOptions);
  // Los adaptadores de prueba y consumidores históricos pueden devolver la
  // identidad directamente; la aplicación usa el resultado enriquecido.
  const identity = identityResult?.identity || identityResult;
  if (!identity?.lmsCourseId) {
    return {
      available: false,
      source: identityResult?.source || "demo-fallback",
      status: identityResult?.status ?? null,
      reason: identityResult?.reason || "IDENTITY_UNRESOLVED",
      partial: false
    };
  }

  const courseResult = await getCourseImpl(identity.lmsCourseId, options.courseOptions);
  if (!courseResult.available || !courseResult.course?.id) {
    return { available: false, source: courseResult.source || "demo-fallback", reason: "COURSE_UNAVAILABLE", partial: false, identity: clone(identity) };
  }

  const courseId = courseResult.course.id;
  const [materialsResult, evaluationsResult, progressResult, attendanceResult, recommendationsResult, messagesResult] = await Promise.all([
    getCourseMaterialsImpl(courseId, options.materialOptions),
    getEvaluationsImpl(options.evaluationOptions),
    getStudentCourseProgressImpl(courseId, options.progressOptions),
    getStudentAttendanceImpl(courseId, options.attendanceOptions),
    getRecommendationsImpl
      ? getRecommendationsImpl(options.recommendationOptions)
      : getIntelligentRecommendationsImpl({ ...options.recommendationOptions, courseId }),
    getMessagesImpl(options.messageOptions)
  ]);

  const sections = {
    materials: materialsResult.available ? "LMS" : "UNAVAILABLE",
    evaluations: evaluationsResult.available ? "LMS" : "UNAVAILABLE",
    progress: progressResult.available ? "LMS" : "UNAVAILABLE",
    attendance: attendanceResult.available ? "LMS" : "UNAVAILABLE",
    recommendations: recommendationsResult.available ? "LMS" : "UNAVAILABLE",
    messages: messagesResult.available ? "LMS" : "UNAVAILABLE"
  };

  return {
    available: true,
    source: "LMS",
    partial: Object.values(sections).some(value => value !== "LMS"),
    identity: clone(identity),
    course: clone(courseResult.course),
    materials: materialsResult.available ? clone(materialsResult.materials) : null,
    evaluations: evaluationsResult.available ? clone(byCourse(evaluationsResult.evaluations, courseId)) : null,
    progress: progressResult.available ? clone(progressResult.progress?.course || null) : null,
    attendance: attendanceResult.available ? clone(list(attendanceResult.body?.records)) : null,
    recommendations: recommendationsResult.available
      ? clone(getRecommendationsImpl ? byCourse(recommendationsResult.recommendations, courseId) : list(recommendationsResult.recommendations))
      : null,
    messages: messagesResult.available ? clone(byCourse(messagesResult.messages, courseId)) : null,
    sections
  };
}
