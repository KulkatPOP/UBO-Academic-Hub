// Servicio futuro de consulta para Eventos UBO.
// No depende de interfaz, sesión, almacenamiento ni operaciones de escritura.

import {
  getEvents as getInstitutionalEvents,
  getEventById as getInstitutionalEventById,
  getUpcomingEvents as getInstitutionalUpcomingEvents,
  getAvailableEvents as getInstitutionalAvailableEvents,
  getEventRegistrations as getInstitutionalEventRegistrations,
  getEventRegistrationsByUser as getInstitutionalRegistrationsByUser,
  getEventStatistics as getInstitutionalEventStatistics
} from "../data/university/events.js";

export function getEvents() {
  return getInstitutionalEvents();
}

export function getEventById(eventId) {
  if (!eventId) return null;
  return getInstitutionalEventById(eventId);
}

export function getUpcomingEvents() {
  return getInstitutionalUpcomingEvents();
}

export function getAvailableEvents() {
  return getInstitutionalAvailableEvents();
}

export function getEventRegistrations() {
  return getInstitutionalEventRegistrations();
}

export function getEventRegistrationsByUser(userId) {
  if (!userId) return [];
  return getInstitutionalRegistrationsByUser(userId);
}

export function getEventRegistrationsByEvent(eventId) {
  if (!eventId) return [];
  return getInstitutionalEventRegistrations()
    .filter(registration => registration.eventId === eventId);
}

export function getEventStatistics() {
  return getInstitutionalEventStatistics();
}
