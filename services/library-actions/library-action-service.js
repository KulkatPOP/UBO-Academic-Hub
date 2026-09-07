// Acciones futuras de Biblioteca UBO.
// Esta capa solo prepara y valida contextos en memoria; no ejecuta cambios.

import {
  getBookById,
  getAvailableBooks,
  getReservations,
  getLoans
} from "../library-service.js";

const libraryActions = [
  { type: "consult-availability", roles: ["STUDENT", "TEACHER", "ADMIN"], status: "available" },
  { type: "reserve-book", roles: ["STUDENT"], status: "available" },
  { type: "cancel-reservation", roles: ["STUDENT"], status: "available" },
  { type: "request-loan", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "return-book", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "manage-library-availability", roles: ["ADMIN"], status: "requires-source" },
  { type: "manage-library-reservations", roles: ["ADMIN"], status: "requires-source" },
  { type: "manage-library-loans", roles: ["ADMIN"], status: "requires-source" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionDefinition(type) {
  return libraryActions.find(action => action.type === type) || null;
}

function actorFor(data = {}) {
  return data.actor && typeof data.actor === "object" ? data.actor : null;
}

function userIdFor(data = {}) {
  return data.studentId || data.userId || null;
}

function result(valid, action, warning = null, data = null) {
  return { valid, action: action ? clone(action) : null, warning, data: data ? clone(data) : null };
}

function validateActor(action, data) {
  const actor = actorFor(data);
  if (!actor?.id || !actor?.role) return "Debes indicar un actor demo con id y rol.";
  if (!action.roles.includes(actor.role)) return "El rol indicado no puede preparar esta acción.";
  return null;
}

function validateBookAvailability(book) {
  if (!book) return "No se encontró el libro solicitado.";
  if (!getAvailableBooks().some(item => item.id === book.id)) return "El libro no está disponible según los datos actuales.";
  return null;
}

function validateOwnership(actor, ownerId) {
  return actor?.id === ownerId ? null : "La operación solo puede prepararse para el registro del propio usuario.";
}

export function getAvailableLibraryActions() {
  return clone(libraryActions.filter(action => action.status === "available"));
}

export function validateLibraryAction(data = {}) {
  const action = actionDefinition(data.action);
  if (!action) return result(false, null, "La acción de Biblioteca no es válida.");

  const actorWarning = validateActor(action, data);
  if (actorWarning) return result(false, action, actorWarning);
  if (action.status !== "available") {
    return result(false, action, "La acción requiere una fuente administrativa antes de poder prepararse.");
  }

  const actor = actorFor(data);
  const userId = userIdFor(data);

  if (action.type === "consult-availability") {
    if (!data.bookId) return result(false, action, "Debes indicar bookId.");
    const book = getBookById(data.bookId);
    return book ? result(true, action, "Validación demo pendiente de autenticación institucional.", { book }) : result(false, action, "No se encontró el libro solicitado.");
  }

  if (action.type === "reserve-book") {
    if (!data.bookId) return result(false, action, "Debes indicar bookId.");
    if (!userId) return result(false, action, "Debes indicar studentId o userId.");
    const ownershipWarning = validateOwnership(actor, userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    const book = getBookById(data.bookId);
    if (!book) return result(false, action, "No se encontró el libro solicitado.");
    if (getReservations().some(item => item.bookId === book.id && item.studentId === userId && item.status === "active")) {
      return result(false, action, "Ya existe una reserva activa para este libro y usuario.");
    }
    const availabilityWarning = validateBookAvailability(book);
    if (availabilityWarning) return result(false, action, availabilityWarning);
    return result(true, action, "Validación demo pendiente de autenticación institucional.", { book, studentId: userId });
  }

  if (action.type === "cancel-reservation") {
    if (!data.reservationId) return result(false, action, "Debes indicar reservationId.");
    const reservation = getReservations().find(item => item.id === data.reservationId);
    if (!reservation) return result(false, action, "No se encontró la reserva solicitada.");
    const ownershipWarning = validateOwnership(actor, reservation.studentId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    if (reservation.status !== "active") return result(false, action, "Solo pueden prepararse cancelaciones de reservas activas.");
    return result(true, action, "Validación demo pendiente de autenticación institucional.", { reservation });
  }

  if (action.type === "request-loan") {
    if (!data.bookId) return result(false, action, "Debes indicar bookId.");
    if (!userId) return result(false, action, "Debes indicar userId.");
    const ownershipWarning = validateOwnership(actor, userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    const book = getBookById(data.bookId);
    const availabilityWarning = validateBookAvailability(book);
    if (availabilityWarning) return result(false, action, availabilityWarning);
    if (getLoans().some(item => item.bookId === book.id && item.userId === userId && item.status === "active")) {
      return result(false, action, "Ya existe un préstamo activo para este libro y usuario.");
    }
    return result(true, action, "Validación demo pendiente de autenticación institucional.", { book, userId });
  }

  if (action.type === "return-book") {
    if (!data.loanId) return result(false, action, "Debes indicar loanId.");
    const loan = getLoans().find(item => item.id === data.loanId);
    if (!loan) return result(false, action, "No se encontró el préstamo solicitado.");
    const ownershipWarning = validateOwnership(actor, loan.userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    if (loan.status !== "active") return result(false, action, "Solo pueden prepararse devoluciones de préstamos activos.");
    return result(true, action, "Validación demo pendiente de autenticación institucional.", { loan });
  }

  return result(false, action, "La acción no tiene una preparación disponible.");
}

export function prepareLibraryAction(data = {}) {
  const validation = validateLibraryAction(data);
  return validation.valid ? { prepared: true, ...validation } : { prepared: false, ...validation };
}

export function prepareBookReservation(data = {}) {
  return prepareLibraryAction({ ...data, action: "reserve-book" });
}

export function prepareReservationCancellation(data = {}) {
  return prepareLibraryAction({ ...data, action: "cancel-reservation" });
}

export function prepareLoanRequest(data = {}) {
  return prepareLibraryAction({ ...data, action: "request-loan" });
}

export function prepareBookReturn(data = {}) {
  return prepareLibraryAction({ ...data, action: "return-book" });
}
