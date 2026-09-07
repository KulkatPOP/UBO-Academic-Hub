// Acciones futuras de Eventos UBO.
// Esta capa solo prepara y valida contextos en memoria; no ejecuta cambios.

import {
  getEventById,
  getAvailableEvents,
  getEventRegistrations,
  getEventRegistrationsByEvent
} from "../event-service.js";

const eventActions = [
  { type: "consult-availability", roles: ["STUDENT", "TEACHER", "ADMIN"], status: "available" },
  { type: "register-event", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "cancel-registration", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "manage-event-registrations", roles: ["ADMIN"], status: "requires-source" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionDefinition(type) {
  return eventActions.find(action => action.type === type) || null;
}

function actorFor(data = {}) {
  return data.actor && typeof data.actor === "object" ? data.actor : null;
}

function result(valid, action, warning = null, data = null) {
  return {
    valid,
    action: action ? clone(action) : null,
    warning,
    data: data ? clone(data) : null
  };
}

function validateActor(action, data) {
  const actor = actorFor(data);
  if (!actor?.id || !actor?.role) return "Debes indicar un actor demo con id y rol.";
  if (!action.roles.includes(actor.role)) return "El rol indicado no puede preparar esta acción.";
  return null;
}

function isAvailableEvent(eventId) {
  return getAvailableEvents().some(event => event.id === eventId);
}

function eventAvailabilityWarning(event) {
  if (!event) return "No se encontró el evento solicitado.";
  if (event.status === "cancelled") return "El evento está cancelado.";
  if (event.status === "finished") return "El evento ya finalizó.";
  if (!isAvailableEvent(event.id)) return "El evento no tiene cupos disponibles o no permite inscripción.";
  return null;
}

function validateOwnership(actor, userId) {
  return actor?.id === userId
    ? null
    : "La operación solo puede prepararse para el registro del propio usuario.";
}

export function getAvailableEventActions() {
  return clone(eventActions.filter(action => action.status === "available"));
}

export function validateEventAction(data = {}) {
  const action = actionDefinition(data.action);
  if (!action) return result(false, null, "La acción de Eventos no es válida.");

  const actorWarning = validateActor(action, data);
  if (actorWarning) return result(false, action, actorWarning);
  if (action.status !== "available") {
    return result(false, action, "La acción requiere una fuente administrativa antes de poder prepararse.");
  }

  const actor = actorFor(data);

  if (action.type === "consult-availability") {
    if (!data.eventId) return result(false, action, "Debes indicar eventId.");
    const event = getEventById(data.eventId);
    if (!event) return result(false, action, "No se encontró el evento solicitado.");
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      event,
      available: isAvailableEvent(event.id)
    });
  }

  if (action.type === "register-event") {
    if (!data.eventId) return result(false, action, "Debes indicar eventId.");
    if (!data.userId) return result(false, action, "Debes indicar userId.");
    const ownershipWarning = validateOwnership(actor, data.userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    const event = getEventById(data.eventId);
    const availabilityWarning = eventAvailabilityWarning(event);
    if (availabilityWarning) return result(false, action, availabilityWarning);
    const hasActiveRegistration = getEventRegistrationsByEvent(event.id)
      .some(registration => registration.userId === data.userId && registration.status === "registered");
    if (hasActiveRegistration) {
      return result(false, action, "Ya existe una inscripción activa para este evento y usuario.");
    }
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      event,
      userId: data.userId
    });
  }

  if (action.type === "cancel-registration") {
    if (!data.registrationId) return result(false, action, "Debes indicar registrationId.");
    const registration = getEventRegistrations()
      .find(item => item.id === data.registrationId);
    if (!registration) return result(false, action, "No se encontró la inscripción solicitada.");
    const ownershipWarning = validateOwnership(actor, registration.userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    const event = getEventById(registration.eventId);
    if (!event) return result(false, action, "No se encontró el evento asociado a la inscripción.");
    if (registration.status !== "registered") {
      return result(false, action, "Solo pueden prepararse cancelaciones de inscripciones activas.");
    }
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      registration,
      event
    });
  }

  return result(false, action, "La acción no tiene una preparación disponible.");
}

export function prepareEventAction(data = {}) {
  const validation = validateEventAction(data);
  return validation.valid ? { prepared: true, ...validation } : { prepared: false, ...validation };
}

export function prepareEventRegistration(data = {}) {
  return prepareEventAction({ ...data, action: "register-event" });
}

export function prepareRegistrationCancellation(data = {}) {
  return prepareEventAction({ ...data, action: "cancel-registration" });
}

export function prepareEventAvailability(data = {}) {
  return prepareEventAction({ ...data, action: "consult-availability" });
}
