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
import { clearInstitutionalSession, getInstitutionalSession } from "../../services/institutional-session-service.js";
import { applyThemePreference, getThemePreference, toggleThemePreference } from "../../services/theme-preference-service.js";
import { getTeacherDashboardSummary } from "../../services/teacher-actions/teacher-dashboard-summary-service.js";
import { getTeacherCourseAnalytics } from "../../services/analytics/academic-analytics-service.js";
import { getTeacherAcademicRiskSummary } from "../../services/analytics/academic-risk-service.js";
import { getTeacherCourseRecommendations } from "../../services/recommendation/academic-recommendation-service.js";

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

function renderAcademicRisk(profile) {
  const container = $("#teacher-academic-risk");
  if (!container) return;
  const result = getTeacherAcademicRiskSummary({ teacherId: profile.id });
  container.replaceChildren();
  if (!result.available || !result.courses.length) {
    container.append(createElement("p", "teacher-empty-state", result.warnings?.[0]?.message || "No hay cursos disponibles para seguimiento académico demo."));
    return;
  }
  const fragment = document.createDocumentFragment();
  result.courses.forEach(course => {
    const card = createElement("article", "teacher-risk-card");
    const heading = document.createElement("div");
    heading.append(createElement("h3", "", course.courseName), createElement("span", "teacher-risk-total", `Total: ${course.totalStudents}`));
    const counts = createElement("div", "teacher-risk-counts");
    [["🟢", "Bajo", course.counts.LOW], ["🟡", "Medio", course.counts.MEDIUM], ["🔴", "Alto", course.counts.HIGH]].forEach(([icon, label, value]) => {
      counts.append(createElement("span", "", `${icon} ${label}: ${value}`));
    });
    const list = createElement("div", "teacher-risk-list");
    course.difficultQuestions?.forEach(question => list.append(createElement("p", "teacher-risk-empty", `Pregunta con mayor error: ${question.question} · ${question.correctPercentage}% correcta`)));
    if (!course.studentsAtRisk.length) list.append(createElement("p", "teacher-risk-empty", "No hay estudiantes demo que requieran seguimiento."));
    course.studentsAtRisk.forEach(student => {
      const row = createElement("article", `teacher-risk-student ${student.level.toLowerCase()}`);
      const content = document.createElement("div");
      const reasons = document.createElement("ul");
      student.reasons.forEach(reason => reasons.append(createElement("li", "", reason)));
      content.append(createElement("strong", "", student.studentName), reasons);
      row.append(content, createElement("small", "", student.recommendation));
      list.append(row);
    });
    card.append(heading, counts, list);
    fragment.append(card);
  });
  container.append(fragment);
}

function renderCourseRecommendations(profile) {
  const container = $("#teacher-course-recommendations");
  if (!container) return;
  const result = getTeacherCourseRecommendations({ teacherId: profile.id });
  container.replaceChildren();
  if (!result.available || !result.courses.length) {
    container.append(createElement("p", "teacher-risk-empty", "No hay recomendaciones de curso disponibles."));
    return;
  }
  const fragment = document.createDocumentFragment();
  result.courses.forEach(course => {
    const card = createElement("article", "teacher-course-recommendation");
    const actions = document.createElement("ul");
    card.append(createElement("h3", "", course.courseName));
    if (course.criticalTopic) card.append(createElement("p", "teacher-course-recommendation-topic", `Tema crítico: ${course.criticalTopic}`));
    course.actions.forEach(action => actions.append(createElement("li", "", action)));
    card.append(actions);
    fragment.append(card);
  });
  container.append(fragment);
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

function initials(name) {
  return String(name || "Profesor")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function renderTeacherAccountProfile(profile, courses) {
  const session = getInstitutionalSession();
  const account = session?.role === "TEACHER" ? session : {
    nombre: profile.nombre,
    username: "pcarlos",
    email: "carlos.perez@ubo.cl"
  };
  const container = $("#teacher-account-profile");
  const items = [
    ["Nombre", account.nombre],
    ["Usuario", account.username],
    ["Rol", "Profesor"],
    ["Correo", account.email || "No disponible"],
    ["Cursos asignados", courses.map(course => course.nombre).join(" · ") || "Sin cursos asignados"]
  ];
  const fragment = document.createDocumentFragment();
  items.forEach(([label, value]) => {
    const row = createElement("article", "teacher-account-item");
    row.append(createElement("span", "teacher-account-label", label), createElement("strong", "teacher-account-value", value));
    fragment.append(row);
  });
  container.replaceChildren(fragment);
  const avatar = $(".teacher-avatar");
  if (avatar) avatar.textContent = initials(account.nombre);
}

function renderTeacherDashboard() {
  const profile = getTeacherProfile();
  const day = currentDay();
  const assignedCourses = getAssignedCourses();
  const session = getInstitutionalSession();

  $("#teacher-title").textContent = session?.role === "TEACHER" ? session.nombre : profile.nombre;
  $("#teacher-department").textContent = `Departamento de ${profile.departamento || profile.department || "Sin departamento asignado"}`;
  $("#teacher-day").textContent = day;
  renderTeacherAccountProfile(profile, assignedCourses);
  renderSummary(getTeacherSummary(day));
  const dashboardSummary = getTeacherDashboardSummary({ teacherId: profile.id });
  const courseAnalytics = getTeacherCourseAnalytics({ teacherId: profile.id });
  renderCourses(assignedCourses, dashboardSummary.courses, courseAnalytics.courses);
  renderAcademicRisk(profile);
  renderCourseRecommendations(profile);
  renderRecentActivity(dashboardSummary.activity);
  renderActions(getFutureTeacherActions());
}

function setupDemoLogout() {
  document.getElementById("teacher-demo-logout")?.addEventListener("click", () => {
    clearCurrentDemoIdentity();
    clearInstitutionalSession();
    window.location.replace("../demo/demo-selector.html");
  });
}

function syncTeacherThemeButton() {
  const button = document.getElementById("teacher-theme-toggle");
  if (!button) return;
  const dark = getThemePreference() === "dark";
  button.firstChild.textContent = dark ? "Modo claro " : "Modo oscuro ";
  button.setAttribute("aria-pressed", String(dark));
}

function setupThemePreference() {
  syncTeacherThemeButton();
  document.getElementById("teacher-theme-toggle")?.addEventListener("click", () => {
    toggleThemePreference();
    syncTeacherThemeButton();
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

applyThemePreference();

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
  setupThemePreference();
}
