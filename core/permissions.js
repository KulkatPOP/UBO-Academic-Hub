// Futuro sistema de roles y permisos.
// No se conecta todavía al login ni a la navegación actual.

const rolePermissions = {
  STUDENT: [
    "student.dashboard.read",
    "student.courses.read",
    "student.grades.read",
    "student.attendance.read",
    "student.simulators.use"
  ],
  TEACHER: [
    "teacher.dashboard.read",
    "teacher.courses.read",
    "teacher.students.read",
    "teacher.attendance.manage",
    "teacher.grades.manage",
    "teacher.materials.manage",
    "teacher.communication.manage"
  ],
  ADMIN: [
    "admin.dashboard.read",
    "admin.users.manage",
    "admin.professors.manage",
    "admin.careers.manage",
    "admin.courses.manage",
    "admin.rooms.manage",
    "admin.schedules.manage",
    "admin.permissions.manage",
    "admin.analytics.read"
  ]
};

export function getRolePermissions(role) {
  return [...(rolePermissions[role] || [])];
}

export function hasRole(user, role) {
  return Boolean(user && role && user.role === role);
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false;

  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : getRolePermissions(user.role);

  return permissions.includes(permission);
}
