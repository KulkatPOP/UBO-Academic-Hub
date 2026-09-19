import { getStudentCourseIntelligence, getStudentIntelligence } from "../services/academic-intelligence-service.js";

const userId = request => request.get("x-user-id")?.trim() || "";
const statusFor = code => code === "USER_NOT_FOUND" || code === "STUDENT_NOT_FOUND" || code === "COURSE_NOT_FOUND" ? 404 : code === "COURSE_ACCESS_DENIED" || code === "STUDENT_ROLE_REQUIRED" ? 403 : 401;
const messageFor = code => ({ USER_CONTEXT_REQUIRED: "Se requiere contexto de usuario.", USER_NOT_FOUND: "Usuario no encontrado.", STUDENT_NOT_FOUND: "Estudiante no encontrado.", STUDENT_ROLE_REQUIRED: "La inteligencia LMS está disponible sólo para estudiantes.", COURSE_NOT_FOUND: "Curso no encontrado.", COURSE_ACCESS_DENIED: "No tienes acceso a este curso." })[code] || "Inteligencia académica LMS no disponible.";

function send(response, result) {
  if (!result.authorized) return response.status(statusFor(result.code)).json({ error: result.code, message: messageFor(result.code) });
  const { authorized, ...body } = result;
  return response.status(200).json(body);
}

export async function student(request, response, next) {
  try { if (!userId(request)) return send(response, { authorized: false, code: "USER_CONTEXT_REQUIRED" }); return send(response, await getStudentIntelligence(userId(request))); }
  catch (error) { return next(error); }
}

export async function studentCourse(request, response, next) {
  try { if (!userId(request)) return send(response, { authorized: false, code: "USER_CONTEXT_REQUIRED" }); return send(response, await getStudentCourseIntelligence(userId(request), request.params.courseId)); }
  catch (error) { return next(error); }
}
