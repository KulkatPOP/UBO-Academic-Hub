// Vista DEMO de Eventos UBO.
// Consulta el catálogo mediante event-service y prepara acciones solo en memoria.

import {
  getEvents,
  getEventById,
  getUpcomingEvents,
  getAvailableEvents,
  getEventRegistrations,
  getEventRegistrationsByUser,
  getEventStatistics
} from "../../../services/event-service.js";
import {
  getAvailableEventActions,
  prepareEventAvailability,
  prepareEventRegistration,
  prepareRegistrationCancellation
} from "../../../services/event-actions/event-action-service.js";

const $ = selector => document.querySelector(selector);
let activeFilter = "all";
let searchTerm = "";
let activeRole = "STUDENT";
let selectedEventId = null;

const demoActors = {
  STUDENT: { id: "student-sofia-martinez", role: "STUDENT" },
  TEACHER: { id: "teacher-carlos-perez", role: "TEACHER" },
  ADMIN: { id: "admin-ubo", role: "ADMIN" }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function activeActor() {
  return { ...demoActors[activeRole] };
}

function labelStatus(status) {
  return {
    upcoming: "Próximo",
    active: "Activo",
    finished: "Finalizado",
    cancelled: "Cancelado",
    registered: "Inscrito",
    cancelledRegistration: "Cancelada"
  }[status] || status;
}

function registrationStatusLabel(status) {
  return status === "cancelled" ? "Cancelada" : labelStatus(status);
}

function statusBadge(status, registration = false) {
  const label = registration ? registrationStatusLabel(status) : labelStatus(status);
  return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

function eventSpots(event) {
  return Math.max(0, event.capacity - event.registered);
}

function actionAvailable(type) {
  return getAvailableEventActions()
    .some(action => action.type === type && action.roles.includes(activeRole));
}

function setActionMessage(message, tone = "") {
  const target = $("#event-action-message");
  target.textContent = message;
  target.className = `action-message ${tone}`.trim();
}

function renderRoleStatus() {
  const available = getAvailableEventActions().filter(action => action.roles.includes(activeRole));
  const target = $("#role-actions-status");
  if (activeRole === "ADMIN") {
    target.innerHTML = `<b>${available.length} acción de consulta disponible.</b><span>Gestión administrativa: requiere fuente institucional.</span>`;
    return;
  }
  target.innerHTML = `<b>${available.length} acciones disponibles.</b><span>La validación no guarda cambios.</span>`;
}

function catalogSource() {
  if (activeFilter === "upcoming") return getUpcomingEvents();
  if (activeFilter === "available") return getAvailableEvents();
  return getEvents();
}

function matchesSearch(event) {
  const query = searchTerm.trim().toLocaleLowerCase("es-CL");
  if (!query) return true;
  return [event.title, event.description, event.type, event.location, event.organizer]
    .some(value => String(value).toLocaleLowerCase("es-CL").includes(query));
}

function renderStatistics() {
  const statistics = getEventStatistics();
  $("#stat-events").textContent = statistics.totalEvents;
  $("#stat-upcoming").textContent = statistics.upcomingEvents;
  $("#stat-active").textContent = statistics.activeEvents;
  $("#stat-registrations").textContent = statistics.totalRegistrations;
  $("#stat-spots").textContent = statistics.availableSpots;
}

function renderCatalog() {
  const events = catalogSource().filter(matchesSearch);
  const target = $("#event-results");
  if (!events.length) {
    target.innerHTML = `<p class="empty-state">No hay eventos para esta búsqueda o filtro.</p>`;
    return;
  }
  target.innerHTML = events.map(event => `
    <article class="event-card">
      <div class="event-card-top">
        <span class="event-type">${escapeHtml(event.type)}</span>
        ${statusBadge(event.status)}
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      <p class="event-description">${escapeHtml(event.description)}</p>
      <dl class="event-meta">
        <div><dt>Fecha</dt><dd>${escapeHtml(event.date)}</dd></div>
        <div><dt>Horario</dt><dd>${escapeHtml(event.startTime)} – ${escapeHtml(event.endTime)}</dd></div>
        <div><dt>Ubicación</dt><dd>${escapeHtml(event.location)}</dd></div>
        <div><dt>Organiza</dt><dd>${escapeHtml(event.organizer)}</dd></div>
      </dl>
      <div class="capacity-summary"><b>${escapeHtml(eventSpots(event))}</b> cupos disponibles · ${escapeHtml(event.registered)}/${escapeHtml(event.capacity)} inscritos</div>
      <button class="detail-button" type="button" data-event-id="${escapeHtml(event.id)}">Ver detalle <span aria-hidden="true">→</span></button>
    </article>
  `).join("");
}

function eventTitle(eventId) {
  return getEventById(eventId)?.title || "Evento no disponible";
}

function visibleRegistrations() {
  return activeRole === "ADMIN"
    ? getEventRegistrations()
    : getEventRegistrationsByUser(activeActor().id);
}

function renderRegistrations() {
  const registrations = visibleRegistrations();
  const target = $("#registration-list");
  $("#registrations-context").textContent = activeRole === "ADMIN"
    ? "Vista administrativa de solo lectura"
    : "Tus inscripciones demo";
  if (!registrations.length) {
    target.innerHTML = `<p class="empty-state">No hay inscripciones para el rol seleccionado.</p>`;
    return;
  }
  target.innerHTML = registrations.map(registration => `
    <article class="registration-item">
      <div>
        <h3>${escapeHtml(eventTitle(registration.eventId))}</h3>
        ${activeRole === "ADMIN" ? `<p>Usuario: ${escapeHtml(registration.userId)}</p>` : ""}
      </div>
      ${statusBadge(registration.status, true)}
      <dl>
        <div><dt>Inscripción</dt><dd>${escapeHtml(registration.registrationDate)}</dd></div>
      </dl>
      ${actionAvailable("cancel-registration") && registration.userId === activeActor().id && registration.status === "registered" ? `<button class="prepare-button secondary" type="button" data-event-action="cancel-registration" data-registration-id="${escapeHtml(registration.id)}">Cancelar inscripción</button>` : ""}
    </article>
  `).join("");
}

function detailActions(event) {
  const actions = [];
  if (actionAvailable("consult-availability")) {
    actions.push(`<button class="prepare-button secondary" type="button" data-event-action="consult-availability" data-event-id="${escapeHtml(event.id)}">Consultar disponibilidad</button>`);
  }
  if (actionAvailable("register-event") && getAvailableEvents().some(item => item.id === event.id)) {
    actions.push(`<button class="prepare-button" type="button" data-event-action="register-event" data-event-id="${escapeHtml(event.id)}">Inscribirse</button>`);
  }
  if (activeRole === "ADMIN") {
    actions.push(`<p class="requires-source">Gestión administrativa de inscripciones: requiere fuente institucional.</p>`);
  }
  return actions.length ? `<div class="detail-actions">${actions.join("")}</div>` : "";
}

function showEventDetail(eventId) {
  const event = getEventById(eventId);
  selectedEventId = eventId;
  const content = $("#event-detail-content");
  if (!event) {
    content.innerHTML = `<p class="empty-state">No se encontró el evento solicitado.</p>`;
  } else {
    content.innerHTML = `
      <p class="eyebrow">DETALLE DE EVENTO</p>
      <h2 id="event-detail-title">${escapeHtml(event.title)}</h2>
      <p class="dialog-description">${escapeHtml(event.description)}</p>
      ${statusBadge(event.status)}
      <dl class="detail-meta">
        <div><dt>Tipo</dt><dd>${escapeHtml(event.type)}</dd></div>
        <div><dt>Fecha</dt><dd>${escapeHtml(event.date)}</dd></div>
        <div><dt>Horario</dt><dd>${escapeHtml(event.startTime)} – ${escapeHtml(event.endTime)}</dd></div>
        <div><dt>Ubicación</dt><dd>${escapeHtml(event.location)}</dd></div>
        <div><dt>Organizador</dt><dd>${escapeHtml(event.organizer)}</dd></div>
        <div><dt>Capacidad</dt><dd>${escapeHtml(event.capacity)}</dd></div>
        <div><dt>Inscritos</dt><dd>${escapeHtml(event.registered)}</dd></div>
        <div><dt>Cupos disponibles</dt><dd>${escapeHtml(eventSpots(event))}</dd></div>
      </dl>
      ${detailActions(event)}
    `;
  }
  const dialog = $("#event-detail-dialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function prepareAction(action, dataset) {
  const actor = activeActor();
  if (action === "register-event") {
    return prepareEventRegistration({ actor, eventId: dataset.eventId, userId: actor.id });
  }
  if (action === "cancel-registration") {
    return prepareRegistrationCancellation({ actor, registrationId: dataset.registrationId });
  }
  return prepareEventAvailability({ actor, eventId: dataset.eventId });
}

function actionSuccessMessage(action) {
  return {
    "consult-availability": "Disponibilidad consultada correctamente.",
    "register-event": "Inscripción preparada correctamente.",
    "cancel-registration": "Cancelación preparada correctamente."
  }[action] || "Acción preparada correctamente.";
}

function handleActionButton(button) {
  const action = button.dataset.eventAction;
  const prepared = prepareAction(action, button.dataset);
  if (prepared.prepared) {
    setActionMessage(`${actionSuccessMessage(action)} La operación aún no se ha guardado.`, "success");
  } else {
    setActionMessage(prepared.warning || "No fue posible preparar la acción.", "error");
  }
}

function setupEvents() {
  $("#event-search").addEventListener("input", event => {
    searchTerm = event.target.value;
    renderCatalog();
  });
  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-event-filter]");
    if (filter) {
      activeFilter = filter.dataset.eventFilter;
      document.querySelectorAll("[data-event-filter]").forEach(button => button.classList.toggle("active", button === filter));
      renderCatalog();
      return;
    }
    const actionButton = event.target.closest("[data-event-action]");
    if (actionButton) {
      handleActionButton(actionButton);
      return;
    }
    const detail = event.target.closest("[data-event-id]");
    if (detail) showEventDetail(detail.dataset.eventId);
  });
  $("#event-role").addEventListener("change", event => {
    activeRole = event.target.value;
    renderRoleStatus();
    renderCatalog();
    renderRegistrations();
    if (selectedEventId && $("#event-detail-dialog").open) showEventDetail(selectedEventId);
    setActionMessage("");
  });
  $("#close-event-detail").addEventListener("click", () => $("#event-detail-dialog").close());
}

function init() {
  renderStatistics();
  renderCatalog();
  renderRegistrations();
  renderRoleStatus();
  setupEvents();
}

init();
