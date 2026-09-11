// Renderizador visual aislado para la futura pantalla teacher-dashboard.
// No se integra todavía con index.html, app.js ni las rutas de la aplicación actual.

import {
  getAssignedCourses,
  getCourseStudents,
  getFutureTeacherActions,
  getTeacherProfile,
  getTeacherSummary
} from "./dashboard.js";
import { enforceDemoRouteGuard } from "../../core/demo-route-guard.js";
import { clearCurrentDemoIdentity } from "../../core/demo-identity-session.js";
import { getInstitutionConfig } from "../../config/institution.js";
import { getTeacherDashboardSummary } from "../../services/teacher-actions/teacher-dashboard-summary-service.js";
import { getTeacherCourseAnalytics } from "../../services/analytics/academic-analytics-service.js";

const $ = selector => document.querySelector(selector);

const actionIcons = {
  "Registrar asistencia": "◷",
  "Cargar notas": "▤",
  "Subir material": "↥",
  "Comunicar anuncios": "◌"
};

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

  const container = $("#teacher-summary");
  const fragment = document.createDocumentFragment();
  items.forEach(([icon, label, value]) => {
    const card = createElement("article", "teacher-summary-card");
    const glyph = createElement("span", "summary-icon", icon);
    glyph.setAttribute("aria-hidden", "true");
    card.append(glyph, createElement("span", "", label), createElement("strong", "", String(value)));
    fragment.append(card);
  });
  container.replaceChildren(fragment);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function metricLabel(label, value, emptyLabel) {
  const item = createElement("div", "teacher-course-metric");
  item.append(createElement("span", "teacher-course-metric-label", label));
  item.append(createElement("strong", "teacher-course-metric-value", value === null || value === undefined ? emptyLabel : String(value)));
  return item;
}

function renderCourses(courses, summaryCourses = [], analyticsCourses = []) {
  const summaryByCourse = new Map(summaryCourses.map(summary => [summary.courseId, summary]));
  const analyticsByCourse = new Map(analyticsCourses.map(analytics => [analytics.courseId, analytics]));
  const container = $("#teacher-courses");
  const fragment = document.createDocumentFragment();

  courses.forEach(course => {
    const summary = summaryByCourse.get(course.id);
    const analytics = analyticsByCourse.get(course.id);
    const card = createElement("article", "teacher-course-card");
    const head = createElement("div", "course-card-head");
    const heading = document.createElement("div");
    heading.append(createElement("span", "course-section", course.seccion || "Sin sección"));
    heading.append(createElement("h3", "", course.nombre || "Curso institucional"));
    head.append(heading, createElement("span", "course-status", "Activo"));

    const details = createElement("dl", "course-details");
    [["Horario", course.horario || "Por confirmar"], ["Sala", course.sala || "Por confirmar"]].forEach(([label, value]) => {
      const row = document.createElement("div");
      row.append(createElement("dt", "", label), createElement("dd", "", value));
      details.append(row);
    });

    const metrics = createElement("div", "teacher-course-metrics");
    metrics.append(
      metricLabel("Estudiantes", summary?.studentsCount ?? getCourseStudents(course.id).length, "Sin registros"),
      metricLabel("Material", summary?.materialsCount, "Sin materiales"),
      metricLabel("Notas demo", summary?.gradesCount, "Sin notas"),
      metricLabel("Avisos", summary?.announcementsCount, "Sin avisos")
    );
    const analysis = createElement("div", "teacher-course-analysis");
    const average = analytics?.averageDemo === null || analytics?.averageDemo === undefined ? "Sin datos suficientes" : analytics.averageDemo.toFixed(1).replace(".", ",");
    const attendance = analytics?.attendance?.percentage === null || analytics?.attendance?.percentage === undefined ? "Sin asistencia registrada" : `${analytics.attendance.percentage.toFixed(1).replace(".", ",")}%`;
    analysis.append(
      createElement("span", "", `Rendimiento demo: ${average}`),
      createElement("span", "", `Asistencia demo: ${attendance}`),
      createElement("span", "", `Seguimiento: ${analytics?.studentsFollowUp ?? 0} estudiante(s)`)
    );
    const attendanceText = summary?.attendancePercentage === null || summary?.attendancePercentage === undefined
      ? "Sin asistencia registrada"
      : `${summary.attendancePercentage.toFixed(1).replace(".", ",")}% demo`;
    const footer = createElement("footer", "course-students", `▥ Asistencia: ${attendanceText}`);
    const link = createElement("a", "teacher-course-link", "Ingresar al curso ");
    link.href = `./teacher-course-detail.html?courseId=${encodeURIComponent(course.id)}`;
    const arrow = createElement("span", "", "→");
    arrow.setAttribute("aria-hidden", "true");
    link.append(arrow);
    card.append(head, details, metrics, analysis, footer, link);
    fragment.append(card);
  });
  container.replaceChildren(fragment);
}

function renderRecentActivity(activity) {
  const container = $("#teacher-recent-activity");
  if (!activity.length) {
    container.replaceChildren(createElement("p", "teacher-empty-state", "Aún no hay actividad demo registrada en tus cursos."));
    return;
  }
  const list = document.createDocumentFragment();
  activity.forEach(item => {
    const row = createElement("article", "teacher-activity-row");
    const text = document.createElement("div");
    text.append(createElement("strong", "", item.label), createElement("span", "", `${item.courseName} · ${item.title}`));
    row.append(text, createElement("small", "", item.createdAt ? "Actividad demo" : "Sin fecha"));
    list.append(row);
  });
  container.replaceChildren(list);
}

function renderActions(actions) {
  const container = $("#teacher-actions");
  const fragment = document.createDocumentFragment();
  actions.forEach(action => {
    const button = createElement("button", "teacher-action");
    const icon = createElement("span", "", actionIcons[action] || "•");
    button.type = "button";
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, createElement("b", "", action), createElement("small", "", "Próximamente"));
    fragment.append(button);
  });
  container.replaceChildren(fragment);
}

function renderTeacherDashboard() {
  const profile = getTeacherProfile();
  const day = currentDay();

  $("#teacher-title").textContent = profile.nombre;
  $("#teacher-department").textContent = `Departamento de ${profile.departamento || profile.department || "Sin departamento asignado"}`;
  $("#teacher-day").textContent = day;
  renderSummary(getTeacherSummary(day));
  const dashboardSummary = getTeacherDashboardSummary({ teacherId: profile.id });
  const courseAnalytics = getTeacherCourseAnalytics({ teacherId: profile.id });
  renderCourses(getAssignedCourses(), dashboardSummary.courses, courseAnalytics.courses);
  renderRecentActivity(dashboardSummary.activity);
  renderActions(getFutureTeacherActions());
}

function setupDemoLogout() {
  document.getElementById("teacher-demo-logout")?.addEventListener("click", () => {
    clearCurrentDemoIdentity();
    window.location.replace("../demo/demo-selector.html");
  });
}

// DEVELOPMENT_ONLY: carga diferida, Teacher-only y fall-open. Core nunca decide rutas ni UI.
function observeTeacherIdentityCanary(identity) {
  if (getInstitutionConfig().featureFlags.USE_CORE_IDENTITY_CANARY !== true) return;

  import("../../services/adapters/core-identity-canary-runtime.js")
    .then(({ observeCoreIdentityCanary }) => observeCoreIdentityCanary(identity, { enabled: true }))
    .catch(() => console.info("CORE_IDENTITY_CANARY", {
      CANARY_STATE: "OBSERVED",
      id: identity?.id ?? null,
      role: identity?.role ?? null,
      result: "IDENTITY_ADAPTER_ERROR",
      errorCategory: "IDENTITY_ADAPTER_ERROR"
    }));
}

const teacherRouteGuard = enforceDemoRouteGuard("TEACHER", {
  STUDENT: "../../index.html",
  ADMIN: "../admin/admin-dashboard.html",
  UNAUTHENTICATED: "../demo/demo-selector.html",
  default: "../demo/demo-selector.html"
});

if (teacherRouteGuard.allowed) {
  observeTeacherIdentityCanary(teacherRouteGuard.identity);
  renderTeacherDashboard();
  setupDemoLogout();
}
