// Acciones futuras de Pagos UBO.
// Esta capa prepara y valida operaciones demo en memoria; no procesa ni persiste transacciones.

import {
  getPayments,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentStatistics
} from "../payment-service.js";

const paymentActions = [
  { type: "consult-payment-status", roles: ["STUDENT", "TEACHER", "ADMIN"], status: "available" },
  { type: "consult-payment-statistics", roles: ["ADMIN"], status: "available" },
  { type: "prepare-payment", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "cancel-payment", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "retry-payment", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "manage-payments", roles: ["ADMIN"], status: "requires-source" }
];

const supportedMethods = ["card", "transfer", "other"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionDefinition(type) {
  return paymentActions.find(action => action.type === type) || null;
}

function actorFor(data = {}) {
  return data.actor && typeof data.actor === "object" ? data.actor : null;
}

function createResult(valid, action, warning = null, data = null) {
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

function isKnownPaymentUser(userId) {
  return getPayments().some(payment => payment.userId === userId);
}

function validateOwnership(actor, payment) {
  if (actor.role === "ADMIN") return null;
  return actor.id === payment.userId
    ? null
    : "La operación solo puede prepararse para el pago del propio usuario.";
}

function validatePaymentReference(data) {
  if (!data.paymentId) return { warning: "Debes indicar paymentId.", payment: null };
  const payment = getPaymentById(data.paymentId);
  return payment
    ? { warning: null, payment }
    : { warning: "No se encontró el pago solicitado.", payment: null };
}

function validateMethod(method) {
  return supportedMethods.includes(method)
    ? null
    : "Debes indicar un método demo válido: card, transfer u other.";
}

function preparePaymentData(data, actor) {
  if (!data.userId) return { warning: "Debes indicar userId.", payment: null };
  if (!isKnownPaymentUser(data.userId)) return { warning: "El usuario indicado no existe en los pagos demo.", payment: null };
  if (actor.id !== data.userId) return { warning: "La operación solo puede prepararse para el pago del propio usuario.", payment: null };
  if (!data.orderId) return { warning: "Debes indicar orderId.", payment: null };
  if (data.amount === "" || data.amount === null || data.amount === undefined || !Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) {
    return { warning: "Debes indicar un monto válido mayor que cero.", payment: null };
  }
  const methodWarning = validateMethod(data.method);
  if (methodWarning) return { warning: methodWarning, payment: null };

  const payment = getPaymentByOrderId(data.orderId);
  if (!payment) return { warning: "El pedido no tiene un pago demo asociado; requiere fuente institucional.", payment: null };
  if (payment.userId !== data.userId) return { warning: "El pago asociado no pertenece al usuario indicado.", payment: null };
  if (Number(data.amount) !== payment.amount) return { warning: "El monto solicitado no coincide con el pago demo asociado.", payment: null };
  if (data.method !== payment.method) return { warning: "El método indicado no coincide con el pago demo asociado.", payment: null };
  return { warning: null, payment };
}

export function getAvailablePaymentActions() {
  return clone(paymentActions.filter(action => action.status === "available"));
}

export function validatePaymentAction(data = {}) {
  const action = actionDefinition(data.action);
  if (!action) return createResult(false, null, "La acción de Pagos no es válida.");

  const actorWarning = validateActor(action, data);
  if (actorWarning) return createResult(false, action, actorWarning);
  if (action.status !== "available") {
    return createResult(false, action, "La acción requiere una fuente administrativa antes de poder prepararse.");
  }

  const actor = actorFor(data);

  if (action.type === "consult-payment-statistics") {
    return createResult(true, action, "Consulta demo pendiente de autenticación institucional.", {
      statistics: getPaymentStatistics()
    });
  }

  if (action.type === "consult-payment-status") {
    const reference = validatePaymentReference(data);
    if (reference.warning) return createResult(false, action, reference.warning);
    const ownershipWarning = validateOwnership(actor, reference.payment);
    if (ownershipWarning) return createResult(false, action, ownershipWarning);
    return createResult(true, action, "Consulta demo pendiente de autenticación institucional.", {
      payment: reference.payment
    });
  }

  if (action.type === "prepare-payment") {
    const prepared = preparePaymentData(data, actor);
    if (prepared.warning) return createResult(false, action, prepared.warning);
    if (prepared.payment.status === "paid") return createResult(false, action, "El pago demo ya se encuentra pagado.");
    if (prepared.payment.status === "failed") return createResult(false, action, "El pago demo fallido debe prepararse mediante reintento.");
    if (prepared.payment.status === "cancelled") return createResult(false, action, "El pago demo cancelado no puede prepararse como pago normal.");
    return createResult(true, action, "Preparación demo pendiente de una fuente transaccional institucional.", {
      payment: prepared.payment,
      requestedAmount: Number(data.amount),
      requestedMethod: data.method
    });
  }

  if (action.type === "cancel-payment") {
    const reference = validatePaymentReference(data);
    if (reference.warning) return createResult(false, action, reference.warning);
    const ownershipWarning = validateOwnership(actor, reference.payment);
    if (ownershipWarning) return createResult(false, action, ownershipWarning);
    if (reference.payment.status !== "pending") {
      return createResult(false, action, "Solo un pago demo pendiente puede prepararse para cancelación.");
    }
    return createResult(true, action, "Cancelación demo pendiente de una fuente transaccional institucional.", {
      payment: reference.payment
    });
  }

  if (action.type === "retry-payment") {
    const reference = validatePaymentReference(data);
    if (reference.warning) return createResult(false, action, reference.warning);
    const ownershipWarning = validateOwnership(actor, reference.payment);
    if (ownershipWarning) return createResult(false, action, ownershipWarning);
    if (reference.payment.status !== "failed") {
      return createResult(false, action, "Solo un pago demo fallido puede prepararse para reintento.");
    }
    return createResult(true, action, "Reintento demo pendiente de una fuente transaccional institucional.", {
      payment: reference.payment
    });
  }

  return createResult(false, action, "La acción no tiene una preparación disponible.");
}

export function preparePaymentAction(data = {}) {
  const validation = validatePaymentAction(data);
  return validation.valid ? { prepared: true, ...validation } : { prepared: false, ...validation };
}

export function preparePayment(data = {}) {
  return preparePaymentAction({ ...data, action: "prepare-payment" });
}

export function preparePaymentCancellation(data = {}) {
  return preparePaymentAction({ ...data, action: "cancel-payment" });
}

export function preparePaymentRetry(data = {}) {
  return preparePaymentAction({ ...data, action: "retry-payment" });
}
