// Banco reutilizable de preguntas DEMO. No modifica evaluaciones oficiales.

import { getCourseById } from "../course-service.js";

export const DEMO_QUESTION_BANK_STORAGE_KEY = "uboDemoQuestionBank";
export const QUESTION_TYPES = Object.freeze(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]);
export const QUESTION_DIFFICULTIES = Object.freeze(["LOW", "MEDIUM", "HIGH"]);

const clone = value => JSON.parse(JSON.stringify(value));
const clean = value => typeof value === "string" ? value.trim() : "";
function storageFor(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function teacherOwnsCourse(identity, course) { return Boolean(identity?.role === "TEACHER" && identity.id && course?.professorId === identity.id); }
function validQuestion(item) {
  return Boolean(item && typeof item.id === "string" && typeof item.courseId === "string" && typeof item.teacherId === "string"
    && QUESTION_TYPES.includes(item.type) && typeof item.question === "string" && item.question.length
    && Array.isArray(item.options) && QUESTION_DIFFICULTIES.includes(item.difficulty) && typeof item.topic === "string"
    && (item.type === "SHORT_ANSWER" ? item.correctAnswer === null : Number.isInteger(item.correctAnswer)));
}
function read(storage) {
  if (!storage) return { questions: [], warning: "El almacenamiento local no está disponible." };
  try {
    const parsed = JSON.parse(storage.getItem(DEMO_QUESTION_BANK_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido");
    const questions = parsed.filter(validQuestion);
    return { questions, warning: questions.length === parsed.length ? null : "Se ignoraron preguntas demo inválidas." };
  } catch { return { questions: [], warning: "No se pudo cargar el banco de preguntas demo." }; }
}
function write(questions, storage) { try { storage.setItem(DEMO_QUESTION_BANK_STORAGE_KEY, JSON.stringify(questions)); return true; } catch { return false; } }
function nextId(questions, now) { let number = 1; let value = `question-${new Date(now).getTime()}-${number}`; while (questions.some(question => question.id === value)) value = `question-${new Date(now).getTime()}-${++number}`; return value; }

export function getQuestionBank({ courseId, identity, storage } = {}) {
  const course = getCourseById(clean(courseId));
  if (!course || !teacherOwnsCourse(identity, course)) return { allowed: false, questions: [], warning: course ? "No tienes autorización para consultar este banco de preguntas." : "El curso indicado no existe." };
  const source = read(storageFor(storage));
  return { allowed: true, questions: source.questions.filter(question => question.courseId === course.id && question.teacherId === identity.id).map(clone), warning: source.warning };
}

export function createQuestion({ courseId, identity, type, question, options = [], correctAnswer = null, difficulty = "MEDIUM", topic = "Sin tema", storage, now = new Date().toISOString() } = {}) {
  const course = getCourseById(clean(courseId)); const normalizedType = clean(type).toUpperCase(); const normalizedDifficulty = clean(difficulty).toUpperCase(); const prompt = clean(question); const normalizedTopic = clean(topic) || "Sin tema";
  if (!course) return { created: false, question: null, errors: ["El curso indicado no existe."] };
  if (!teacherOwnsCourse(identity, course)) return { created: false, question: null, errors: ["Solo el profesor asignado puede crear preguntas para este curso."] };
  if (!QUESTION_TYPES.includes(normalizedType)) return { created: false, question: null, errors: ["El tipo de pregunta no es válido."] };
  if (!QUESTION_DIFFICULTIES.includes(normalizedDifficulty)) return { created: false, question: null, errors: ["La dificultad no es válida."] };
  if (!prompt || prompt.length > 1000) return { created: false, question: null, errors: ["El enunciado es obligatorio y no puede exceder 1000 caracteres."] };
  const normalizedOptions = normalizedType === "TRUE_FALSE" ? ["Verdadero", "Falso"] : normalizedType === "MULTIPLE_CHOICE" ? options.map(clean).filter(Boolean) : [];
  if (normalizedType === "MULTIPLE_CHOICE" && normalizedOptions.length < 2) return { created: false, question: null, errors: ["La pregunta de alternativa requiere al menos dos opciones."] };
  const answer = normalizedType === "SHORT_ANSWER" ? null : Number(correctAnswer);
  if (normalizedType !== "SHORT_ANSWER" && (!Number.isInteger(answer) || answer < 0 || answer >= normalizedOptions.length)) return { created: false, question: null, errors: ["Debes indicar una alternativa correcta válida."] };
  const target = storageFor(storage); const source = read(target); if (!target) return { created: false, question: null, errors: ["El almacenamiento local no está disponible."] };
  const record = { id: nextId(source.questions, now), courseId: course.id, teacherId: identity.id, type: normalizedType, question: prompt, options: normalizedOptions, correctAnswer: answer, difficulty: normalizedDifficulty, topic: normalizedTopic };
  if (!write([...source.questions, record], target)) return { created: false, question: null, errors: ["No fue posible guardar la pregunta demo."] };
  return { created: true, question: clone(record), errors: [] };
}

export function selectQuestionsForEvaluation({ courseId, questionIds, identity, storage } = {}) {
  const result = getQuestionBank({ courseId, identity, storage });
  if (!result.allowed) return { allowed: false, questions: [], warning: result.warning };
  const requested = Array.isArray(questionIds) ? [...new Set(questionIds.filter(id => typeof id === "string"))] : [];
  const map = new Map(result.questions.map(question => [question.id, question]));
  const missing = requested.filter(id => !map.has(id));
  if (missing.length) return { allowed: false, questions: [], warning: "Una o más preguntas seleccionadas no pertenecen al banco del curso." };
  return { allowed: true, questions: requested.map(id => clone(map.get(id))), warning: null };
}

export function autoGradeEvaluation({ questions, answers } = {}) {
  const validQuestions = Array.isArray(questions) ? questions.filter(validQuestion) : [];
  const answerSet = answers && typeof answers === "object" ? answers : {};
  const detail = validQuestions.map(question => {
    const answer = clean(answerSet[question.id]);
    if (question.type === "SHORT_ANSWER") return { questionId: question.id, topic: question.topic, status: "PENDING_REVIEW", correct: null, feedback: "Respuesta pendiente de revisión docente." };
    const selected = Number(answer);
    const correct = Number.isInteger(selected) && selected === question.correctAnswer;
    return { questionId: question.id, topic: question.topic, status: correct ? "CORRECT" : "INCORRECT", correct, feedback: correct ? "Buen dominio del contenido." : `Revisar material del tema: ${question.topic}.` };
  });
  const objective = detail.filter(item => item.correct !== null);
  const correctCount = objective.filter(item => item.correct).length;
  const percentage = objective.length ? Number(((correctCount / objective.length) * 100).toFixed(1)) : null;
  // Escala demo 1,0–7,0 redondeada a medio punto para facilitar lectura.
  const grade = objective.length ? Math.min(7, Math.max(1, Number((Math.round((1 + (correctCount / objective.length) * 6) * 2) / 2).toFixed(1)))) : null;
  const topicErrors = Object.values(detail.filter(item => item.correct === false).reduce((all, item) => { all[item.topic] = (all[item.topic] || 0) + 1; return all; }, {})).length;
  return clone({ grade, percentage, correctCount, objectiveCount: objective.length, pendingReviewCount: detail.filter(item => item.status === "PENDING_REVIEW").length, feedback: detail, topicErrors });
}
