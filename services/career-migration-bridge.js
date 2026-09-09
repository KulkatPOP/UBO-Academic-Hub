// Puente read-only y reversible entre la carrera legacy y CareerModel del Core.
// El catálogo definitivo de estados REQUIERE APROBACIÓN INSTITUCIONAL.

import { uboCareerRepository } from "./adapters/core-career-repository-adapter.js";

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function copyCareer(career) {
  return career ? { ...career } : null;
}

// La dependencia institucional permanece en el adapter UBO → Core.
// El bridge no escribe ni conoce la fuente/mapping de carreras.
function readCanonicalCareers() {
  return uboCareerRepository.list();
}

function fallback(legacyName, warning = null) {
  return {
    usingCanonical: false,
    career: {
      careerId: null,
      name: legacyName,
      status: null
    },
    warning
  };
}

/**
 * Resuelve una carrera para consumo de lectura sin modificar el dato legacy.
 * careerReader es inyectable únicamente para pruebas controladas.
 */
export function resolveCareerReadOnly(legacyCareer, { enabled = false, careerReader = readCanonicalCareers } = {}) {
  const legacyName = text(legacyCareer);
  if (!enabled) return fallback(legacyName);
  if (!legacyName) return fallback(null, "CAREER CANONICAL UNAVAILABLE: falta carrera legacy.");

  let careers;
  try {
    careers = careerReader();
  } catch (error) {
    return fallback(legacyName, `CAREER CANONICAL UNAVAILABLE: ${error.message}`);
  }

  if (!Array.isArray(careers)) {
    return fallback(legacyName, "CAREER CANONICAL UNAVAILABLE: resultado de servicio inválido.");
  }

  const career = careers.find(item =>
    item && typeof item.careerId === "string" && text(item.name) === legacyName && text(item.status)
  );

  if (!career) {
    return fallback(legacyName, "CAREER CANONICAL UNAVAILABLE: mapping, adaptador o modelo no disponible.");
  }

  return {
    usingCanonical: true,
    career: copyCareer(career),
    warning: null
  };
}
