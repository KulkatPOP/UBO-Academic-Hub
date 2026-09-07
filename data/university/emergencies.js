// Fuente institucional DEMO para Emergencias UBO.
// No representa incidentes reales ni activa comunicaciones, servicios externos o persistencia.

const emergencyRecords = [
  {
    id: "emergency-demo-001",
    title: "Atención preventiva en laboratorio demo",
    description: "Reporte demostrativo de una situación preventiva dentro de un laboratorio universitario.",
    type: "medical",
    severity: "high",
    status: "reported",
    location: "Laboratorio demo · Edificio de Ingeniería",
    reportedBy: "student-sofia-martinez",
    reportedAt: "2026-09-07T08:40:00-03:00",
    resolvedAt: null,
    contactType: "institutional-personnel",
    instructions: "Evitar acercarse al área afectada y seguir las instrucciones del personal autorizado."
  },
  {
    id: "emergency-demo-002",
    title: "Incidente de seguridad en acceso demo",
    description: "Reporte demostrativo de revisión preventiva en un acceso institucional.",
    type: "security",
    severity: "medium",
    status: "acknowledged",
    location: "Campus Central · Acceso principal demo",
    reportedBy: "teacher-carlos-perez",
    reportedAt: "2026-09-07T09:10:00-03:00",
    resolvedAt: null,
    contactType: "institutional-personnel",
    instructions: "Mantener distancia del área indicada y seguir la señalización institucional."
  },
  {
    id: "emergency-demo-003",
    title: "Revisión de infraestructura en biblioteca demo",
    description: "Caso demostrativo de mantención preventiva en un espacio de estudio.",
    type: "infrastructure",
    severity: "low",
    status: "in-progress",
    location: "Biblioteca demo · Sala de estudio",
    reportedBy: "admin-ubo",
    reportedAt: "2026-09-07T07:55:00-03:00",
    resolvedAt: null,
    contactType: "facility-team-demo",
    instructions: "Utilizar rutas alternativas y respetar los cierres preventivos señalizados."
  },
  {
    id: "emergency-demo-004",
    title: "Ejercicio de evacuación finalizado",
    description: "Registro demostrativo de un ejercicio preventivo de evacuación ya concluido.",
    type: "fire",
    severity: "critical",
    status: "resolved",
    location: "Patio Central demo",
    reportedBy: "admin-ubo",
    reportedAt: "2026-09-06T11:00:00-03:00",
    resolvedAt: "2026-09-06T11:35:00-03:00",
    contactType: "institutional-personnel",
    instructions: "Dirigirse al punto de encuentro indicado durante ejercicios preventivos."
  },
  {
    id: "emergency-demo-005",
    title: "Reporte general cancelado",
    description: "Reporte demostrativo cancelado después de una verificación preventiva.",
    type: "general",
    severity: "medium",
    status: "cancelled",
    location: "Casino demo · Área común",
    reportedBy: "student-sofia-martinez",
    reportedAt: "2026-09-05T13:20:00-03:00",
    resolvedAt: null,
    contactType: "institutional-personnel",
    instructions: "Seguir las instrucciones institucionales vigentes y evitar difundir información no confirmada."
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getEmergencies() {
  return clone(emergencyRecords);
}

export function getEmergencyById(emergencyId) {
  if (!emergencyId) return null;
  return clone(emergencyRecords.find(emergency => emergency.id === emergencyId) || null);
}

export function getEmergenciesByType(type) {
  if (!type) return [];
  return clone(emergencyRecords.filter(emergency => emergency.type === type));
}

export function getEmergenciesByStatus(status) {
  if (!status) return [];
  return clone(emergencyRecords.filter(emergency => emergency.status === status));
}

export function getEmergenciesBySeverity(severity) {
  if (!severity) return [];
  return clone(emergencyRecords.filter(emergency => emergency.severity === severity));
}

export function getEmergenciesByLocation(location) {
  if (!location) return [];
  return clone(emergencyRecords.filter(emergency => emergency.location === location));
}

export function getEmergenciesByReporter(reporterId) {
  if (!reporterId) return [];
  return clone(emergencyRecords.filter(emergency => emergency.reportedBy === reporterId));
}

export function getEmergencyStatistics() {
  return {
    total: emergencyRecords.length,
    reported: emergencyRecords.filter(emergency => emergency.status === "reported").length,
    acknowledged: emergencyRecords.filter(emergency => emergency.status === "acknowledged").length,
    inProgress: emergencyRecords.filter(emergency => emergency.status === "in-progress").length,
    resolved: emergencyRecords.filter(emergency => emergency.status === "resolved").length,
    cancelled: emergencyRecords.filter(emergency => emergency.status === "cancelled").length,
    critical: emergencyRecords.filter(emergency => emergency.severity === "critical").length,
    high: emergencyRecords.filter(emergency => emergency.severity === "high").length,
    medium: emergencyRecords.filter(emergency => emergency.severity === "medium").length,
    low: emergencyRecords.filter(emergency => emergency.severity === "low").length
  };
}
