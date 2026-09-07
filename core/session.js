// Futuro manejo de sesión y usuario activo.
// Esta sesión se mantiene en memoria y no reemplaza uboSession.

let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user ? { ...user, permissions: Array.isArray(user.permissions) ? [...user.permissions] : user.permissions } : null;
  return getCurrentUser();
}

export function getCurrentUser() {
  return currentUser ? { ...currentUser, permissions: Array.isArray(currentUser.permissions) ? [...currentUser.permissions] : currentUser.permissions } : null;
}

export function clearSession() {
  currentUser = null;
}
