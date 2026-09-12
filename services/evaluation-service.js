// Evaluaciones online demo locales. No reemplaza evaluaciones ni notas institucionales.

import { getCourseById, getCoursesByStudent } from "./course-service.js";
import { getStudentById, getStudentsByCourse } from "./student-service.js";
import { autoGradeEvaluation, selectQuestionsForEvaluation } from "./evaluation/question-bank-service.js";

export const DEMO_EVALUATIONS_STORAGE_KEY = "uboDemoEvaluations";
export const DEMO_SUBMISSIONS_STORAGE_KEY = "uboDemoSubmissions";
export const EVALUATION_TYPES = ["QUIZ", "DEVELOPMENT"];

const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === "string" ? value.trim() : "";

function resolveStorage(storage) { try { return storage || globalThis.localStorage || null; } catch { return storage || null; } }
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validEvaluation(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string" && typeof value.teacherId === "string"
    && typeof value.title === "string" && typeof value.description === "string" && EVALUATION_TYPES.includes(value.type)
    && validDate(value.dueDate) && Array.isArray(value.questions) && value.status === "PUBLISHED"
    && typeof value.createdAt === "string" && !Number.isNaN(new Date(value.createdAt).getTime()));
}
function validSubmission(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.evaluationId === "string" && typeof value.studentId === "string"
    && value.answers && typeof value.answers === "object" && typeof value.submittedAt === "string"
    && !Number.isNaN(new Date(value.submittedAt).getTime()) && ["SUBMITTED", "GRADED"].includes(value.status)
    && (value.grade === null || (Number.isFinite(value.grade) && value.grade >= 1 && value.grade <= 7))
    && (value.comment === undefined || typeof value.comment === "string"));
}
function read(key, validator, storage) {
  if (!storage) return { records: [], warning: "El almacenamiento local no está disponible." };
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { records: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido");
    const records = parsed.filter(validator);
    return { records, warning: records.length === parsed.length ? null : "Se ignoraron registros demo inválidos." };
  } catch { return { records: [], warning: "No se pudieron cargar los datos demo." }; }
}
function write(key, records, storage) {
  if (!storage) return { saved: false, warning: "El almacenamiento local no está disponible." };
  try { storage.setItem(key, JSON.stringify(records)); return { saved: true, warning: null }; }
  catch { return { saved: false, warning: "No fue posible guardar los datos demo en este dispositivo." }; }
}
function teacherOwnsCourse(identity, course) { return Boolean(identity?.role === "TEACHER" && identity.id && course?.professorId === identity.id); }
function id(prefix, records, now) {
  const stamp = new Date(now).getTime(); let number = 1; let value = `${prefix}-${stamp}-${number}`;
  while (records.some(record => record.id === value)) value = `${prefix}-${stamp}-${++number}`;
  return value;
}
function dueAt(evaluation) { return new Date(`${evaluation.dueDate}T23:59:59.999`); }
function isOpen(evaluation, now) { return evaluation.status === "PUBLISHED" && new Date(now) <= dueAt(evaluation); }
function defaultQuestions(type, description) {
  const prompt = text(description) || "Responde según las instrucciones de la evaluación demo.";
  return type === "QUIZ"
    ? [{ id: "question-1", prompt, kind: "CHOICE", options: ["Opción A", "Opción B", "Opción C"] }]
    : [{ id: "question-1", prompt, kind: "TEXT" }];
}

function questionForStudent(question) {
  const type = question.type || (question.kind === "CHOICE" ? "MULTIPLE_CHOICE" : "SHORT_ANSWER");
  const options = Array.isArray(question.options) ? question.options : [];
  return { id: question.id, type, question: question.question || question.prompt || "Pregunta demo", prompt: question.question || question.prompt || "Pregunta demo", options, kind: type === "SHORT_ANSWER" ? "TEXT" : "CHOICE", topic: question.topic || "Sin tema" };
}

function answerIsValid(question, answer) {
  const type = question.type || (question.kind === "CHOICE" ? "MULTIPLE_CHOICE" : "SHORT_ANSWER");
  if (type === "SHORT_ANSWER" || question.kind === "TEXT") return Boolean(text(answer));
  if (question.kind === "CHOICE" && (question.options || []).includes(answer)) return true;
  if (type === "TRUE_FALSE") return answer === "0" || answer === "1" || answer === "Verdadero" || answer === "Falso";
  return Number.isInteger(Number(answer)) && Number(answer) >= 0 && Number(answer) < (question.options || []).length;
}

export function getTeacherCourseEvaluations({ courseId, identity, storage } = {}) {
  const course = getCourseById(text(courseId));
  if (!course || !teacherOwnsCourse(identity, course)) return { allowed: false, evaluations: [], warning: course ? "No tienes autorización para gestionar evaluaciones de este curso." : "El curso indicado no existe." };
  const source = read(DEMO_EVALUATIONS_STORAGE_KEY, validEvaluation, resolveStorage(storage));
  const submissions = read(DEMO_SUBMISSIONS_STORAGE_KEY, validSubmission, resolveStorage(storage)).records;
  const evaluations = source.records.filter(item => item.courseId === course.id && item.teacherId === identity.id).map(item => clone({ ...item, submissionsCount: submissions.filter(submission => submission.evaluationId === item.id).length }));
  return { allowed: true, evaluations, warning: source.warning };
}

export function createEvaluation({ courseId, title, description = "", type, dueDate, questionIds = [], identity, storage, now = new Date().toISOString() } = {}) {
  const course = getCourseById(text(courseId)); const cleanTitle = text(title); const cleanDescription = text(description); const normalizedType = text(type).toUpperCase();
  if (!course) return { created: false, evaluation: null, errors: ["El curso indicado no existe."] };
  if (!teacherOwnsCourse(identity, course)) return { created: false, evaluation: null, errors: ["Solo el profesor asignado puede publicar evaluaciones en este curso."] };
  if (!cleanTitle) return { created: false, evaluation: null, errors: ["El título es obligatorio."] };
  if (cleanTitle.length > 120 || cleanDescription.length > 2000) return { created: false, evaluation: null, errors: ["El título o descripción excede la longitud permitida."] };
  if (!EVALUATION_TYPES.includes(normalizedType)) return { created: false, evaluation: null, errors: ["El tipo de evaluación no es válido."] };
  if (!validDate(dueDate)) return { created: false, evaluation: null, errors: ["La fecha límite no es válida."] };
  if (new Date(`${dueDate}T23:59:59.999`) <= new Date(now)) return { created: false, evaluation: null, errors: ["La fecha límite debe estar vigente."] };
  const targetStorage = resolveStorage(storage); const source = read(DEMO_EVALUATIONS_STORAGE_KEY, validEvaluation, targetStorage);
  const selected = Array.isArray(questionIds) && questionIds.length ? selectQuestionsForEvaluation({ courseId: course.id, questionIds, identity, storage: targetStorage }) : null;
  if (selected && !selected.allowed) return { created: false, evaluation: null, errors: [selected.warning] };
  const questions = selected ? selected.questions : defaultQuestions(normalizedType, cleanDescription);
  const evaluation = { id: id("evaluation", source.records, now), courseId: course.id, teacherId: identity.id, title: cleanTitle, description: cleanDescription, type: normalizedType, dueDate, questions, status: "PUBLISHED", createdAt: new Date(now).toISOString() };
  const persisted = write(DEMO_EVALUATIONS_STORAGE_KEY, [...source.records, evaluation], targetStorage);
  return persisted.saved ? { created: true, evaluation: clone(evaluation), errors: [] } : { created: false, evaluation: null, errors: [persisted.warning] };
}

export function getEvaluationSubmissions({ evaluationId, identity, storage } = {}) {
  const evaluations = read(DEMO_EVALUATIONS_STORAGE_KEY, validEvaluation, resolveStorage(storage));
  const evaluation = evaluations.records.find(item => item.id === text(evaluationId)); const course = evaluation && getCourseById(evaluation.courseId);
  if (!evaluation || !course) return { allowed: false, evaluation: null, submissions: [], warning: "La evaluación indicada no existe." };
  if (!teacherOwnsCourse(identity, course) || evaluation.teacherId !== identity.id) return { allowed: false, evaluation: null, submissions: [], warning: "No tienes autorización para revisar estas respuestas." };
  const submissions = read(DEMO_SUBMISSIONS_STORAGE_KEY, validSubmission, resolveStorage(storage)).records.filter(item => item.evaluationId === evaluation.id).map(item => clone(item));
  return { allowed: true, evaluation: clone(evaluation), submissions, warning: null };
}

export function getStudentEvaluations({ studentId, storage, now = new Date() } = {}) {
  const student = getStudentById(text(studentId));
  if (!student) return { available: false, evaluations: [], warning: "No se encontró el estudiante solicitado." };
  const allowedCourses = new Map(getCoursesByStudent(student.id).map(course => [course.id, course])); const source = read(DEMO_EVALUATIONS_STORAGE_KEY, validEvaluation, resolveStorage(storage)); const submissions = read(DEMO_SUBMISSIONS_STORAGE_KEY, validSubmission, resolveStorage(storage)).records;
  const evaluations = source.records.filter(item => allowedCourses.has(item.courseId)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(item => {
    const submission = submissions.find(record => record.evaluationId === item.id && record.studentId === student.id) || null;
    return clone({ ...item, questions: item.questions.map(questionForStudent), courseName: allowedCourses.get(item.courseId).nombre, open: isOpen(item, now), submission });
  });
  return { available: true, evaluations, warning: source.warning };
}

export function getStudentEvaluationById({ evaluationId, studentId, storage, now = new Date() } = {}) {
  const result = getStudentEvaluations({ studentId, storage, now });
  const evaluation = result.evaluations.find(item => item.id === text(evaluationId)) || null;
  return { available: result.available, evaluation, warning: evaluation ? result.warning : "La evaluación solicitada no existe o no está disponible para este estudiante." };
}

export function submitEvaluation({ evaluationId, studentId, answers, storage, now = new Date().toISOString() } = {}) {
  const access = getStudentEvaluationById({ evaluationId, studentId, storage, now });
  if (!access.evaluation) return { submitted: false, submission: null, errors: [access.warning] };
  if (!access.evaluation.open) return { submitted: false, submission: null, errors: ["Evaluación cerrada."] };
  if (access.evaluation.submission) return { submitted: false, submission: null, errors: ["Ya enviaste esta evaluación."] };
  const answerSet = answers && typeof answers === "object" ? answers : {};
  const normalized = {};
  for (const question of access.evaluation.questions) { const answer = text(answerSet[question.id]); if (!answer) return { submitted: false, submission: null, errors: ["Debes responder todas las preguntas."] }; if (!answerIsValid(question, answer)) return { submitted: false, submission: null, errors: ["Una respuesta seleccionada no es válida."] }; normalized[question.id] = answer; }
  const targetStorage = resolveStorage(storage); const source = read(DEMO_SUBMISSIONS_STORAGE_KEY, validSubmission, targetStorage);
  const storedEvaluation = read(DEMO_EVALUATIONS_STORAGE_KEY, validEvaluation, targetStorage).records.find(item => item.id === access.evaluation.id);
  const autoGrade = autoGradeEvaluation({ questions: storedEvaluation?.questions || [], answers: normalized });
  const submission = { id: id("submission", source.records, now), evaluationId: access.evaluation.id, studentId: text(studentId), answers: normalized, submittedAt: new Date(now).toISOString(), status: autoGrade.pendingReviewCount ? "SUBMITTED" : "GRADED", grade: autoGrade.pendingReviewCount ? null : autoGrade.grade, autoGrade, comment: "" };
  const persisted = write(DEMO_SUBMISSIONS_STORAGE_KEY, [...source.records, submission], targetStorage);
  return persisted.saved ? { submitted: true, submission: clone(submission), errors: [] } : { submitted: false, submission: null, errors: [persisted.warning] };
}

export function getEvaluationAutoGradeStatistics({ evaluationId, identity, storage } = {}) {
  const result = getEvaluationSubmissions({ evaluationId, identity, storage });
  if (!result.allowed) return { allowed: false, statistics: null, warning: result.warning };
  const questions = result.evaluation.questions;
  const graded = result.submissions.filter(submission => submission.autoGrade && typeof submission.autoGrade === "object");
  const averages = graded.map(submission => submission.autoGrade.grade).filter(value => Number.isFinite(value));
  const questionStats = questions.map(question => {
    const matches = graded.flatMap(submission => (submission.autoGrade.feedback || []).filter(item => item.questionId === question.id));
    const objective = matches.filter(item => item.correct !== null);
    const correct = objective.filter(item => item.correct).length;
    return { questionId: question.id, topic: question.topic || "Sin tema", question: question.question || question.prompt || "Pregunta demo", responses: matches.length, correctPercentage: objective.length ? Number(((correct / objective.length) * 100).toFixed(1)) : null };
  });
  const difficult = questionStats.filter(item => item.correctPercentage !== null).sort((a, b) => a.correctPercentage - b.correctPercentage || a.questionId.localeCompare(b.questionId));
  return { allowed: true, statistics: clone({ submissions: result.submissions.length, average: averages.length ? Number((averages.reduce((sum, value) => sum + value, 0) / averages.length).toFixed(1)) : null, difficultQuestions: difficult.slice(0, 3), weakTopics: [...new Set(difficult.filter(item => item.correctPercentage < 60).map(item => item.topic))] }), warning: null };
}

export function gradeEvaluationSubmission({ submissionId, grade, comment = "", identity, storage } = {}) {
  const targetStorage = resolveStorage(storage); const submissions = read(DEMO_SUBMISSIONS_STORAGE_KEY, validSubmission, targetStorage); const submission = submissions.records.find(item => item.id === text(submissionId));
  if (!submission) return { graded: false, submission: null, errors: ["La entrega seleccionada no existe."] };
  const evaluation = read(DEMO_EVALUATIONS_STORAGE_KEY, validEvaluation, targetStorage).records.find(item => item.id === submission.evaluationId); const course = evaluation && getCourseById(evaluation.courseId); const numericGrade = Number(String(grade).replace(",", "."));
  if (!evaluation || !course || !teacherOwnsCourse(identity, course) || evaluation.teacherId !== identity.id) return { graded: false, submission: null, errors: ["No tienes autorización para calificar esta entrega."] };
  if (!Number.isFinite(numericGrade) || numericGrade < 1 || numericGrade > 7) return { graded: false, submission: null, errors: ["La nota debe estar entre 1,0 y 7,0."] };
  const cleanComment = text(comment); if (cleanComment.length > 2000) return { graded: false, submission: null, errors: ["El comentario excede la longitud permitida."] };
  const updated = { ...submission, grade: Number(numericGrade.toFixed(1)), comment: cleanComment, status: "GRADED" }; const persisted = write(DEMO_SUBMISSIONS_STORAGE_KEY, submissions.records.map(item => item.id === updated.id ? updated : item), targetStorage);
  return persisted.saved ? { graded: true, submission: clone(updated), errors: [] } : { graded: false, submission: null, errors: [persisted.warning] };
}
