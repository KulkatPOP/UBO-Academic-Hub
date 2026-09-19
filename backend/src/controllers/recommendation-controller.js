import { generateRecommendations as generateForStudent, getRecommendations as getForStudent } from "../services/recommendation-service.js";

function userIdFromRequest(request) {
  const value = request.get("x-user-id");
  return typeof value === "string" ? value.trim() : "";
}

function statusFor(code) {
  if (code === "STUDENT_NOT_FOUND") return 404;
  if (code === "STUDENT_ROLE_REQUIRED") return 403;
  return 400;
}

function messageFor(code) {
  return ({
    USER_CONTEXT_REQUIRED: "Se requiere contexto de usuario.",
    STUDENT_NOT_FOUND: "Estudiante no encontrado.",
    STUDENT_ROLE_REQUIRED: "Las recomendaciones están disponibles sólo para estudiantes."
  })[code] || "No fue posible obtener recomendaciones.";
}

export async function listRecommendations(request, response, next) {
  try {
    const studentId = userIdFromRequest(request);
    if (!studentId) {
      response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: messageFor("USER_CONTEXT_REQUIRED") });
      return;
    }
    const result = await getForStudent(studentId);
    if (!result.authorized) {
      response.status(statusFor(result.code)).json({ error: result.code, message: messageFor(result.code) });
      return;
    }
    response.status(200).json({ recommendations: result.recommendations });
  } catch (error) {
    next(error);
  }
}

export async function generateRecommendations(request, response, next) {
  try {
    const studentId = userIdFromRequest(request);
    if (!studentId) {
      response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: messageFor("USER_CONTEXT_REQUIRED") });
      return;
    }
    const result = await generateForStudent(studentId);
    if (!result.authorized) {
      response.status(statusFor(result.code)).json({ error: result.code, message: messageFor(result.code) });
      return;
    }
    response.status(200).json({ generated: result.generated, dataSufficient: result.dataSufficient, recommendations: result.recommendations, warnings: result.warnings });
  } catch (error) {
    next(error);
  }
}
