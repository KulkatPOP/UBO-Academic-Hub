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
import { clearInstitutionalSession, getInstitutionalSession } from "../../services/institutional-session-service.js";
import { applyThemePreference, getThemePreference, toggleThemePreference } from "../../services/theme-preference-service.js";
import { getAdminDashboardSummary } from "../../services/admin-actions/admin-dashboard-summary-service.js";
import { getInstitutionalAcademicRiskSummary } from "../../services/analytics/academic-risk-service.js";
import { getInstitutionalAcademicRecommendations } from "../../services/recommendation/academic-recommendation-service.js";

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

function renderHeader() {
  const admin = getAdminProfile();
  const session = getInstitutionalSession();
  const name = session?.role === "ADMIN" ? session.nombre : admin.nombre;
  getElement("admin-name").textContent = name;
  getElement("admin-role").textContent = "Gestión institucional";
  const avatar = document.querySelector(".admin-avatar");
  if (avatar) avatar.textContent = String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function renderAccountProfile() {
  const admin = getAdminProfile();
  const session = getInstitutionalSession();
  const account = session?.role === "ADMIN" ? session : {
    nombre: admin.nombre,
    username: "admin",
    email: "administrador@ubo.cl"
  };
  const items = [
    ["Nombre", account.nombre],
    ["Usuario", account.username],
    ["Rol", "Administrador"],
    ["Correo", account.email || "No disponible"],
    ["Panel", "Gestión institucional"]
  ];
  const container = getElement("admin-account-profile");
  const fragment = document.createDocumentFragment();
  items.forEach(([label, value]) => {
    const item = createSummaryElement("article", "admin-account-item");
    item.append(createSummaryElement("span", "admin-account-label", label), createSummaryElement("strong", "admin-account-value", value));
    fragment.append(item);
  });
  container.replaceChildren(fragment);
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

  const container = getElement("institution-summary");
  const fragment = document.createDocumentFragment();
  metrics.forEach(metric => {
    const card = createSummaryElement("article", "metric-card");
    const icon = createSummaryElement("span", "metric-icon", metric.icon);
    icon.setAttribute("aria-hidden", "true");
    card.append(icon, createSummaryElement("strong", "", String(metric.value)), createSummaryElement("span", "", metric.label));
    fragment.append(card);
  });
  container.replaceChildren(fragment);
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

  const container = getElement("academic-management");
  const fragment = document.createDocumentFragment();
  managementMetadata.forEach(item => {
    const card = createSummaryElement("article", "management-card");
    const icon = createSummaryElement("span", "management-icon", item.icon);
    const content = document.createElement("div");
    icon.setAttribute("aria-hidden", "true");
    content.append(createSummaryElement("h3", "", item.label), createSummaryElement("p", "", item.description));
    card.append(icon, content, createSummaryElement("span", "management-count", String(dataCounts[item.key])));
    fragment.append(card);
  });
  container.replaceChildren(fragment);
}

function renderStatistics() {
  const usageStatistics = getUsageStatistics();
  const trafficStatistics = getTrafficStatistics();
  const applicationErrors = getApplicationErrors();
  const libraryStatistics = getLibraryStatistics();
  const casinoStatistics = getCasinoStatistics();
  const requestStatistics = getRequestStatistics();
  const eventStatistics = getEventStatistics();

  const operations = [
    { label: "Eventos activos", value: eventStatistics.active, icon: "🎓" },
    { label: "Inscripciones", value: eventStatistics.registered, icon: "✓" },
    { label: "Solicitudes pendientes", value: requestStatistics.pending, icon: "⏳" },
    { label: "Solicitudes resueltas", value: requestStatistics.resolved, icon: "✓" }
  ];

  const usageContainer = getElement("usage-statistics");
  const usageRows = document.createDocumentFragment();
  const appendUsage = (label, value) => {
    const row = createSummaryElement("div", "stat-row");
    row.append(createSummaryElement("span", "", label), createSummaryElement("strong", "", value));
    usageRows.append(row);
  };
  usageStatistics.modules.forEach(item => appendUsage(item.module, `${item.uses} accesos`));
  trafficStatistics.periods.forEach(item => appendUsage(`Mayor tráfico · ${item.period}`, `${item.accesses} accesos`));
  applicationErrors.records.forEach(item => appendUsage(`Errores · ${item.category}`, `${item.count} · ${item.status}`));
  appendUsage("Uso de Biblioteca", `${libraryStatistics.consultations} consultas`);
  appendUsage("Uso de Casino", `${casinoStatistics.consultations} · ${casinoStatistics.status}`);
  usageContainer.replaceChildren(usageRows);

  const operationalContainer = getElement("operational-statistics");
  const operationRows = document.createDocumentFragment();
  operations.forEach(item => {
    const row = createSummaryElement("div", "operation-row");
    const icon = createSummaryElement("span", "operation-icon", item.icon);
    icon.setAttribute("aria-hidden", "true");
    row.append(icon, createSummaryElement("span", "", item.label), createSummaryElement("strong", "", String(item.value)));
    operationRows.append(row);
  });
  operationalContainer.replaceChildren(operationRows);
}

function createSummaryElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderDemoDashboardSummary() {
  const result = getAdminDashboardSummary();
  const summary = getElement("admin-dashboard-summary");
  const status = getElement("admin-demo-status");
  const activity = getElement("admin-recent-activity");
  summary.replaceChildren();
  const metrics = [
    ["Total usuarios demo", result.metrics.usersCount, "Perfiles disponibles"],
    ["Estudiantes demo", result.metrics.studentsCount, "Perfiles STUDENT"],
    ["Profesores demo", result.metrics.teachersCount, "Perfiles TEACHER"],
    ["Cursos disponibles", result.metrics.coursesCount, "Cursos institucionales demo"],
    ["Material publicado", result.metrics.materialsCount, "Registros locales demo"],
    ["Notas demo", result.metrics.gradesCount, "Evaluaciones registradas"],
    ["Registros asistencia", result.metrics.attendanceRecordsCount, "Actividad docente demo"],
    ["Avisos enviados", result.metrics.announcementsCount, "Comunicaciones demo"]
  ];
  const cards = document.createDocumentFragment();
  metrics.forEach(([label, value, description]) => {
    const card = createSummaryElement("article", "admin-summary-metric");
    card.append(createSummaryElement("span", "", label), createSummaryElement("strong", "", String(value)), createSummaryElement("small", "", description));
    cards.append(card);
  });
  summary.append(cards);

  status.replaceChildren();
  const state = createSummaryElement("div", "admin-demo-status-card");
  state.append(createSummaryElement("strong", "", `● ${result.status.label}`), createSummaryElement("span", "", `${result.status.coursesWithActivity} curso(s) con actividad · ${result.status.recordsCount} registro(s) demo · ${result.status.alertsCount} alerta(s) generada(s)`));
  status.append(state);

  activity.replaceChildren();
  if (!result.activity.length) {
    activity.append(createSummaryElement("p", "admin-empty-state", "Sin datos disponibles."));
  } else {
    const list = document.createDocumentFragment();
    result.activity.forEach(item => {
      const row = createSummaryElement("div", "admin-activity-row");
      const content = document.createElement("div");
      content.append(createSummaryElement("b", "", item.label), createSummaryElement("span", "", `${item.courseName} · ${item.title}`));
      row.append(content, createSummaryElement("small", "", item.createdAt ? "Registro demo" : "Sin fecha"));
      list.append(row);
    });
    activity.append(list);
  }
  if (result.warnings.length) status.append(createSummaryElement("p", "admin-summary-note", "Algunas fuentes demo no estuvieron disponibles; se muestran las métricas que pudieron calcularse."));
}

function renderAcademicRisk() {
  const container = getElement("admin-academic-risk");
  if (!container) return;
  const result = getInstitutionalAcademicRiskSummary();
  container.replaceChildren();
  if (!result.available) {
    container.append(createSummaryElement("p", "admin-empty-state", "No fue posible calcular la analítica académica demo."));
    return;
  }
  const metrics = [
    ["Estudiantes analizados", result.metrics.studentsAnalyzed],
    ["Cursos críticos", result.metrics.criticalCourses],
    ["Promedio general demo", result.metrics.average === null ? "Sin datos" : result.metrics.average.toFixed(1).replace(".", ",")],
    ["Asistencia promedio demo", result.metrics.attendance === null ? "Sin datos" : `${result.metrics.attendance.toFixed(1).replace(".", ",")}%`],
    ["Alertas de seguimiento", result.metrics.alerts]
  ];
  const fragment = document.createDocumentFragment();
  const metricGrid = createSummaryElement("div", "admin-risk-metrics");
  metrics.forEach(([label, value]) => {
    const card = createSummaryElement("article", "admin-risk-metric");
    card.append(createSummaryElement("span", "", label), createSummaryElement("strong", "", String(value)));
    metricGrid.append(card);
  });
  const distribution = createSummaryElement("div", "admin-risk-distribution");
  [["🟢", "Bajo", result.metrics.counts.LOW], ["🟡", "Medio", result.metrics.counts.MEDIUM], ["🔴", "Alto", result.metrics.counts.HIGH]].forEach(([icon, label, value]) => {
    distribution.append(createSummaryElement("span", "", `${icon} ${label}: ${value}`));
  });
  fragment.append(metricGrid, distribution);
  if (result.criticalCourses.length) {
    const critical = createSummaryElement("p", "admin-risk-note", `Cursos demo que requieren seguimiento: ${result.criticalCourses.map(course => course.name).join(" · ")}`);
    fragment.append(critical);
  }
  container.append(fragment);
}

function renderAcademicRecommendations() {
  const container = getElement("admin-academic-recommendations");
  if (!container) return;
  const result = getInstitutionalAcademicRecommendations();
  container.replaceChildren();
  if (!result.available) {
    container.append(createSummaryElement("p", "admin-empty-state", "No hay acciones recomendadas disponibles."));
    return;
  }
  const actions = document.createElement("ul");
  result.actions.forEach(action => actions.append(createSummaryElement("li", "", action)));
  const courses = result.courses.length ? result.courses.map(course => course.name).join(" · ") : "Sin cursos críticos demo";
  container.append(createSummaryElement("strong", "", "Acciones recomendadas"), createSummaryElement("p", "", `Cursos con mayor necesidad: ${courses}`), actions);
}

function renderAdminDashboard() {
  renderHeader();
  renderAccountProfile();
  renderSummary();
  renderManagement();
  renderStatistics();
  renderDemoDashboardSummary();
  renderAcademicRisk();
  renderAcademicRecommendations();
}

function setupDemoLogout() {
  getElement("admin-demo-logout")?.addEventListener("click", () => {
    clearCurrentDemoIdentity();
    clearInstitutionalSession();
    window.location.replace("../demo/demo-selector.html");
  });
}

function syncAdminThemeButton() {
  const button = getElement("admin-theme-toggle");
  if (!button) return;
  const dark = getThemePreference() === "dark";
  button.firstChild.textContent = dark ? "Modo claro " : "Modo oscuro ";
  button.setAttribute("aria-pressed", String(dark));
}

function setupThemePreference() {
  syncAdminThemeButton();
  getElement("admin-theme-toggle")?.addEventListener("click", () => {
    toggleThemePreference();
    syncAdminThemeButton();
  });
}

applyThemePreference();

const adminRouteGuard = enforceDemoRouteGuard("ADMIN", {
  STUDENT: "../../index.html",
  TEACHER: "../professor/teacher-dashboard.html",
  UNAUTHENTICATED: "../demo/demo-selector.html",
  default: "../demo/demo-selector.html"
});

if (adminRouteGuard.allowed) {
  renderAdminDashboard();
  setupDemoLogout();
  setupThemePreference();
}
