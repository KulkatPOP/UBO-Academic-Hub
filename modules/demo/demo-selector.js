// Selector interno para usuarios demo del futuro ecosistema UBO.
// No se importa desde la aplicación actual ni reemplaza su autenticación.

import { demoUsers } from "../../data/users.js";
import { getCurrentUser, setCurrentUser } from "../../core/session.js";
import { getRolePermissions } from "../../core/permissions.js";

const experienceByRole = {
  STUDENT: "Estudiante",
  TEACHER: "Profesor",
  ADMIN: "Administrador"
};

function toDemoUser(user) {
  return {
    ...user,
    permissions: [...(user.permissions || getRolePermissions(user.role))],
    experience: experienceByRole[user.role] || "Sin experiencia asignada"
  };
}

export function getDemoUsers() {
  return demoUsers.map(toDemoUser);
}

export function selectDemoUser(userId) {
  const user = demoUsers.find(item => item.id === userId);

  if (!user) return null;

  return setCurrentUser(toDemoUser(user));
}

export function getSelectedDemoUser() {
  return getCurrentUser();
}
