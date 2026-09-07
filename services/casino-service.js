// Servicio futuro de consulta para Casino UBO.
// No depende de interfaz, sesión, almacenamiento, pagos ni operaciones de escritura.

import {
  getCasinoMenu,
  getCasinoMenuItemById,
  getAvailableCasinoItems,
  getCasinoHours as getInstitutionalCasinoHours,
  getCasinoOrders,
  getCasinoOrdersByUser,
  getCasinoConsumption,
  getCasinoConsumptionByUser,
  getCasinoStatistics as getInstitutionalCasinoStatistics
} from "../data/university/casino.js";

export function getMenu() {
  return getCasinoMenu();
}

export function getMenuItemById(itemId) {
  if (!itemId) return null;
  return getCasinoMenuItemById(itemId);
}

export function getAvailableMenuItems() {
  return getAvailableCasinoItems();
}

export function getCasinoHours() {
  return getInstitutionalCasinoHours();
}

export function getOrders() {
  return getCasinoOrders();
}

export function getOrdersByUser(userId) {
  if (!userId) return [];
  return getCasinoOrdersByUser(userId);
}

export function getConsumption() {
  return getCasinoConsumption();
}

export function getConsumptionByUser(userId) {
  if (!userId) return [];
  return getCasinoConsumptionByUser(userId);
}

export function getCasinoStatistics() {
  return getInstitutionalCasinoStatistics();
}
