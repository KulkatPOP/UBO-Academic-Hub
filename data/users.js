// Datos demo para el acceso institucional simulado y los roles UBO.
// No son credenciales reales ni se conectan a un backend.

const normalizeCredential = value => String(value || "").trim().toLocaleLowerCase("es-CL");

export function generateInstitutionalUsername({ nombre, role } = {}) {
  if (role === "ADMIN") return "admin";

  const parts = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  const [name = "", surname = ""] = parts;
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").toLocaleLowerCase("es-CL");

  return `${normalize(surname).charAt(0)}${normalize(name)}`;
}

export const demoUsers = [
  {
    id: "student-sofia-martinez",
    nombre: "Sofía Martínez Rojas",
    displayName: "Sofía Martínez",
    email: "sofia.martinez@pregrado.ubo.cl",
    displayEmail: "sofia.martinez@ubo.cl",
    username: "msofia",
    password: "123456",
    profile: "sofia",
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
    displayName: "Carlos Pérez",
    email: "carlos.perez@ubo.cl",
    displayEmail: "carlos.perez@ubo.cl",
    username: "pcarlos",
    password: "123456",
    profile: "carlos",
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
    displayName: "Administrador UBO",
    email: "administrador@ubo.cl",
    displayEmail: "administrador@ubo.cl",
    username: "admin",
    password: "admin123",
    profile: "admin",
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

export function findInstitutionalDemoUser(username, password) {
  const normalizedUsername = normalizeCredential(username);
  const normalizedPassword = String(password || "");

  return demoUsers.find(user => user.username === normalizedUsername && user.password === normalizedPassword) || null;
}

// Puente temporal: recupera el perfil demo una vez que la API ya autenticó la identidad.
export function getInstitutionalDemoUserByUsername(username) {
  const normalizedUsername = normalizeCredential(username);
  return demoUsers.find(user => user.username === normalizedUsername) || null;
}
