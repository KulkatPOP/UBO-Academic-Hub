import assert from "node:assert/strict";
import test from "node:test";
import {
  askAcademicTutor,
  buildStudentLearningContext,
  generateTutorResponse,
  getTutorHistory
} from "../services/ai/academic-tutor-service.js";

function memoryStorage() { const data = new Map(); return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)) }; }
function sources(level = "MEDIUM") {
  return {
    student: id => id === "student-a" ? { id, nombre: "Sofía Demo" } : null,
    courses: () => [{ id: "course-db", nombre: "Bases de Datos" }],
    risk: () => ({ available: true, level, metrics: { average: level === "LOW" ? 6 : 4.2, attendance: level === "HIGH" ? 72 : 90, trend: "ESTABLE" }, courses: [{ level, courseName: "Bases de Datos", reasons: level === "LOW" ? [] : ["Seguimiento demo"] }], warnings: [] }),
    materials: () => ({ materials: [{ courseId: "course-db", title: "Unidad 3", type: "PDF" }] }),
    evaluations: () => ({ evaluations: [{ courseId: "course-db", courseName: "Bases de Datos", open: true, submission: { autoGrade: { feedback: [{ correct: false, topic: "Normalización" }] } } }] })
  };
}

test("construye contexto académico con temas débiles y materiales", () => {
  const context = buildStudentLearningContext("student-a", { sources: sources() });
  assert.equal(context.available, true);
  assert.equal(context.student.name, "Sofía Demo");
  assert.deepEqual(context.weaknesses, ["Normalización", "Seguimiento demo"]);
  assert.equal(context.materials[0].title, "Unidad 3");
});

test("genera recomendaciones por rendimiento bajo y por buen rendimiento", () => {
  const high = buildStudentLearningContext("student-a", { sources: sources("HIGH") });
  const low = buildStudentLearningContext("student-a", { sources: sources("LOW") });
  assert.match(generateTutorResponse("¿Cómo voy en el ramo?", high).response, /actuar pronto/);
  assert.match(generateTutorResponse("¿Cómo voy en el ramo?", low).response, /positivo/);
  assert.match(generateTutorResponse("No entiendo normalización", high).response, /Normalización/);
});

test("guarda historial aislado por estudiante sin alterar contexto", () => {
  const storage = memoryStorage();
  const result = askAcademicTutor({ studentId: "student-a", question: "¿Qué debo estudiar?", storage, sources: sources(), now: "2026-09-12T10:00:00.000Z" });
  assert.equal(result.answered, true);
  assert.match(result.response, /Normalización/);
  assert.equal(getTutorHistory({ studentId: "student-a", storage }).history.length, 1);
  assert.equal(getTutorHistory({ studentId: "student-b", storage }).history.length, 0);
});

test("rechaza preguntas vacías sin guardar historial", () => {
  const storage = memoryStorage();
  const result = askAcademicTutor({ studentId: "student-a", question: "   ", storage, sources: sources() });
  assert.equal(result.answered, false);
  assert.match(result.errors[0], /Escribe una pregunta/);
  assert.equal(getTutorHistory({ studentId: "student-a", storage }).history.length, 0);
});
