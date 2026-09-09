// Selector interno para usuarios demo del futuro ecosistema UBO.
// No se importa desde la aplicación actual ni reemplaza su autenticación.

import { demoUsers } from "../../data/users.js";
import { clearCurrentDemoIdentity, getCurrentDemoIdentity, setCurrentDemoIdentity } from "../../core/demo-identity-session.js";
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

  const identity = setCurrentDemoIdentity(user);
  return identity ? toDemoUser(user) : null;
}

export function getSelectedDemoUser() {
  const identity = getCurrentDemoIdentity();
  const user = demoUsers.find(item => item.id === identity?.id && item.role === identity?.role);
  return user ? toDemoUser(user) : null;
}

export function clearSelectedDemoUser() {
  clearCurrentDemoIdentity();
}
