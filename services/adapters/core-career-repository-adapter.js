// Adapter institucional UBO read-only hacia los contratos genéricos del Core.

import { createCareerModel } from "../../../UniEcosystemCore/data/models/career-model.js";
import { careerIdMap } from "../../data/mappings/careers-map.js";
import { universityCareers } from "../../data/university/careers.js";

function requiredText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} debe ser un string no vacío.`);
  }

  return value.trim();
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldName} debe ser un array.`);
  }
}

function copyCareer(career) {
  return { ...career };
}

function resolveCareer(sourceCareer, mappings) {
  if (!sourceCareer || typeof sourceCareer !== "object" || Array.isArray(sourceCareer)) {
    throw new TypeError("career source contiene un registro inválido.");
  }

  const sourceId = requiredText(sourceCareer.id, "career source.id");
  const sourceName = requiredText(sourceCareer.nombre, "career source.nombre");
  const mapping = mappings.find((entry) =>
    entry &&
    entry.careerId === sourceId &&
    entry.currentCareer === sourceName
  );

  if (!mapping) {
    throw new TypeError(`No existe mapping Career aprobado para ${sourceId}.`);
  }

  return Object.freeze(createCareerModel({
    careerId: requiredText(mapping.careerId, "career mapping.careerId"),
    name: requiredText(mapping.currentCareer, "career mapping.currentCareer"),
    status: requiredText(mapping.status, "career mapping.status")
  }));
}

/**
 * Implementa RepositoryPort con una fuente UBO inyectable y un snapshot interno.
 * Los datos inválidos se rechazan con TypeError; un ID no encontrado devuelve null.
 */
export function createUboCareerRepository({ source = universityCareers, mappings = careerIdMap } = {}) {
  assertArray(source, "career source");
  assertArray(mappings, "career mappings");

  const careers = Object.freeze(source.map((career) => resolveCareer(career, mappings)));

  return Object.freeze({
    list() {
      return careers.map(copyCareer);
    },

    getById(careerId) {
      if (typeof careerId !== "string" || careerId.trim() === "") return null;

      const career = careers.find((item) => item.careerId === careerId.trim());
      return career ? copyCareer(career) : null;
    }
  });
}

export const uboCareerRepository = createUboCareerRepository();
