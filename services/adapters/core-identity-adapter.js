// Adapter UBO experimental, puro y no conectado al flujo productivo.
// Traduce una identidad UBO ya resuelta al contrato genérico IdentitySnapshot.

import { createIdentitySnapshot } from "../../../UniEcosystemCore/core/identity-snapshot.js";
import {
  normalizeDemoIdentity,
  resolveLegacyStudentIdentity
} from "../../core/demo-identity-session.js";

function assertIdentityCandidate(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new TypeError("La identidad UBO debe ser un objeto válido o null.");
  }

  const normalized = normalizeDemoIdentity(candidate);
  if (!normalized) {
    throw new TypeError("La identidad UBO no corresponde a una pareja id/rol demo válida.");
  }

  return normalized;
}

/**
 * Convierte una identidad demo UBO ya resuelta en un IdentitySnapshot inmutable.
 * `null` representa únicamente la ausencia de identidad; una estructura presente
 * pero inválida se rechaza explícitamente para evitar elevación de privilegios.
 */
export function adaptUboIdentityToCoreSnapshot(candidate) {
  if (candidate === null) return null;

  const identity = assertIdentityCandidate(candidate);
  return createIdentitySnapshot({
    id: identity.id,
    roles: [identity.role]
  });
}

/**
 * Adaptación read-only de una sesión legacy ya proporcionada por el consumidor.
 * No lee almacenamiento ni modifica uboSession; solo reutiliza su resolución
 * existente de estudiante antes de delegar al contrato del Core.
 */
export function adaptLegacyStudentSessionToCoreSnapshot(legacySession) {
  const identity = resolveLegacyStudentIdentity(legacySession);
  return identity ? adaptUboIdentityToCoreSnapshot(identity) : null;
}

/**
 * Factory experimental de IdentityPort para pruebas aisladas.
 * El resolver se inyecta desde UBO: el Core nunca conoce la sesión, el router
 * ni las fuentes de identidad institucionales.
 */
export function createUboIdentityPort(resolveUboIdentity) {
  if (typeof resolveUboIdentity !== "function") {
    throw new TypeError("createUboIdentityPort requiere un resolver de identidad UBO.");
  }

  return Object.freeze({
    resolveIdentity() {
      return adaptUboIdentityToCoreSnapshot(resolveUboIdentity());
    }
  });
}
