import assert from "node:assert/strict";
import test from "node:test";
import {
  ACADEMIC_RISK_RECOMMENDATIONS,
  getInstitutionalAcademicRiskSummary,
  getStudentAcademicRisk,
  getTeacherAcademicRiskSummary
} from "../services/analytics/academic-risk-service.js";

const students = [
  { id: "student-high", nombre: "Alumna Riesgo Alto" },
  { id: "student-low", nombre: "Alumno Riesgo Bajo" }
];
const courses = [
  { id: "course-demo", nombre: "Curso demo", professorId: "teacher-demo", studentIds: students.map(student => student.id) }
];
const sourceData = {
  grades: [
    { id: "grade-high", studentId: "student-high", courseId: "course-demo", value: 3.8, createdAt: "2026-09-01T10:00:00.000Z" },
    { id: "grade-low-1", studentId: "student-low", courseId: "course-demo", value: 5.8, createdAt: "2026-09-01T10:00:00.000Z" },
    { id: "grade-low-2", studentId: "student-low", courseId: "course-demo", value: 6.1, createdAt: "2026-09-05T10:00:00.000Z" }
  ],
  attendance: [{ courseId: "course-demo", registered: 1, percentage: 90 }],
  evaluations: []
};

function sourcesFor(studentId) {
  return {
    student: id => students.find(student => student.id === id) || null,
    students: () => students,
    courses: () => courses,
    coursesByStudent: id => courses.filter(course => course.studentIds.includes(id)),
    coursesByProfessor: id => courses.filter(course => course.professorId === id),
    studentsByCourse: id => courses.find(course => course.id === id)?.studentIds.map(studentId => students.find(student => student.id === studentId)) || [],
    grades: ({ studentId: id }) => ({ grades: sourceData.grades.filter(grade => grade.studentId === id) }),
    attendance: () => ({ courses: sourceData.attendance }),
    evaluations: ({ studentId: id }) => ({ evaluations: sourceData.evaluations.filter(evaluation => evaluation.studentId === undefined || evaluation.studentId === id) })
  };
}

test("identifica riesgo alto por promedio demo bajo sin modificar fuentes", () => {
  const before = JSON.stringify(sourceData);
  const result = getStudentAcademicRisk({ studentId: "student-high", sources: sourcesFor("student-high") });
  assert.equal(result.available, true);
  assert.equal(result.level, "HIGH");
  assert.equal(result.metrics.average, 3.8);
  assert.equal(result.recommendation, ACADEMIC_RISK_RECOMMENDATIONS.HIGH);
  assert.match(result.reasons.join(" "), /bajo 4,0/);
  assert.equal(JSON.stringify(sourceData), before);
});

test("identifica rendimiento bajo cuando promedio y asistencia cumplen los umbrales", () => {
  const result = getStudentAcademicRisk({ studentId: "student-low", sources: sourcesFor("student-low") });
  assert.equal(result.level, "LOW");
  assert.equal(result.metrics.average, 5.9);
  assert.equal(result.metrics.attendance, 90);
  assert.equal(result.metrics.trend, "EN_MEJORA");
});

test("eleva a riesgo alto con asistencia baja o dos evaluaciones pendientes", () => {
  const lowAttendance = sourcesFor("student-low");
  lowAttendance.attendance = () => ({ courses: [{ courseId: "course-demo", registered: 1, percentage: 72 }] });
  assert.equal(getStudentAcademicRisk({ studentId: "student-low", sources: lowAttendance }).level, "HIGH");

  const pending = sourcesFor("student-low");
  pending.evaluations = () => ({ evaluations: [{ courseId: "course-demo", open: true, submission: null }, { courseId: "course-demo", open: true, submission: null }] });
  assert.equal(getStudentAcademicRisk({ studentId: "student-low", sources: pending }).level, "HIGH");
});

test("compone seguimiento docente e institucional sin escribir datos", () => {
  const readers = sourcesFor();
  const teacher = getTeacherAcademicRiskSummary({ teacherId: "teacher-demo", sources: readers });
  assert.equal(teacher.available, true);
  assert.equal(teacher.courses[0].counts.HIGH, 1);
  assert.equal(teacher.courses[0].counts.LOW, 1);
  const institution = getInstitutionalAcademicRiskSummary({ sources: readers });
  assert.equal(institution.metrics.studentsAnalyzed, 2);
  assert.equal(institution.metrics.counts.HIGH, 1);
  assert.equal(institution.metrics.counts.LOW, 1);
});
