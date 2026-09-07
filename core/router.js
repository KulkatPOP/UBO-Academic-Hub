// Futuro sistema centralizado de rutas por rol.
// No cambia window.location ni se conecta a la navegación actual.

import { hasPermission, hasRole } from "./permissions.js";
import { getCurrentUser } from "./session.js";

const roleRoutes = {
  STUDENT: {
    route: "student-dashboard",
    permission: "student.dashboard.read"
  },
  TEACHER: {
    route: "modules/professor/teacher-dashboard.html",
    permission: "teacher.dashboard.read"
  },
  ADMIN: {
    route: "modules/admin/admin-dashboard.html",
    permission: "admin.dashboard.read"
  }
};

function routeDefinition(route) {
  return Object.entries(roleRoutes).find(([, definition]) => definition.route === route) || null;
}

export function getAllowedRoute(role) {
  return roleRoutes[role]?.route || null;
}

export function canNavigate(route, user) {
  const match = routeDefinition(route);
  if (!match || !user) return false;

  const [role, definition] = match;
  return hasRole(user, role) && hasPermission(user, definition.permission);
}

// Devuelve la ruta futura autorizada. La navegación real se integrará después.
export function navigateByRole(user = getCurrentUser()) {
  const route = getAllowedRoute(user?.role);
  return route && canNavigate(route, user) ? route : null;
}
