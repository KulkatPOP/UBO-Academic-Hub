// Herramienta interna aislada para revisar compatibilidad de datos de estudiante.
// Usa un snapshot demo y no se conecta al login, router ni aplicación actual.

import { courseIdMap } from "../../../data/mappings/courses-map.js";
import { checkStudentCompatibility } from "../../../services/compatibility/student-compatibility-service.js";

const studentSnapshot = {
  username: "sofia.martinez",
  studentData: {
    name: "Sofía Martínez Rojas",
    email: "sofia.martinez@pregrado.ubo.cl",
    career: "Ingeniería Informática",
    semester: "5° semestre",
    schedule: "Diurna"
  },
  courses: [
    { id: "db", name: "Bases de Datos", grade: 6.1, attendance: 94 },
    { id: "iot", name: "Programación IoT", grade: 5.9, attendance: 89 },
    { id: "english", name: "Inglés Técnico", grade: 6.0, attendance: 92 },
    { id: "cyber", name: "Ciberseguridad", grade: 6.3, attendance: 96 }
  ]
};

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusMarkup(isCompatible) {
  return `<span class="status-badge ${isCompatible ? "success" : "warning"}">${isCompatible ? "Compatible" : "Requiere revisión"}</span>`;
}

function warningMatches(warnings, term) {
  return warnings.some(warning => warning.toLowerCase().includes(term));
}

function renderOverview(result) {
  const profile = studentSnapshot.studentData;
  $("student-overview").innerHTML = `
    <div class="student-avatar" aria-hidden="true">SM</div>
    <div>
      <p class="eyebrow">ESTUDIANTE DEMO</p>
      <h2>${escapeHtml(profile.name)}</h2>
      <p>${escapeHtml(profile.career)} · ${escapeHtml(profile.semester)} · ${escapeHtml(profile.schedule)}</p>
    </div>
    ${statusMarkup(result.compatible)}
  `;
}

function renderIdentity(result) {
  const compatible = !result.missingMappings.includes("student-identity");
  $("identity-result").innerHTML = `
    <span class="card-icon" aria-hidden="true">👤</span>
    <div class="card-heading"><h2>Identidad</h2>${statusMarkup(compatible)}</div>
    <p>${compatible ? `Usuario <b>${escapeHtml(studentSnapshot.username)}</b> relacionado con la identidad institucional.` : "No se encontró una equivalencia institucional para el usuario."}</p>
  `;
}

function renderCareer(result) {
  const compatible = !result.missingMappings.includes("career") && !warningMatches(result.warnings, "carrera");
  $("career-result").innerHTML = `
    <span class="card-icon" aria-hidden="true">🏛️</span>
    <div class="card-heading"><h2>Carrera</h2>${statusMarkup(compatible)}</div>
    <p>${compatible ? `Career ID: <b>${escapeHtml(result.studentModel.careerId)}</b>` : "La carrera requiere una equivalencia institucional disponible."}</p>
  `;
}

function renderCourses(result) {
  const courses = studentSnapshot.courses.map(course => ({
    ...course,
    mapping: courseIdMap.find(item => item.currentCourseId === course.id)
  }));
  const compatible = courses.filter(course => course.mapping?.status === "available");
  const pending = courses.filter(course => course.mapping?.status !== "available");

  $("courses-result").innerHTML = `
    <span class="card-icon" aria-hidden="true">📚</span>
    <div class="card-heading"><h2>Cursos</h2>${statusMarkup(pending.length === 0)}</div>
    <div class="course-columns">
      <div><h3>Compatibles · ${compatible.length}</h3>${compatible.map(course => `<p><b>${escapeHtml(course.name)}</b><small>${escapeHtml(course.mapping.institutionalCourseId)}</small></p>`).join("") || "<p>Sin cursos compatibles.</p>"}</div>
      <div><h3>Pendientes · ${pending.length}</h3>${pending.map(course => `<p><b>${escapeHtml(course.name)}</b><small>${course.mapping ? "Mapeo planificado" : "Sin mapeo"}</small></p>`).join("") || "<p>No hay cursos pendientes.</p>"}</div>
    </div>
  `;
}

function renderGrades(result) {
  const warning = warningMatches(result.warnings, "notas agregadas") || warningMatches(result.warnings, "notas actuales");
  $("grades-result").innerHTML = `
    <span class="card-icon" aria-hidden="true">📝</span>
    <div class="card-heading"><h2>Notas</h2>${statusMarkup(!warning)}</div>
    <p>${warning ? "Los promedios actuales no incluyen evaluación ni ponderación institucional completa." : "Las notas tienen equivalencia completa."}</p>
  `;
}

function renderAttendance(result) {
  const warning = warningMatches(result.warnings, "asistencia actual está agregada") || warningMatches(result.warnings, "asistencia por clase");
  $("attendance-result").innerHTML = `
    <span class="card-icon" aria-hidden="true">◷</span>
    <div class="card-heading"><h2>Asistencia</h2>${statusMarkup(!warning)}</div>
    <p>${warning ? "Solo existe porcentaje por ramo; faltan registros por fecha y estado." : "Hay registros de asistencia compatibles."}</p>
  `;
}

function renderWarnings(result) {
  $("warnings-result").innerHTML = `
    <h2>Advertencias de transición</h2>
    <ul>${result.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("") || "<li>No se detectaron advertencias.</li>"}</ul>
  `;
}

function renderMigrationCheck() {
  const result = checkStudentCompatibility(studentSnapshot);
  renderOverview(result);
  renderIdentity(result);
  renderCareer(result);
  renderCourses(result);
  renderGrades(result);
  renderAttendance(result);
  renderWarnings(result);
}

renderMigrationCheck();
