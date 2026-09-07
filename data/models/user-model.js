// Modelo institucional futuro de usuario.
// Aislado de la autenticación y sesión actuales.

export function createUserModel({ id, name, email, role } = {}) {
  return {
    id: id || null,
    name: name || "",
    email: email || "",
    role: role || null
  };
}
