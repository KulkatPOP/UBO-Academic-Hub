// Guards de ruta para los shells demo Profesor/Admin.
// Son un control de ejecución frontend; no reemplazan autorización de servidor.

import { getCurrentDemoIdentity, normalizeDemoIdentity } from "./demo-identity-session.js";
import { hasRole } from "./permissions.js";

export function evaluateDemoRouteGuard(requiredRole, identity = getCurrentDemoIdentity()) {
  const normalizedIdentity = normalizeDemoIdentity(identity);
  if (!normalizedIdentity) {
    return { allowed: false, reason: identity ? "INVALID_IDENTITY" : "UNAUTHENTICATED", identity: null };
  }

  if (!hasRole(normalizedIdentity, requiredRole)) {
    return { allowed: false, reason: "ROLE_MISMATCH", identity: { ...normalizedIdentity } };
  }

  return { allowed: true, reason: "ALLOWED", identity: { ...normalizedIdentity } };
}

export function enforceDemoRouteGuard(requiredRole, redirects = {}) {
  const decision = evaluateDemoRouteGuard(requiredRole);
  if (decision.allowed || typeof window === "undefined") return decision;

  const redirect = redirects[decision.identity?.role] || redirects[decision.reason] || redirects.default || null;
  if (redirect && window.location.pathname !== new URL(redirect, window.location.href).pathname) {
    window.location.replace(redirect);
  }

  return { ...decision, redirect };
}
