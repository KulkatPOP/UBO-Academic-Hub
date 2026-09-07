// Servicio futuro de consulta para Emergencias UBO.
// Depende solo de la fuente DEMO y no modifica, persiste ni comunica emergencias.

import {
  getEmergencies as getInstitutionalEmergencies,
  getEmergencyById as getInstitutionalEmergencyById,
  getEmergenciesByType as getInstitutionalEmergenciesByType,
  getEmergenciesByStatus as getInstitutionalEmergenciesByStatus,
  getEmergenciesBySeverity as getInstitutionalEmergenciesBySeverity,
  getEmergenciesByLocation as getInstitutionalEmergenciesByLocation,
  getEmergenciesByReporter as getInstitutionalEmergenciesByReporter,
  getEmergencyStatistics as getInstitutionalEmergencyStatistics
} from "../data/university/emergencies.js";

export function getEmergencies() {
  return getInstitutionalEmergencies();
}

export function getEmergencyById(emergencyId) {
  if (!emergencyId) return null;
  return getInstitutionalEmergencyById(emergencyId);
}

export function getEmergenciesByType(type) {
  if (!type) return [];
  return getInstitutionalEmergenciesByType(type);
}

export function getEmergenciesByStatus(status) {
  if (!status) return [];
  return getInstitutionalEmergenciesByStatus(status);
}

export function getEmergenciesBySeverity(severity) {
  if (!severity) return [];
  return getInstitutionalEmergenciesBySeverity(severity);
}

export function getEmergenciesByLocation(location) {
  if (!location) return [];
  return getInstitutionalEmergenciesByLocation(location);
}

export function getEmergenciesByReporter(reporterId) {
  if (!reporterId) return [];
  return getInstitutionalEmergenciesByReporter(reporterId);
}

export function getEmergencyStatistics() {
  return getInstitutionalEmergencyStatistics();
}
