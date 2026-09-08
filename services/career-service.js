// Servicio canónico de solo lectura para carreras.
// Fuente DEMO -> mapping/adaptador -> CareerModel; no depende de interfaz ni sesión.

import { universityCareers } from "../data/university/careers.js";
import { adaptCareer } from "./adapters/career-adapter.js";

function copy(value) {
  return value ? { ...value } : value;
}

function adaptedCareers() {
  return universityCareers.map(source => adaptCareer(source));
}

export function getCareers() {
  return adaptedCareers()
    .filter(result => result.compatible)
    .map(result => copy(result.model));
}

export function getCareerById(careerId) {
  if (typeof careerId !== "string" || !careerId.trim()) return null;

  const result = adaptedCareers().find(item => item.model?.careerId === careerId) || null;
  return result?.compatible ? copy(result.model) : null;
}
