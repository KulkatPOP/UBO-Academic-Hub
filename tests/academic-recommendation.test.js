import assert from "node:assert/strict";
import test from "node:test";
import {
  generateAcademicRecommendations,
  getAcademicRecommendationsHistory,
  getInstitutionalAcademicRecommendations,
  getTeacherCourseRecommendations
} from "../services/recommendation/academic-recommendation-service.js";
import { askAcademicTutor } from "../services/ai/academic-tutor-service.js";

function storage() { const records = new Map(); return { getItem: key => records.has(key) ? records.get(key) : null, setItem: (key, value) => records.set(key, String(value)) }; }
function sources({ average = 4.5, attendance = 80, topics = ["Normalización"], level = "MEDIUM" } = {}) {
  return {
    student: id => ["student-a", "student-b"].includes(id) ? { id, nombre: "Sofía Demo" } : null,
    courses: () => [{ id: "course-db-2026-1", nombre: "Bases de Datos" }],
    risk: () => ({ available: true, level, metrics: { average, attendance, pendingEvaluations: 1 }, courses: [{ courseName: "Bases de Datos", level, reasons: [] }], warnings: [] }),
    evaluations: () => ({ evaluations: [{ submission: { autoGrade: { feedback: topics.map(topic => ({ correct: false, topic })) } } }] }),
    materials: () => ({ materials: [{ title: "Unidad 3" }] })
  };
}

test("recomienda reforzar rendimiento, asistencia y tema débil", () => {
  const result = generateAcademicRecommendations("student-a", { persist: false, sources: sources({ average: 3.8, attendance: 72 }) });
  assert.equal(result.available, true);
  assert.ok(result.recommendations.some(item => item.type === "LOW_PERFORMANCE"));
  assert.ok(result.recommendations.some(item => item.type === "LOW_ATTENDANCE"));
  assert.ok(result.recommendations.some(item => item.topic === "Normalización"));
});

test("reconoce una situación positiva y construye un plan", () => {
  const result = generateAcademicRecommendations("student-a", { persist: false, sources: sources({ average: 6.1, attendance: 92, topics: [], level: "LOW" }) });
  assert.ok(result.strengths.length > 0);
  assert.ok(result.recommendations.some(item => item.type === "GOOD_PERFORMANCE"));
  assert.equal(result.studyPlan.length, 3);
  assert.equal(result.studyPlan[0].day, "Día 1");
  assert.equal(result.studyPlan[1].resource, "Banco de preguntas");
});

test("incluye recursos del conocimiento para un tema con más de 50% de errores", () => {
  const result = generateAcademicRecommendations("student-a", { persist: false, sources: { ...sources(), knowledge: () => [{ id: "kb-1", title: "Unidad 3 - Normalización", topic: "Normalización", source: "Material Unidad 3" }] } });
  assert.equal(result.resources[0].title, "Unidad 3 - Normalización");
});

test("mantiene historial aislado por estudiante", () => {
  const memory = storage();
  generateAcademicRecommendations("student-a", { storage: memory, sources: sources(), now: "2026-09-12T12:00:00.000Z" });
  assert.equal(getAcademicRecommendationsHistory({ studentId: "student-a", storage: memory }).history.length, 1);
  assert.equal(getAcademicRecommendationsHistory({ studentId: "student-b", storage: memory }).history.length, 0);
});

test("el tutor utiliza recomendaciones para una pregunta de mejora", () => {
  const memory = storage();
  const recommendationResult = generateAcademicRecommendations("student-a", { storage: memory, persist: false, sources: sources({ average: 3.8, attendance: 90 }) });
  const tutorSources = { ...sources({ average: 3.8, attendance: 90 }), knowledge: () => [], recommendations: () => recommendationResult };
  const result = askAcademicTutor({ studentId: "student-a", question: "¿Cómo puedo mejorar?", storage: memory, sources: tutorSources });
  assert.equal(result.answered, true);
  assert.match(result.response, /reforzar contenidos fundamentales/i);
});

test("resume recomendaciones de curso e institución sin escribir fuentes", () => {
  const teacher = getTeacherCourseRecommendations({ teacherId: "teacher-a", sources: { teacherRisk: () => ({ available: true, courses: [{ courseId: "course-db-2026-1", courseName: "Bases de Datos", difficultQuestions: [{ topic: "Normalización" }], counts: { HIGH: 1 } }], warnings: [] }) } });
  assert.equal(teacher.courses[0].criticalTopic, "Normalización");
  assert.match(teacher.courses[0].actions[0], /actividad complementaria/i);
  const admin = getInstitutionalAcademicRecommendations({ sources: { institutionalRisk: () => ({ available: true, criticalCourses: [{ id: "course-db-2026-1", name: "Bases de Datos" }], warnings: [] }) } });
  assert.equal(admin.courses[0].name, "Bases de Datos");
});
