import { getPublicUserById } from "../services/user-service.js";
import { canUserAccessCourse, getAllCourses, getCourseById, getCourseMembers, getCoursesForStudent, getCoursesForTeacher } from "../services/course-service.js";

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

function sendUserNotFound(response) {
  response.status(404).json({ error: "USER_NOT_FOUND", message: "Usuario no encontrado." });
}

export async function listCourses(request, response, next) {
  try {
    const userId = userIdFromRequest(request);
    if (!userId) return sendContextRequired(response);
    const user = await requestUser(request);
    if (!user) return sendUserNotFound(response);

    const courses = user.role === "STUDENT"
      ? await getCoursesForStudent(user.id)
      : user.role === "TEACHER"
        ? await getCoursesForTeacher(user.id)
        : user.role === "ADMIN"
          ? await getAllCourses()
          : [];
    response.status(200).json({ courses });
  } catch (error) {
    next(error);
  }
}

export async function getCourse(request, response, next) {
  try {
    const userId = userIdFromRequest(request);
    if (!userId) return sendContextRequired(response);
    const user = await requestUser(request);
    if (!user) return sendUserNotFound(response);
    const course = await getCourseById(request.params.id);
    if (!course) {
      response.status(404).json({ error: "COURSE_NOT_FOUND", message: "Curso no encontrado." });
      return;
    }
    if (!await canUserAccessCourse(user, course)) {
      response.status(403).json({ error: "COURSE_ACCESS_DENIED", message: "No tienes acceso a este curso." });
      return;
    }
    response.status(200).json({ course });
  } catch (error) {
    next(error);
  }
}

/** Lista pública mínima, únicamente para el profesor propietario del curso LMS. */
export async function listCourseStudents(request, response, next) {
  try {
    const userId = userIdFromRequest(request);
    if (!userId) return sendContextRequired(response);
    const user = await requestUser(request);
    if (!user) return sendUserNotFound(response);
    if (user.role !== "TEACHER") {
      response.status(403).json({ error: "TEACHER_ROLE_REQUIRED", message: "Esta lista es exclusiva del docente responsable." });
      return;
    }
    const course = await getCourseById(request.params.id);
    if (!course) {
      response.status(404).json({ error: "COURSE_NOT_FOUND", message: "Curso no encontrado." });
      return;
    }
    if (course.teacherReference !== user.id) {
      response.status(403).json({ error: "COURSE_ACCESS_DENIED", message: "No tienes acceso a los estudiantes de este curso." });
      return;
    }
    response.status(200).json({ students: await getCourseMembers(course.id) });
  } catch (error) {
    next(error);
  }
}
