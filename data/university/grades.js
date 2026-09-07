// Datos futuros de evaluaciones y notas.
// Fuente demo aislada; aún no está conectada a las pantallas actuales.

export const universityEvaluations = [
  {
    id: "evaluation-db-model",
    courseId: "course-db-2026-1",
    title: "Modelo entidad-relación",
    percentage: 30,
    date: "2026-09-12",
    grades: [
      { studentId: "student-sofia-martinez", score: 6.2 },
      { studentId: "student-antonio-gomez", score: 5.4 },
      { studentId: "student-valentina-silva", score: 6.5 }
    ]
  },
  {
    id: "evaluation-db-sql",
    courseId: "course-db-2026-1",
    title: "Prueba SQL",
    percentage: 30,
    date: "2026-09-25",
    grades: [
      { studentId: "student-sofia-martinez", score: 5.8 },
      { studentId: "student-antonio-gomez", score: 4.9 },
      { studentId: "student-valentina-silva", score: 6.1 }
    ]
  },
  {
    id: "evaluation-iot-prototype",
    courseId: "course-iot-2026-1",
    title: "Prototipo de sensores",
    percentage: 40,
    date: "2026-09-30",
    grades: [
      { studentId: "student-sofia-martinez", score: 6.4 },
      { studentId: "student-daniela-rios", score: 5.7 },
      { studentId: "student-matias-ruiz", score: 5.9 }
    ]
  }
];
