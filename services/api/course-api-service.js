import { getAcademicSession } from "./auth-api-service.js";

function cloneCourses(courses) {
  return Array.isArray(courses) ? courses.map(course => ({ ...course })) : [];
}

function cloneCourse(course) {
  return course && typeof course === "object" ? { ...course } : null;
}

async function request(path, { fetchImpl = globalThis.fetch, baseUrl = "http://localhost:3001", storage } = {}) {
  const session = getAcademicSession({ storage });
  if (!session) return { available: false, source: "demo-fallback", status: null, body: null, message: "No hay sesión backend disponible." };
  try {
    if (typeof fetchImpl !== "function") throw new TypeError("Fetch no disponible");
    const response = await fetchImpl(`${baseUrl}${path}`, { credentials: "include", headers: { "x-user-id": session.userId } });
    const body = await response.json().catch(() => null);
    return response.ok
      ? { available: true, source: "backend", status: response.status, body, message: null }
      : { available: false, source: "backend", status: response.status, body, message: body?.message || "No fue posible obtener cursos." };
  } catch {
    return { available: false, source: "demo-fallback", status: null, body: null, message: "La API de cursos no está disponible." };
  }
}

/** API primero; el consumidor conserva el fallback DEMO que entregue en `fallback`. */
export async function getCourses({ fallback = [], ...options } = {}) {
  const result = await request("/api/courses", options);
  const courses = result.available && Array.isArray(result.body?.courses) ? cloneCourses(result.body.courses) : cloneCourses(fallback);
  return { ...result, courses };
}

/** API primero; no inventa un curso si el backend no está disponible. */
export async function getCourse(courseId, { fallback = null, ...options } = {}) {
  const safeCourseId = typeof courseId === "string" ? courseId.trim() : "";
  if (!safeCourseId) return { available: false, source: "client", status: null, course: cloneCourse(fallback), message: "Se requiere un identificador de curso." };
  const result = await request(`/api/courses/${encodeURIComponent(safeCourseId)}`, options);
  const course = result.available ? cloneCourse(result.body?.course) : cloneCourse(fallback);
  return { ...result, course };
}

/** Consulta mínima para el docente propietario; el backend resuelve el rol y propiedad. */
export async function getCourseStudents(courseId, { fallback = [], ...options } = {}) {
  const safeCourseId = typeof courseId === "string" ? courseId.trim() : "";
  if (!safeCourseId) return { available: false, source: "client", status: null, students: cloneCourses(fallback), message: "Se requiere un identificador de curso." };
  const result = await request(`/api/courses/${encodeURIComponent(safeCourseId)}/students`, options);
  const students = result.available && Array.isArray(result.body?.students) ? cloneCourses(result.body.students) : cloneCourses(fallback);
  return { ...result, students };
}
