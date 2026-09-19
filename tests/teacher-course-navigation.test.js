import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const dashboard = readFileSync(`${projectRoot}modules/professor/teacher-dashboard.js`, "utf8");
const detail = readFileSync(`${projectRoot}modules/professor/teacher-course-detail.js`, "utf8");

assert.match(
  dashboard,
  /teacher-course-detail\.html#courseId=\$\{encodeURIComponent\(courseId\)\}/,
  "El enlace docente debe transportar courseId en el fragmento para no perderlo en redirecciones del servidor estático."
);
assert.match(
  detail,
  /new URLSearchParams\(window\.location\.hash\.replace\(\/\^#\/, ""\)\)\.get\("courseId"\)/,
  "El detalle docente debe aceptar el courseId preservado en el fragmento."
);
assert.match(
  detail,
  /queryCourseId\) return queryCourseId/,
  "El contrato anterior mediante query string se mantiene compatible."
);

console.log("TEACHER_COURSE_NAVIGATION_CONTRACT_OK");
