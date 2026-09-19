import { resolveCourseIdentity } from "../services/course-identity-service.js";

export async function resolve(request, response, next) {
  try {
    const identifier = typeof request.query.identifier === "string" ? request.query.identifier.trim() : "";
    if (!identifier) {
      response.status(400).json({ error: "IDENTIFIER_REQUIRED", message: "Se requiere un identificador de curso." });
      return;
    }

    // `type` es sólo una pista de UI: no se confía en él para decidir la
    // identidad. El resolvedor cruza todos los espacios y rechaza ambigüedad.
    const course = await resolveCourseIdentity(identifier);
    if (!course) {
      response.status(404).json({ error: "COURSE_IDENTITY_NOT_FOUND", message: "No se encontró una identidad de curso no ambigua." });
      return;
    }
    response.status(200).json({ course });
  } catch (error) {
    next(error);
  }
}
