// Adaptador puro hacia el contrato canónico ScheduleModel.
// El estado y período institucionales REQUIEREN APROBACIÓN INSTITUCIONAL.

import { createScheduleModel } from "../../data/models/schedule-model.js";

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function splitTimeRange(value) {
  const range = text(value);
  if (!range) return { startTime: null, endTime: null };

  const parts = range.split(/\s*-\s*/);
  return {
    startTime: text(parts[0]),
    endTime: text(parts[1])
  };
}

function insufficient(reason) {
  return {
    compatible: false,
    model: null,
    warning: `REQUIERE FUENTE INSTITUCIONAL: ${reason}`
  };
}

/**
 * Convierte un registro horario a ScheduleModel sin duplicar nombres de curso
 * o sala, ni inferir horarios inexistentes.
 */
export function adaptSchedule(source = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return insufficient("se requiere un snapshot de horario válido.");
  }

  const range = splitTimeRange(source.time || source.hora);
  const scheduleId = text(source.scheduleId) || text(source.id);
  const courseId = text(source.courseId);
  const roomId = text(source.roomId);
  const dayOfWeek = text(source.dayOfWeek) || text(source.day) || text(source.dia);
  const startTime = text(source.startTime) || range.startTime;
  const endTime = text(source.endTime) || range.endTime;
  const status = text(source.status);

  if (!scheduleId) return insufficient("falta scheduleId.");
  if (!courseId) return insufficient("falta courseId.");
  if (!roomId) return insufficient("falta roomId.");
  if (!dayOfWeek) return insufficient("falta dayOfWeek.");
  if (!startTime || !endTime) return insufficient("faltan startTime o endTime.");
  if (!status) return insufficient("falta el estado del horario.");

  try {
    return {
      compatible: true,
      model: createScheduleModel({
        scheduleId,
        courseId,
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        period: text(source.period) || text(source.periodo),
        status
      }),
      warning: null
    };
  } catch (error) {
    return insufficient(error.message);
  }
}
