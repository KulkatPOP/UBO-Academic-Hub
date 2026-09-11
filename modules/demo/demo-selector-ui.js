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
  const container = $("#demo-users");
  const fragment = document.createDocumentFragment();
  getDemoUsers().forEach(user => {
    const meta = roleMeta[user.role] || roleMeta.STUDENT;
    const route = "Abrir experiencia demo";
    const card = document.createElement("article");
    const content = document.createElement("div");
    const button = document.createElement("button");
    const icon = document.createElement("span");
    card.className = "demo-user-card";
    icon.className = "demo-user-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = meta.icon;
    content.append(
      Object.assign(document.createElement("p"), { className: "demo-role", textContent: `${meta.label} · ${user.role}` }),
      Object.assign(document.createElement("h3"), { textContent: user.nombre }),
      Object.assign(document.createElement("span"), { textContent: user.email }),
      Object.assign(document.createElement("small"), { textContent: `Experiencia: ${user.experience}` })
    );
    button.type = "button";
    button.dataset.demoUser = user.id;
    button.append(route, Object.assign(document.createElement("i"), { textContent: "›" }));
    card.append(icon, content, button);
    fragment.append(card);
  });
  container.replaceChildren(fragment);
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
