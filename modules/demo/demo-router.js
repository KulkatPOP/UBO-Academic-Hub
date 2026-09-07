// Rutas internas para el entorno demo del ecosistema UBO.
// No se integra con el router ni la navegación de la aplicación actual.

import { selectDemoUser } from "./demo-selector.js";

const demoRoutes = {
  STUDENT: {
    status: "available",
    path: "../../index.html",
    label: "Abrir aplicación estudiante actual"
  },
  TEACHER: {
    status: "available",
    path: "../professor/teacher-dashboard.html",
    label: "Abrir Panel Profesor demo"
  },
  ADMIN: {
    status: "available",
    path: "../admin/admin-dashboard.html",
    label: "Abrir Panel Administrativo demo"
  }
};

export function getDemoRoute(role) {
  const route = demoRoutes[role];
  return route ? { ...route } : null;
}

export function selectDemoRoute(userId) {
  const user = selectDemoUser(userId);
  const route = user ? getDemoRoute(user.role) : null;

  return user && route ? { user, route } : null;
}
