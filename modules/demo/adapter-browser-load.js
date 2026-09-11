// DEVELOPMENT_ONLY: no activa el canario ni modifica ningún flujo UBO.

const status = document.getElementById("adapter-browser-status");

try {
  await import("../../services/adapters/core-identity-adapter.js");
  status.textContent = "ADAPTER_BROWSER_LOAD_OK";
} catch {
  status.textContent = "ADAPTER_BROWSER_LOAD_REQUIRES_CORE";
}
