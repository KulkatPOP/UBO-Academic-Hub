/**
 * La API Express solo existe en el entorno local del LMS DEMO. No hay una
 * URL pública confirmada: en hosts publicados los clientes deben conservar
 * sus fallbacks DEMO sin intentar acceder al localhost del visitante.
 */
export function getLocalApiBaseUrl({ locationRef = globalThis.location } = {}) {
  const hostname = String(locationRef?.hostname || "").toLowerCase();
  const isBrowser = Boolean(locationRef?.hostname);

  if (!isBrowser || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "http://localhost:3001";
  }

  return null;
}

export function canUseLocalApi(options = {}) {
  return Boolean(getLocalApiBaseUrl(options));
}
