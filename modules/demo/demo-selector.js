// Selector interno para usuarios demo del futuro ecosistema UBO.
// No se importa desde la aplicación actual ni reemplaza su autenticación.

import { demoUsers, findInstitutionalDemoUser } from "../../data/users.js";
import { clearCurrentDemoIdentity, getCurrentDemoIdentity, setCurrentDemoIdentity } from "../../core/demo-identity-session.js";
import { getRolePermissions } from "../../core/permissions.js";
import { setInstitutionalSession } from "../../services/institutional-session-service.js";

const experienceByRole = {
  STUDENT: "Estudiante",
  TEACHER: "Profesor",
  ADMIN: "Administrador"
};

function toDemoUser(user) {
  const { password, ...publicUser } = user;
  return {
    ...publicUser,
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

export function authenticateDemoLogin(username, password) {
  const user = findInstitutionalDemoUser(username, password);
  if (!user) return null;

  const selectedUser = selectDemoUser(user.id);
  if (selectedUser) setInstitutionalSession(user);
  return selectedUser;
}

export function getSelectedDemoUser() {
  const identity = getCurrentDemoIdentity();
  const user = demoUsers.find(item => item.id === identity?.id && item.role === identity?.role);
  return user ? toDemoUser(user) : null;
}

export function clearSelectedDemoUser() {
  clearCurrentDemoIdentity();
}
