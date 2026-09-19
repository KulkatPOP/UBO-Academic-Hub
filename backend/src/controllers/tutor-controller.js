import { askTutor, getTutorHistory } from "../services/tutor-service.js";

function userIdFromRequest(request) {
  const value = request.get("x-user-id");
  return typeof value === "string" ? value.trim() : "";
}

function statusFor(code) {
  if (code === "QUERY_REQUIRED") return 400;
  if (code === "STUDENT_NOT_FOUND") return 404;
  if (code === "STUDENT_ROLE_REQUIRED" || code === "COURSE_ACCESS_DENIED") return 403;
  if (code === "COURSE_NOT_FOUND") return 404;
  return 400;
}

function messageFor(code) {
  return ({
    USER_CONTEXT_REQUIRED: "Se requiere contexto de usuario.",
    QUERY_REQUIRED: "Escribe una pregunta para consultar al tutor.",
    STUDENT_NOT_FOUND: "Estudiante no encontrado.",
    STUDENT_ROLE_REQUIRED: "El Tutor está disponible sólo para estudiantes.",
    COURSE_NOT_FOUND: "Curso no encontrado.",
    COURSE_ACCESS_DENIED: "No tienes acceso a este curso."
  })[code] || "No fue posible procesar la consulta del tutor.";
}

export async function ask(request, response, next) {
  try {
    const studentId = userIdFromRequest(request);
    if (!studentId) {
      response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: messageFor("USER_CONTEXT_REQUIRED") });
      return;
    }
    const courseIdentifier = typeof request.body?.courseId === "string" && request.body.courseId.trim()
      ? request.body.courseId
      : request.body?.legacyCourseId;
    const result = await askTutor(studentId, request.body?.query, courseIdentifier);
    if (!result.answered) {
      response.status(statusFor(result.code)).json({ error: result.code, message: messageFor(result.code) });
      return;
    }
    response.status(200).json({
      answer: result.answer,
      sources: result.sources,
      topics: result.topics,
      intelligence: result.intelligence,
      context: result.intelligence,
      contextSummary: result.contextSummary,
      source: result.source || "LMS",
      courseId: result.courseId,
      conversationId: result.conversationId
    });
  } catch (error) {
    next(error);
  }
}

export async function history(request, response, next) {
  try {
    const studentId = userIdFromRequest(request);
    if (!studentId) {
      response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: messageFor("USER_CONTEXT_REQUIRED") });
      return;
    }
    const result = await getTutorHistory(studentId);
    if (!result.authorized) {
      response.status(statusFor(result.code)).json({ error: result.code, message: messageFor(result.code) });
      return;
    }
    response.status(200).json({ history: result.history });
  } catch (error) {
    next(error);
  }
}
