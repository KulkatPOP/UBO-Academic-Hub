// Acceso institucional simulado para los perfiles demo del ecosistema UBO.

import { authenticateDemoLogin } from "./demo-selector.js";
import { selectDemoRoute } from "./demo-router.js";

const $ = selector => document.querySelector(selector);

$("#institutional-login-form")?.addEventListener("submit", event => {
  event.preventDefault();

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
