// Servicio canónico de solo lectura para horarios.
// Conserva resultados controlados cuando falta información institucional.

import { universitySchedules } from "../data/university/schedules.js";
import { adaptSchedule } from "./adapters/schedule-adapter.js";

function copyResult(result) {
  return {
    compatible: result.compatible,
    model: result.model ? { ...result.model } : null,
    warning: result.warning ?? null
  };
}

function adaptedSchedules() {
  return universitySchedules.map(source => adaptSchedule(source));
}

/**
 * Retorna una lista de ScheduleModel válidos o resultados controlados.
 * Los horarios DEMO actuales carecen de status, por lo que se preserva la
 * advertencia REQUIERE FUENTE INSTITUCIONAL sin inventar dicho campo.
 */
export function getSchedules() {
  return adaptedSchedules().map(copyResult);
}

export function getScheduleById(scheduleId) {
  if (typeof scheduleId !== "string" || !scheduleId.trim()) return null;

  const source = universitySchedules.find(item => item.id === scheduleId || item.scheduleId === scheduleId);
  return source ? copyResult(adaptSchedule(source)) : null;
}
