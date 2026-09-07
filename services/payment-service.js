// Servicio futuro de consulta para Pagos UBO.
// Depende solo de la fuente demo y no procesa, persiste ni modifica pagos.

import {
  getPayments as getInstitutionalPayments,
  getPaymentById as getInstitutionalPaymentById,
  getPaymentByOrderId as getInstitutionalPaymentByOrderId,
  getPaymentsByUser as getInstitutionalPaymentsByUser,
  getPendingPayments as getInstitutionalPendingPayments,
  getSuccessfulPayments as getInstitutionalSuccessfulPayments,
  getPaymentStatistics as getInstitutionalPaymentStatistics
} from "../data/university/payments.js";

export function getPayments() {
  return getInstitutionalPayments();
}

export function getPaymentById(paymentId) {
  if (!paymentId) return null;
  return getInstitutionalPaymentById(paymentId);
}

export function getPaymentByOrderId(orderId) {
  if (!orderId) return null;
  return getInstitutionalPaymentByOrderId(orderId);
}

export function getPaymentsByUser(userId) {
  if (!userId) return [];
  return getInstitutionalPaymentsByUser(userId);
}

export function getPendingPayments() {
  return getInstitutionalPendingPayments();
}

export function getSuccessfulPayments() {
  return getInstitutionalSuccessfulPayments();
}

export function getPaymentStatistics() {
  return getInstitutionalPaymentStatistics();
}
