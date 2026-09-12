import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_QUESTION_BANK_STORAGE_KEY,
  autoGradeEvaluation,
  createQuestion,
  getQuestionBank,
  selectQuestionsForEvaluation
} from "../services/evaluation/question-bank-service.js";
import {
  createEvaluation,
  getEvaluationAutoGradeStatistics,
  getStudentEvaluationById,
  submitEvaluation
} from "../services/evaluation-service.js";

function memoryStorage() { const data = new Map(); return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)) }; }
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const courseId = "course-db-2026-1";

test("crea, selecciona y aísla preguntas del banco por curso", () => {
  const storage = memoryStorage();
  const created = createQuestion({ courseId, identity: teacher, type: "MULTIPLE_CHOICE", question: "¿Qué modelo reduce redundancia?", options: ["Plano", "Relacional", "Gráfico"], correctAnswer: 1, topic: "Normalización", storage, now: "2026-09-11T12:00:00.000Z" });
  assert.equal(created.created, true);
  assert.equal(getQuestionBank({ courseId, identity: teacher, storage }).questions.length, 1);
  assert.equal(selectQuestionsForEvaluation({ courseId, questionIds: [created.question.id], identity: teacher, storage }).allowed, true);
  assert.equal(selectQuestionsForEvaluation({ courseId: "course-iot-2026-1", questionIds: [created.question.id], identity: teacher, storage }).allowed, false);
  assert.ok(storage.getItem(DEMO_QUESTION_BANK_STORAGE_KEY));
});

test("corrige automáticamente objetivos y deja respuesta corta pendiente", () => {
  const result = autoGradeEvaluation({ questions: [
    { id: "q1", courseId, teacherId: teacher.id, type: "MULTIPLE_CHOICE", question: "Pregunta", options: ["A", "B"], correctAnswer: 1, difficulty: "MEDIUM", topic: "Tema A" },
    { id: "q2", courseId, teacherId: teacher.id, type: "TRUE_FALSE", question: "SQL consulta", options: ["Verdadero", "Falso"], correctAnswer: 0, difficulty: "LOW", topic: "Tema B" },
    { id: "q3", courseId, teacherId: teacher.id, type: "SHORT_ANSWER", question: "Explica", options: [], correctAnswer: null, difficulty: "HIGH", topic: "Tema C" }
  ], answers: { q1: "1", q2: "1", q3: "Texto" } });
  assert.equal(result.correctCount, 1);
  assert.equal(result.objectiveCount, 2);
  assert.equal(result.pendingReviewCount, 1);
  assert.equal(result.grade, 4);
  assert.match(result.feedback.find(item => item.questionId === "q2").feedback, /Revisar material/);
});

test("publica evaluación con banco, califica respuesta y expone estadísticas", () => {
  const storage = memoryStorage();
  const question = createQuestion({ courseId, identity: teacher, type: "TRUE_FALSE", question: "SQL es un lenguaje de consulta.", correctAnswer: 0, topic: "SQL", storage, now: "2026-09-11T12:00:00.000Z" }).question;
  const evaluation = createEvaluation({ courseId, title: "Quiz SQL", description: "Demo", type: "QUIZ", dueDate: "2026-12-01", questionIds: [question.id], identity: teacher, storage, now: "2026-09-11T12:00:00.000Z" });
  assert.equal(evaluation.created, true);
  const studentView = getStudentEvaluationById({ evaluationId: evaluation.evaluation.id, studentId: "student-sofia-martinez", storage, now: "2026-09-12T12:00:00.000Z" });
  assert.equal(studentView.evaluation.questions[0].correctAnswer, undefined);
  const submitted = submitEvaluation({ evaluationId: evaluation.evaluation.id, studentId: "student-sofia-martinez", answers: { [question.id]: "0" }, storage, now: "2026-09-12T12:00:00.000Z" });
  assert.equal(submitted.submitted, true);
  assert.equal(submitted.submission.autoGrade.grade, 7);
  assert.equal(submitEvaluation({ evaluationId: evaluation.evaluation.id, studentId: "student-sofia-martinez", answers: { [question.id]: "0" }, storage, now: "2026-09-12T12:00:00.000Z" }).submitted, false);
  const statistics = getEvaluationAutoGradeStatistics({ evaluationId: evaluation.evaluation.id, identity: teacher, storage });
  assert.equal(statistics.statistics.average, 7);
  assert.equal(statistics.statistics.difficultQuestions[0].correctPercentage, 100);
});
