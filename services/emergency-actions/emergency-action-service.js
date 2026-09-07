// Acciones futuras de Emergencias UBO.
// Esta capa solo valida y prepara objetos DEMO en memoria; no ejecuta coordinaciones ni comunicaciones reales.

import {
  getEmergencies,
  getEmergencyById
} from "../emergency-service.js";

const emergencyActions = [
  { type: "consult-emergency", roles: ["STUDENT", "TEACHER", "ADMIN"], status: "available" },
  { type: "report-emergency", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "acknowledge-emergency", roles: ["TEACHER", "ADMIN"], status: "available" },
  { type: "update-emergency-status", roles: ["ADMIN"], status: "available" },
  { type: "manage-emergency-response", roles: ["ADMIN"], status: "requires-source" }
];

const allowedTypes = ["medical", "accident", "fire", "security", "infrastructure", "general"];
const allowedSeverities = ["low", "medium", "high", "critical"];
const allowedStatuses = ["reported", "acknowledged", "in-progress", "resolved", "cancelled"];
const allowedTransitions = {
  reported: ["acknowledged", "cancelled"],
  acknowledged: ["in-progress", "cancelled"],
  "in-progress": ["resolved", "cancelled"],
  resolved: [],
  cancelled: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionDefinition(type) {
  return emergencyActions.find(action => action.type === type) || null;
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

function isKnownReporter(reporterId) {
  return getEmergencies().some(emergency => emergency.reportedBy === reporterId);
}

function validateUserId(userId) {
  return userId && isKnownReporter(userId)
    ? null
    : "El usuario indicado no existe en los reportes DEMO disponibles.";
}

function validateOwnership(actor, emergency) {
  if (actor.role === "ADMIN") return null;
  return actor.id === emergency.reportedBy
    ? null
    : "La operación solo puede prepararse para una emergencia reportada por el propio usuario.";
}

function validateEmergencyReference(emergencyId) {
  if (!emergencyId) return { warning: "Debes indicar emergencyId.", emergency: null };
  const emergency = getEmergencyById(emergencyId);
  return emergency
    ? { warning: null, emergency }
    : { warning: "No se encontró la emergencia solicitada.", emergency: null };
}

function validateReportData(data, actor) {
  if (!data.reporterId) return "Debes indicar reporterId.";
  const reporterWarning = validateUserId(data.reporterId);
  if (reporterWarning) return reporterWarning;
  if (actor.id !== data.reporterId) return "El reporte solo puede prepararse para el propio usuario.";
  if (!allowedTypes.includes(data.type)) return "Debes indicar un tipo de emergencia DEMO válido.";
  if (!allowedSeverities.includes(data.severity)) return "Debes indicar una severidad DEMO válida.";
  if (!String(data.location || "").trim()) return "Debes indicar una ubicación institucional DEMO.";
  if (!String(data.title || "").trim()) return "Debes indicar un título para el reporte DEMO.";
  if (!String(data.description || "").trim()) return "Debes indicar una descripción para el reporte DEMO.";
  return null;
}

export function getAvailableEmergencyActions() {
  return clone(emergencyActions.filter(action => action.status === "available"));
}

export function validateEmergencyAction(data = {}) {
  const action = actionDefinition(data.action);
  if (!action) return createResult(false, null, "La acción de Emergencias no es válida.");

  const actorWarning = validateActor(action, data);
  if (actorWarning) return createResult(false, action, actorWarning);
  if (action.status !== "available") {
    return createResult(false, action, "La acción requiere una fuente institucional adicional antes de poder prepararse.");
  }

  const actor = actorFor(data);

  if (action.type === "consult-emergency") {
    const reference = validateEmergencyReference(data.emergencyId);
    if (reference.warning) return createResult(false, action, reference.warning);
    const ownershipWarning = validateOwnership(actor, reference.emergency);
    if (ownershipWarning) return createResult(false, action, ownershipWarning);
    return createResult(true, action, "Consulta DEMO pendiente de autenticación institucional.", { emergency: reference.emergency });
  }

  if (action.type === "report-emergency") {
    const reportWarning = validateReportData(data, actor);
    if (reportWarning) return createResult(false, action, reportWarning);
    return createResult(true, action, "Reporte DEMO preparado sin persistencia ni comunicaciones externas.", {
      reporterId: data.reporterId,
      type: data.type,
      severity: data.severity,
      location: String(data.location).trim(),
      title: String(data.title).trim(),
      description: String(data.description).trim(),
      status: "reported"
    });
  }

  if (action.type === "acknowledge-emergency") {
    const userWarning = validateUserId(data.userId);
    if (userWarning) return createResult(false, action, userWarning);
    if (actor.id !== data.userId) return createResult(false, action, "La operación solo puede prepararse para el propio usuario.");
    const reference = validateEmergencyReference(data.emergencyId);
    if (reference.warning) return createResult(false, action, reference.warning);
    const ownershipWarning = validateOwnership(actor, reference.emergency);
    if (ownershipWarning) return createResult(false, action, ownershipWarning);
    if (reference.emergency.status !== "reported") {
      return createResult(false, action, "Solo una emergencia DEMO reportada puede prepararse para reconocimiento.");
    }
    return createResult(true, action, "Reconocimiento DEMO preparado sin cambiar el estado real.", {
      emergency: reference.emergency,
      userId: data.userId,
      proposedStatus: "acknowledged"
    });
  }

  if (action.type === "update-emergency-status") {
    const userWarning = validateUserId(data.userId);
    if (userWarning) return createResult(false, action, userWarning);
    if (actor.id !== data.userId) return createResult(false, action, "La operación solo puede prepararse para el propio usuario.");
    const reference = validateEmergencyReference(data.emergencyId);
    if (reference.warning) return createResult(false, action, reference.warning);
    if (!allowedStatuses.includes(data.newStatus)) {
      return createResult(false, action, "Debes indicar un estado DEMO válido.");
    }
    if (!allowedTransitions[reference.emergency.status].includes(data.newStatus)) {
      return createResult(false, action, "La transición de estado solicitada no puede prepararse con las reglas DEMO actuales.");
    }
    return createResult(true, action, "Actualización DEMO preparada sin cambiar el estado real.", {
      emergency: reference.emergency,
      userId: data.userId,
      proposedStatus: data.newStatus
    });
  }

  return createResult(false, action, "La acción no tiene una preparación disponible.");
}

export function prepareEmergencyAction(data = {}) {
  const validation = validateEmergencyAction(data);
  return validation.valid ? { prepared: true, ...validation } : { prepared: false, ...validation };
}

export function prepareEmergencyReport(data = {}) {
  return prepareEmergencyAction({ ...data, action: "report-emergency" });
}

export function prepareEmergencyAcknowledgement(data = {}) {
  return prepareEmergencyAction({ ...data, action: "acknowledge-emergency" });
}

export function prepareEmergencyStatusUpdate(data = {}) {
  return prepareEmergencyAction({ ...data, action: "update-emergency-status" });
}
