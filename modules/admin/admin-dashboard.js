// Interfaz demo aislada para el futuro Panel Administrativo UBO.
// No se conecta a las rutas, sesión ni pantallas de la aplicación actual.

import {
  getAdministrativeManagementData,
  getInstitutionStats,
  getAdminProfile,
  getUsageStatistics,
  getTrafficStatistics,
  getApplicationErrors,
  getLibraryStatistics,
  getCasinoStatistics,
  getRequestStatistics,
  getEventStatistics
} from "../../services/admin-service.js";
import { getAvailableAdministrativeActions } from "../../services/admin-actions/administrative-action-service.js";
import { enforceDemoRouteGuard } from "../../core/demo-route-guard.js";
import { clearCurrentDemoIdentity } from "../../core/demo-identity-session.js";

const managementMetadata = [
  { key: "estudiantes", label: "Estudiantes", icon: "🎓", description: "Matrícula y datos académicos." },
  { key: "profesores", label: "Profesores", icon: "👩‍🏫", description: "Plantel docente y asignaciones." },
  { key: "carreras", label: "Carreras", icon: "🏛️", description: "Oferta académica institucional." },
  { key: "cursos", label: "Cursos", icon: "📚", description: "Secciones y cursos activos." },
  { key: "salas", label: "Salas", icon: "📍", description: "Espacios físicos disponibles." },
  { key: "horarios", label: "Horarios", icon: "🕘", description: "Bloques académicos programados." },
  { key: "permisos", label: "Permisos", icon: "🔐", description: "Roles y accesos institucionales." },
  { key: "acciones", label: "Acciones", icon: "⚙️", description: "Notificaciones, reportes y gestión." }
];

function getElement(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHeader() {
  const admin = getAdminProfile();
  getElement("admin-name").textContent = admin.nombre;
  getElement("admin-role").textContent = "Gestión institucional";
}

function renderSummary() {
  const summary = getInstitutionStats();
  const metrics = [
    { label: "Usuarios activos", value: summary.usuariosActivos, icon: "👥" },
    { label: "Estudiantes", value: summary.estudiantes, icon: "🎓" },
    { label: "Profesores", value: summary.profesores, icon: "👩‍🏫" },
    { label: "Carreras", value: summary.carreras, icon: "🏛️" },
    { label: "Cursos activos", value: summary.cursosActivos, icon: "📚" }
  ];

  getElement("institution-summary").innerHTML = metrics.map(metric => `
    <article class="metric-card">
      <span class="metric-icon" aria-hidden="true">${metric.icon}</span>
      <strong>${escapeHtml(metric.value)}</strong>
      <span>${escapeHtml(metric.label)}</span>
    </article>
  `).join("");
}

function renderManagement() {
  const management = getAdministrativeManagementData();
  const dataCounts = {
    estudiantes: management.estudiantes.length,
    profesores: management.profesores.length,
    carreras: management.carreras.length,
    cursos: management.cursos.length,
    salas: management.salas.length,
    horarios: management.horarios.length,
    permisos: management.permisos.length,
    acciones: getAvailableAdministrativeActions().length
  };

  getElement("academic-management").innerHTML = managementMetadata.map(item => `
    <article class="management-card">
      <span class="management-icon" aria-hidden="true">${item.icon}</span>
      <div>
        <h3>${item.label}</h3>
        <p>${item.description}</p>
      </div>
      <span class="management-count">${dataCounts[item.key]}</span>
    </article>
  `).join("");
}

function renderStatistics() {
  const usageStatistics = getUsageStatistics();
  const trafficStatistics = getTrafficStatistics();
  const applicationErrors = getApplicationErrors();
  const libraryStatistics = getLibraryStatistics();
  const casinoStatistics = getCasinoStatistics();
  const requestStatistics = getRequestStatistics();
  const eventStatistics = getEventStatistics();

  const usage = usageStatistics.modules.map(item => `
    <div class="stat-row">
      <span>${escapeHtml(item.module)}</span>
      <strong>${escapeHtml(item.uses)} accesos</strong>
    </div>
  `).join("") + trafficStatistics.periods.map(item => `
    <div class="stat-row">
      <span>Mayor tráfico · ${escapeHtml(item.period)}</span>
      <strong>${escapeHtml(item.accesses)} accesos</strong>
    </div>
  `).join("") + applicationErrors.records.map(item => `
    <div class="stat-row">
      <span>Errores · ${escapeHtml(item.category)}</span>
      <strong>${escapeHtml(item.count)} · ${escapeHtml(item.status)}</strong>
    </div>
  `).join("") + `
    <div class="stat-row">
      <span>Uso de Biblioteca</span>
      <strong>${escapeHtml(libraryStatistics.consultations)} consultas</strong>
    </div>
    <div class="stat-row">
      <span>Uso de Casino</span>
      <strong>${escapeHtml(casinoStatistics.consultations)} · ${escapeHtml(casinoStatistics.status)}</strong>
    </div>
  `;

  const operations = [
    { label: "Eventos activos", value: eventStatistics.active, icon: "🎓" },
    { label: "Inscripciones", value: eventStatistics.registered, icon: "✓" },
    { label: "Solicitudes pendientes", value: requestStatistics.pending, icon: "⏳" },
    { label: "Solicitudes resueltas", value: requestStatistics.resolved, icon: "✓" }
  ];

  getElement("usage-statistics").innerHTML = usage;
  getElement("operational-statistics").innerHTML = operations.map(item => `
    <div class="operation-row">
      <span class="operation-icon" aria-hidden="true">${item.icon}</span>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("");
}

function renderAdminDashboard() {
  renderHeader();
  renderSummary();
  renderManagement();
  renderStatistics();
}

function setupDemoLogout() {
  getElement("admin-demo-logout")?.addEventListener("click", () => {
    clearCurrentDemoIdentity();
    window.location.replace("../demo/demo-selector.html");
  });
}

const adminRouteGuard = enforceDemoRouteGuard("ADMIN", {
  STUDENT: "../../index.html",
  TEACHER: "../professor/teacher-dashboard.html",
  UNAUTHENTICATED: "../demo/demo-selector.html",
  default: "../demo/demo-selector.html"
});

if (adminRouteGuard.allowed) {
  renderAdminDashboard();
  setupDemoLogout();
}
