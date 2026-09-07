// Interfaz aislada para probar los roles demo sin enlazar la aplicación principal.

import { getDemoUsers } from "./demo-selector.js";
import { selectDemoRoute } from "./demo-router.js";

const $ = selector => document.querySelector(selector);

const roleMeta = {
  STUDENT: { icon: "🎓", label: "Estudiante" },
  TEACHER: { icon: "◷", label: "Profesor" },
  ADMIN: { icon: "⚙", label: "Administrador" }
};

function renderDemoUsers() {
  $("#demo-users").innerHTML = getDemoUsers().map(user => {
    const meta = roleMeta[user.role] || roleMeta.STUDENT;
    const route = "Abrir experiencia demo";

    return `
      <article class="demo-user-card">
        <span class="demo-user-icon" aria-hidden="true">${meta.icon}</span>
        <div>
          <p class="demo-role">${meta.label} · ${user.role}</p>
          <h3>${user.nombre}</h3>
          <span>${user.email}</span>
          <small>Experiencia: ${user.experience}</small>
        </div>
        <button type="button" data-demo-user="${user.id}">${route}<i>›</i></button>
      </article>
    `;
  }).join("");
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-demo-user]");
  if (!button) return;

  const selection = selectDemoRoute(button.dataset.demoUser);
  if (!selection) return;

  if (selection.route.status === "planned") {
    $("#demo-selector-status").textContent = `La ruta ${selection.route.path} está preparada para ${selection.user.nombre}, pero su interfaz aún no se publica.`;
    return;
  }

  $("#demo-selector-status").textContent = `Abriendo experiencia ${selection.user.experience} para ${selection.user.nombre}.`;
  window.location.assign(selection.route.path);
});

renderDemoUsers();
