// Acceso institucional simulado para los perfiles demo del ecosistema UBO.

import { authenticateDemoLogin } from "./demo-selector.js";
import { selectDemoRoute } from "./demo-router.js";
import { getCurrentSession } from "../../services/api/auth-api-service.js";

const $ = selector => document.querySelector(selector);

const backendSession = getCurrentSession();
if (backendSession?.source === "backend") {
  $("#institutional-login-form")?.querySelectorAll("input, button").forEach(control => { control.disabled = true; });
  $("#demo-selector-status").textContent = `Sesión backend activa para ${backendSession.name}. Cierra sesión para cambiar de perfil.`;
}

$("#institutional-login-form")?.addEventListener("submit", event => {
  event.preventDefault();

  if (getCurrentSession()?.source === "backend") {
    $("#demo-selector-status").textContent = "El perfil proviene de la sesión backend activa.";
    return;
  }

  const username = $("#institutional-username").value.trim().toLowerCase();
  const password = $("#institutional-password").value;
  const user = authenticateDemoLogin(username, password);

  if (!user) {
    $("#demo-selector-status").textContent = "Usuario o contraseña incorrectos";
    return;
  }

  const selection = selectDemoRoute(user.id);
  if (!selection) {
    $("#demo-selector-status").textContent = "No fue posible preparar el acceso institucional demo.";
    return;
  }

  $("#demo-selector-status").textContent = `Bienvenido, ${selection.user.nombre}.`;
  window.setTimeout(() => window.location.assign(selection.route.path), 180);
});
