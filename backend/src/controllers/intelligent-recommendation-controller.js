import { getIntelligentRecommendations } from "../services/intelligent-recommendation-service.js";

const userId = request => request.get("x-user-id")?.trim() || "";
const statusFor = code => code === "COURSE_NOT_FOUND" || code === "STUDENT_NOT_FOUND" ? 404 : code === "COURSE_ACCESS_DENIED" || code === "STUDENT_ROLE_REQUIRED" ? 403 : 401;

function send(response, result) {
  if (!result.authorized) return response.status(statusFor(result.code)).json({ error: result.code, message: "Recomendaciones LMS no disponibles para este contexto." });
  const { authorized, ...body } = result;
  return response.status(200).json(body);
}

export async function intelligentRecommendations(request, response, next) {
  try {
    if (!userId(request)) return send(response, { authorized: false, code: "USER_CONTEXT_REQUIRED" });
    return send(response, await getIntelligentRecommendations(userId(request)));
  } catch (error) { return next(error); }
}

export async function intelligentCourseRecommendations(request, response, next) {
  try {
    if (!userId(request)) return send(response, { authorized: false, code: "USER_CONTEXT_REQUIRED" });
    return send(response, await getIntelligentRecommendations(userId(request), { courseId: request.params.courseId }));
  } catch (error) { return next(error); }
}
