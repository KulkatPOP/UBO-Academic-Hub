import { canUserAccessCourse, getCourseById } from "../services/course-service.js";
import { getMaterialById, getMaterialsByCourse } from "../services/material-service.js";
import { getPublicUserById } from "../services/user-service.js";

function userIdFromRequest(request) {
  const value = request.get("x-user-id");
  return typeof value === "string" ? value.trim() : "";
}

async function requestUser(request) {
  const userId = userIdFromRequest(request);
  return userId ? getPublicUserById(userId) : null;
}

function sendContextRequired(response) {
  response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: "Se requiere contexto de usuario." });
}

async function resolveAccessibleCourse(request, response, courseId) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    sendContextRequired(response);
    return null;
  }
  const user = await requestUser(request);
  if (!user) {
    response.status(404).json({ error: "USER_NOT_FOUND", message: "Usuario no encontrado." });
    return null;
  }
  const course = await getCourseById(courseId);
  if (!course) {
    response.status(404).json({ error: "COURSE_NOT_FOUND", message: "Curso no encontrado." });
    return null;
  }
  if (!await canUserAccessCourse(user, course)) {
    response.status(403).json({ error: "COURSE_ACCESS_DENIED", message: "No tienes acceso al material de este curso." });
    return null;
  }
  return course;
}

export async function listMaterialsByCourse(request, response, next) {
  try {
    const course = await resolveAccessibleCourse(request, response, request.params.courseId);
    if (!course) return;
    response.status(200).json({ materials: await getMaterialsByCourse(course.id) });
  } catch (error) {
    next(error);
  }
}

export async function getMaterial(request, response, next) {
  try {
    const material = await getMaterialById(request.params.id);
    if (!material) {
      response.status(404).json({ error: "MATERIAL_NOT_FOUND", message: "Material no encontrado." });
      return;
    }
    const course = await resolveAccessibleCourse(request, response, material.courseId);
    if (!course) return;
    response.status(200).json({ material });
  } catch (error) {
    next(error);
  }
}
