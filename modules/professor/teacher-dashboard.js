// Renderizador visual aislado para la futura pantalla teacher-dashboard.
// No se integra todavía con index.html, app.js ni las rutas de la aplicación actual.

import {
  getAssignedCourses,
  getCourseStudents,
  getFutureTeacherActions,
  getTeacherProfile,
  getTeacherSummary
} from "./dashboard.js";

const $ = selector => document.querySelector(selector);

const actionIcons = {
  "Registrar asistencia": "◷",
  "Cargar notas": "▤",
  "Subir material": "↥",
  "Comunicar anuncios": "◌"
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function currentDay() {
  return new Intl.DateTimeFormat("es-CL", { weekday: "long" })
    .format(new Date())
    .toLowerCase();
}

function renderSummary(summary) {
  const items = [
    ["▤", "Cursos asignados", summary.cursosAsignados],
    ["◉", "Alumnos totales", summary.cantidadAlumnos],
    ["◷", "Clases del día", summary.clasesDelDia],
    ["!", "Pendientes", summary.pendientes]
  ];

  $("#teacher-summary").innerHTML = items.map(([icon, label, value]) => `
    <article class="teacher-summary-card">
      <span class="summary-icon" aria-hidden="true">${icon}</span>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function renderCourses(courses) {
  $("#teacher-courses").innerHTML = courses.map(course => `
    <article class="teacher-course-card">
      <div class="course-card-head">
        <div>
          <span class="course-section">${escapeHtml(course.seccion)}</span>
          <h3>${escapeHtml(course.nombre)}</h3>
        </div>
        <span class="course-status">Activo</span>
      </div>
      <dl class="course-details">
        <div><dt>Horario</dt><dd>${escapeHtml(course.horario)}</dd></div>
        <div><dt>Sala</dt><dd>${escapeHtml(course.sala)}</dd></div>
      </dl>
      <footer class="course-students">◉ ${getCourseStudents(course.id).length} alumnos inscritos</footer>
      <a class="teacher-course-link" href="./teacher-course-detail.html?courseId=${encodeURIComponent(course.id)}">Ver curso <span aria-hidden="true">→</span></a>
    </article>
  `).join("");
}

function renderActions(actions) {
  $("#teacher-actions").innerHTML = actions.map(action => `
    <button class="teacher-action" type="button" disabled aria-disabled="true">
      <span aria-hidden="true">${actionIcons[action] || "•"}</span>
      <b>${escapeHtml(action)}</b>
      <small>Próximamente</small>
    </button>
  `).join("");
}

function renderTeacherDashboard() {
  const profile = getTeacherProfile();
  const day = currentDay();

  $("#teacher-title").textContent = profile.nombre;
  $("#teacher-department").textContent = `Departamento de ${profile.departamento || profile.department || "Sin departamento asignado"}`;
  $("#teacher-day").textContent = day;
  renderSummary(getTeacherSummary(day));
  renderCourses(getAssignedCourses());
  renderActions(getFutureTeacherActions());
}

renderTeacherDashboard();
