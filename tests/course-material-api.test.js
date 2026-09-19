import assert from "node:assert/strict";
import test from "node:test";
import { saveAcademicSession } from "../services/api/auth-api-service.js";
import { getCourse, getCourses } from "../services/api/course-api-service.js";
import { getCourseMaterials, getMaterial } from "../services/api/material-api-service.js";

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
function response(status, body) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }

test("consulta cursos y materiales con x-user-id sin contraseña", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/api/courses")) return response(200, { courses: [{ id: "course-id", name: "Bases de Datos" }] });
    if (url.includes("/api/materials/")) return response(200, { material: { id: "material-id", title: "Guía", keywords: ["demo"] } });
    if (url.includes("/materials")) return response(200, { materials: [{ id: "material-id", title: "Guía", keywords: ["demo"] }] });
    return response(200, { course: { id: "course-id", name: "Bases de Datos" } });
  };
  const courses = await getCourses({ storage: sessionStorage, fetchImpl });
  const course = await getCourse("course-id", { storage: sessionStorage, fetchImpl });
  const materials = await getCourseMaterials("course-id", { storage: sessionStorage, fetchImpl });
  const material = await getMaterial("material-id", { storage: sessionStorage, fetchImpl });
  assert.equal(courses.available, true);
  assert.equal(course.course.name, "Bases de Datos");
  assert.equal(materials.materials[0].title, "Guía");
  assert.equal(material.material.id, "material-id");
  assert.ok(calls.every(call => call.options.headers["x-user-id"] === "student-id"));
  assert.doesNotMatch(JSON.stringify(calls), /password/);
});

test("conserva fallback entregado por la interfaz si la API no está disponible", async () => {
  const sessionStorage = storage();
  saveAcademicSession({ id: "student-id", name: "Sofía Martínez", role: "STUDENT" }, { storage: sessionStorage });
  const fallbackCourse = { id: "db", name: "Bases de Datos" };
  const fallbackMaterial = { id: "material-local", title: "Guía local", keywords: ["local"] };
  const offline = async () => { throw new TypeError("offline"); };
  const courses = await getCourses({ storage: sessionStorage, fetchImpl: offline, fallback: [fallbackCourse] });
  const materials = await getCourseMaterials("db", { storage: sessionStorage, fetchImpl: offline, fallback: [fallbackMaterial] });
  courses.courses[0].name = "Mutado";
  materials.materials[0].keywords.push("mutado");
  assert.equal(courses.source, "demo-fallback");
  assert.equal(fallbackCourse.name, "Bases de Datos");
  assert.deepEqual(fallbackMaterial.keywords, ["local"]);
});
