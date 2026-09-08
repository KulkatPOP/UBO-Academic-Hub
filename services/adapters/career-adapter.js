// Adaptador puro hacia el contrato canónico CareerModel.
// Los estados institucionales definitivos REQUIEREN APROBACIÓN INSTITUCIONAL.

import { createCareerModel } from "../../data/models/career-model.js";
import { careerIdMap } from "../../data/mappings/careers-map.js";

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findMapping(source) {
  const name = text(source?.name) || text(source?.nombre) || text(source?.currentCareer);
  const sourceId = text(source?.careerId) || text(source?.id);

  return careerIdMap.find(entry =>
    (sourceId && entry.careerId === sourceId) ||
    (name && entry.currentCareer === name)
  ) || null;
}

function insufficient(reason) {
  return {
    compatible: false,
    model: null,
    warning: `REQUIERE FUENTE INSTITUCIONAL: ${reason}`
  };
}

/**
 * Convierte un snapshot legacy/DEMO a CareerModel sin mutar su entrada.
 * Devuelve un resultado controlado si faltan campos obligatorios canónicos.
 */
export function adaptCareer(source = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return insufficient("se requiere un snapshot de carrera válido.");
  }

  const mapping = findMapping(source);
  const careerId = text(source.careerId) || (mapping?.careerId ?? null);
  const name = text(source.name) || text(source.nombre) || mapping?.currentCareer || null;
  // Un estado explícito del snapshot tiene prioridad; el mapping es la única
  // fuente DEMO adicional aceptada para esta transición.
  const status = text(source.status) || mapping?.status || null;

  if (!careerId) return insufficient("no existe equivalencia de careerId.");
  if (!name) return insufficient("falta el nombre de la carrera.");
  if (!status) return insufficient("falta el estado de carrera.");

  return {
    compatible: true,
    model: createCareerModel({
      careerId,
      name,
      status,
      facultyId: text(source.facultyId) || text(source.facultad),
      degreeType: text(source.degreeType) || text(source.tipoTitulo)
    }),
    warning: null
  };
}
