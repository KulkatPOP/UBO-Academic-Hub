// DEVELOPMENT_ONLY: fixture aislado; no selecciona perfil, no escribe sesión ni navega.

import { observeCoreIdentityCanary } from "../../services/adapters/core-identity-canary-runtime.js";

const status = document.getElementById("core-identity-canary-status");
const result = await observeCoreIdentityCanary(
  { id: "teacher-carlos-perez", role: "TEACHER" },
  { enabled: true }
);

status.textContent = result.result;
