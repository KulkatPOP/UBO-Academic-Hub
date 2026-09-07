// Cursos institucionales demo.
// Fuente futura compartida para experiencias Student, Teacher y Admin.

export const universityCourses = [
  {
    id: "course-db-2026-1",
    codigo: "INF-302",
    nombre: "Bases de Datos",
    professorId: "teacher-carlos-perez",
    careerId: "career-informatica",
    studentIds: [
      "student-sofia-martinez",
      "student-antonio-gomez",
      "student-valentina-silva"
    ],
    roomId: "room-lab-302",
    scheduleIds: ["schedule-db-monday", "schedule-db-wednesday"],
    estado: "Activo"
  },
  {
    id: "course-iot-2026-1",
    codigo: "INF-415",
    nombre: "Programación IoT",
    professorId: "teacher-carlos-perez",
    careerId: "career-informatica",
    studentIds: [
      "student-sofia-martinez",
      "student-daniela-rios",
      "student-matias-ruiz"
    ],
    roomId: "room-204",
    scheduleIds: ["schedule-iot-tuesday", "schedule-iot-thursday"],
    estado: "Activo"
  }
];
