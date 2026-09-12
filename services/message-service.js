// Mensajería institucional demo local entre Profesor y Student.
// No sustituye avisos, datos académicos ni una plataforma de comunicación real.

import { getCourseById, getCoursesByStudent } from "./course-service.js";
import { getStudentById, getStudentsByCourse } from "./student-service.js";

export const DEMO_MESSAGES_STORAGE_KEY = "uboDemoMessages";

const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === "string" ? value.trim() : "";

function storageFor(storage) {
  try { return storage || globalThis.localStorage || null; } catch { return storage || null; }
}

function validRecord(value) {
  return Boolean(value && typeof value.id === "string" && typeof value.courseId === "string"
    && typeof value.senderId === "string" && value.senderRole === "TEACHER"
    && typeof value.receiverId === "string" && typeof value.subject === "string"
    && typeof value.message === "string" && typeof value.createdAt === "string"
    && !Number.isNaN(new Date(value.createdAt).getTime()) && typeof value.read === "boolean");
}

function read(storage) {
  if (!storage) return { messages: [], warning: "El almacenamiento local no está disponible." };
  try {
    const raw = storage.getItem(DEMO_MESSAGES_STORAGE_KEY);
    if (raw === null) return { messages: [], warning: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("Formato inválido.");
    const messages = parsed.filter(validRecord);
    return { messages, warning: messages.length === parsed.length ? null : "Se ignoraron mensajes demo inválidos." };
  } catch { return { messages: [], warning: "No se pudieron cargar los mensajes demo." }; }
}

function write(messages, storage) {
  if (!storage) return { saved: false, warning: "El almacenamiento local no está disponible." };
  try { storage.setItem(DEMO_MESSAGES_STORAGE_KEY, JSON.stringify(messages)); return { saved: true, warning: null }; }
  catch { return { saved: false, warning: "No fue posible guardar el mensaje demo en este dispositivo." }; }
}

function nextId(messages, now) {
  const stamp = new Date(now).getTime();
  let sequence = 1;
  let id = `message-${stamp}-${sequence}`;
  while (messages.some(message => message.id === id)) id = `message-${stamp}-${++sequence}`;
  return id;
}

function isTeacherForCourse(identity, course) {
  return Boolean(identity && identity.role === "TEACHER" && identity.id && course && course.professorId === identity.id);
}

function enrolled(studentId, courseId) {
  return getCoursesByStudent(studentId).some(course => course.id === courseId);
}

export function getCourseMessages({ courseId, identity, storage } = {}) {
  const course = getCourseById(text(courseId));
  if (!course || !isTeacherForCourse(identity, course)) return { allowed: false, messages: [], warning: course ? "No tienes autorización para ver los mensajes de este curso." : "El curso indicado no existe." };
  const source = read(storageFor(storage));
  const messages = source.messages.filter(message => message.courseId === course.id && message.senderId === identity.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  return { allowed: true, messages: messages.map(clone), warning: source.warning };
}

export function sendCourseMessage({ courseId, subject, message, identity, now = new Date(), storage } = {}) {
  const course = getCourseById(text(courseId));
  const cleanSubject = text(subject);
  const cleanMessage = text(message);
  if (!course) return { sent: false, messages: [], errors: ["El curso indicado no existe."] };
  if (!isTeacherForCourse(identity, course)) return { sent: false, messages: [], errors: ["Solo el profesor asignado puede enviar mensajes a este curso."] };
  if (!cleanSubject) return { sent: false, messages: [], errors: ["El asunto es obligatorio."] };
  if (!cleanMessage) return { sent: false, messages: [], errors: ["El mensaje es obligatorio."] };
  if (cleanSubject.length > 120 || cleanMessage.length > 2000) return { sent: false, messages: [], errors: ["El asunto o mensaje excede la longitud permitida."] };
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) return { sent: false, messages: [], errors: ["No se pudo crear el mensaje demo."] };
  const targetStorage = storageFor(storage);
  const source = read(targetStorage);
  const recipients = getStudentsByCourse(course.id);
  if (!recipients.length) return { sent: false, messages: [], errors: ["El curso no tiene estudiantes inscritos."] };
  const messages = recipients.map((student, index) => ({
    id: nextId([...source.messages, ...recipients.slice(0, index)], new Date(date.getTime() + index)),
    courseId: course.id,
    senderId: identity.id,
    senderRole: "TEACHER",
    receiverId: student.id,
    subject: cleanSubject,
    message: cleanMessage,
    createdAt: new Date(date.getTime() + index).toISOString(),
    read: false
  }));
  const persisted = write([...source.messages, ...messages], targetStorage);
  return persisted.saved
    ? { sent: true, messages: messages.map(clone), errors: [], warning: source.warning }
    : { sent: false, messages: [], errors: [persisted.warning] };
}

export function getStudentMessages({ studentId, storage } = {}) {
  const student = getStudentById(text(studentId));
  if (!student) return { available: false, messages: [], warning: "No se encontró el estudiante solicitado." };
  const source = read(storageFor(storage));
  const messages = source.messages.filter(message => message.receiverId === student.id && enrolled(student.id, message.courseId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  return { available: true, messages: messages.map(clone), warning: source.warning };
}

export function getStudentMessageById({ messageId, studentId, storage } = {}) {
  const result = getStudentMessages({ studentId, storage });
  if (!result.available) return { available: false, message: null, warning: result.warning };
  const message = result.messages.find(item => item.id === text(messageId)) || null;
  return { available: true, message, warning: message ? result.warning : "El mensaje solicitado no existe o no está disponible para este usuario." };
}

export function markStudentMessageRead({ messageId, studentId, storage } = {}) {
  const access = getStudentMessageById({ messageId, studentId, storage });
  if (!access.message) return { updated: false, message: null, warning: access.warning };
  if (access.message.read) return { updated: true, message: clone(access.message), warning: null };
  const targetStorage = storageFor(storage);
  const source = read(targetStorage);
  const messages = source.messages.map(message => message.id === access.message.id ? { ...message, read: true } : message);
  const persisted = write(messages, targetStorage);
  const updated = messages.find(message => message.id === access.message.id);
  return persisted.saved ? { updated: true, message: clone(updated), warning: source.warning } : { updated: false, message: null, warning: persisted.warning };
}
