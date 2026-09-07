// Datos demo para el futuro sistema de usuarios y roles.
// Este módulo todavía no está conectado al login ni a la sesión actual.

export const demoUsers = [
  {
    id: "student-sofia-martinez",
    nombre: "Sofía Martínez Rojas",
    email: "sofia.martinez@pregrado.ubo.cl",
    role: "STUDENT",
    permissions: [
      "student.dashboard.read",
      "student.courses.read",
      "student.grades.read",
      "student.attendance.read",
      "student.simulators.use"
    ]
  },
  {
    id: "teacher-carlos-perez",
    nombre: "Carlos Pérez",
    email: "carlos.perez@ubo.cl",
    role: "TEACHER",
    department: "Ingeniería",
    permissions: [
      "teacher.dashboard.read",
      "teacher.courses.read",
      "teacher.students.read",
      "teacher.attendance.manage",
      "teacher.grades.manage",
      "teacher.materials.manage",
      "teacher.communication.manage"
    ]
  },
  {
    id: "admin-ubo",
    nombre: "Administrador UBO",
    email: "administrador@ubo.cl",
    role: "ADMIN",
    permissions: [
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
  }
];
