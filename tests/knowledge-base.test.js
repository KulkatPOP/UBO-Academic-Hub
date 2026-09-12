import assert from "node:assert/strict";
import test from "node:test";
import { getKnowledgeBase, searchKnowledge } from "../services/ai/knowledge-base-service.js";
import { askAcademicTutor } from "../services/ai/academic-tutor-service.js";

function memoryStorage() { const data = new Map(); return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)) }; }
function tutorSources() {
  return {
    student: id => id === "student-a" ? { id, nombre: "Sofía Demo" } : null,
    courses: () => [{ id: "course-db-2026-1", nombre: "Bases de Datos" }],
    risk: () => ({ level: "LOW", metrics: { average: 6, attendance: 90 }, courses: [], warnings: [] }),
    materials: () => ({ materials: [] }),
    evaluations: () => ({ evaluations: [] }),
    knowledge: searchKnowledge
  };
}

test("busca por palabra, tema y devuelve copias seguras", () => {
  const results = searchKnowledge("¿Qué es una clave primaria?", "course-db-2026-1");
  assert.equal(results[0].id, "kb-db-002");
  assert.match(results[0].content, /identifica de manera única/i);
  results[0].title = "Alterado";
  assert.equal(searchKnowledge("clave primaria", "course-db-2026-1")[0].title, "Claves primarias");
  const snapshot = getKnowledgeBase();
  snapshot[0].content = "Alterado";
  assert.notEqual(getKnowledgeBase()[0].content, "Alterado");
});

test("restringe la recuperación al curso indicado", () => {
  const algebra = searchKnowledge("funciones", "course-algebra-2026-1");
  assert.ok(algebra.length > 0);
  assert.ok(algebra.every(item => item.courseId === "course-algebra-2026-1"));
  assert.equal(searchKnowledge("clave primaria", "course-algebra-2026-1").length, 0);
});

test("integra fuentes recuperadas al tutor y registra la cita", () => {
  const storage = memoryStorage();
  const result = askAcademicTutor({ studentId: "student-a", question: "¿Qué es una clave primaria?", storage, sources: tutorSources(), now: "2026-09-12T11:00:00.000Z" });
  assert.equal(result.answered, true);
  assert.match(result.response, /material del curso/i);
  assert.ok(result.sources.some(source => source.includes("Claves primarias")));
  assert.equal(JSON.parse(storage.getItem("uboDemoTutorHistory"))[0].sources.length > 0, true);
});

test("una pregunta sin recuperación no inventa una fuente", () => {
  const result = askAcademicTutor({ studentId: "student-a", question: "Explícame astronomía cuántica", storage: memoryStorage(), sources: tutorSources() });
  assert.equal(result.answered, true);
  assert.deepEqual(result.sources, []);
});
