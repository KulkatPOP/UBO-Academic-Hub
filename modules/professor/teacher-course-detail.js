// Detalle aislado para el futuro Panel Profesor.
// Recibe ?courseId=<id> o #courseId=<id> y no se integra con el router de la aplicación actual.

import { getCourseById, getCourses } from "../../services/course-service.js";
import { getProfessorById } from "../../services/professor-service.js";
import { getStudentAcademicInfo, getStudentsByCourse } from "../../services/student-service.js";
import { universityRooms } from "../../data/university/rooms.js";
import { universitySchedules } from "../../data/university/schedules.js";
import {
  getTeacherAttendanceSession,
  getTeacherCourseAttendance,
  saveTeacherAttendance
} from "../../services/teacher-actions/teacher-attendance-management-service.js";
import {
  generateQrAttendanceSession,
  getQrAttendancePayload,
  getQrAttendanceSession,
  getQrAttendanceTimeRemaining
} from "../../services/qr-attendance-service.js";
import {
  getCourseGrades,
  prepareGradeEntry,
  saveStudentGrade,
  validateGradeSubmission
} from "../../services/teacher-actions/grade-action-service.js";
import {
  getCourseMaterials,
} from "../../services/teacher-actions/material-action-service.js";
import {
  TEACHER_MATERIAL_TYPES,
  createTeacherMaterial,
  deleteTeacherMaterial,
  getTeacherCourseMaterials
} from "../../services/teacher-actions/teacher-material-management-service.js";
import {
  createTeacherGrade,
  deleteTeacherGrade,
  getTeacherCourseGrades,
  updateTeacherGrade
} from "../../services/teacher-actions/teacher-grade-management-service.js";
import {
  createTeacherAnnouncement,
  deleteTeacherAnnouncement,
  getTeacherCourseAnnouncements,
  updateTeacherAnnouncement
} from "../../services/teacher-actions/teacher-announcement-management-service.js";
import { enforceDemoRouteGuard } from "../../core/demo-route-guard.js";
import { getTeacherDashboardSummary } from "../../services/teacher-actions/teacher-dashboard-summary-service.js";
import { getTeacherCourseAnalytics } from "../../services/analytics/academic-analytics-service.js";
import { getCourseMessages, sendCourseMessage } from "../../services/message-service.js";
import {
  createEvaluation,
  getEvaluationAutoGradeStatistics,
  getEvaluationSubmissions,
  getTeacherCourseEvaluations,
  gradeEvaluationSubmission
} from "../../services/evaluation-service.js";
import { createQuestion, getQuestionBank } from "../../services/evaluation/question-bank-service.js";
import { getTeacherDashboard as getLmsTeacherDashboard } from "../../services/api/teacher-dashboard-api-service.js";
import { applyThemePreference, getThemePreference } from "../../services/theme-preference-service.js";

const $ = selector => document.querySelector(selector);
const dayLabels = { lunes: "Lunes", martes: "Martes", miércoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sábado: "Sábado", domingo: "Domingo" };
let activeCourseId = null;
let activeGradeEvaluationId = null;
let qrAttendanceTimer = null;
const teacherRouteGuard = enforceDemoRouteGuard("TEACHER", {
  STUDENT: "../../index.html",
  ADMIN: "../admin/admin-dashboard.html",
  UNAUTHENTICATED: "../demo/demo-selector.html",
  default: "../demo/demo-selector.html"
});

function selectedCourseId() {
  const queryCourseId = new URLSearchParams(window.location.search).get("courseId");
  if (queryCourseId) return queryCourseId;

  const hashCourseId = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("courseId");
  return hashCourseId || getCourses()[0]?.id;
}

function getSchedules(course) {
  return course.scheduleIds
    .map(id => universitySchedules.find(schedule => schedule.id === id))
    .filter(Boolean);
}

function courseScheduleLabel(course) {
  const schedules = getSchedules(course);
  if (!schedules.length) return "Horario por confirmar";

  const days = schedules.map(schedule => dayLabels[schedule.day] || schedule.day);
  return `${days.join(" y ")} · ${schedules[0].time}`;
}

function studentMetric(student, field, fallback) {
  return student[field] === undefined || student[field] === null ? fallback : student[field];
}

function createSummaryElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function lmsValue(value, empty = "Datos LMS insuficientes") {
  return value === null || value === undefined || value === "" ? empty : String(value);
}

function renderLmsList(container, items, className, emptyMessage, createItem) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    container.replaceChildren(createSummaryElement("p", "empty-state", emptyMessage));
    return;
  }
  const fragment = document.createDocumentFragment();
  safeItems.forEach(item => fragment.append(createItem(item)));
  container.replaceChildren(fragment);
}

function disableDemoCourseMutations() {
  document.querySelectorAll("#teacher-course-detail form input, #teacher-course-detail form textarea, #teacher-course-detail form select, #teacher-course-detail form button, #generate-qr-attendance-btn").forEach(control => {
    control.disabled = true;
  });
}

async function renderLmsCourseDetail(courseId) {
  const result = await getLmsTeacherDashboard();
  if (!result.available) {
    $("#teacher-course-detail").replaceChildren(createSummaryElement("p", "empty-state", "No fue posible consultar este curso en el LMS. Los datos DEMO siguen disponibles desde el panel docente."));
    return;
  }
  const course = result.courses.find(item => item.id === courseId);
  if (!course) {
    $("#teacher-course-detail").replaceChildren(createSummaryElement("p", "empty-state", "No tienes autorización para consultar este curso LMS o el curso no existe."));
    return;
  }

  const students = Array.isArray(course.students) ? course.students : null;
  const materials = Array.isArray(course.materials) ? course.materials : null;
  const evaluations = Array.isArray(course.evaluations) ? course.evaluations : null;
  const messages = Array.isArray(course.messages) ? course.messages : null;
  const attendance = Array.isArray(course.attendance) ? course.attendance : null;
  const attendancePresent = attendance ? attendance.filter(record => String(record.status || "").toUpperCase() === "PRESENT").length : null;

  $("#teacher-course-title").textContent = lmsValue(course.name, "Curso LMS");
  $("#teacher-course-section").textContent = lmsValue(course.code, "Código LMS no disponible");
  $("#teacher-course-teacher").textContent = "Docente LMS asignado";
  $("#teacher-course-schedule").textContent = "Horario LMS no disponible";
  $("#teacher-course-room").textContent = "Sala LMS no disponible";
  $("#teacher-course-student-count").textContent = students ? `${students.length} inscritos` : "Datos LMS insuficientes";
  $("#course-students-caption").textContent = students ? `${students.length} inscritos LMS` : "Datos LMS insuficientes";

  const summary = document.createDocumentFragment();
  [
    ["Estudiantes", students ? String(students.length) : "Datos LMS insuficientes"],
    ["Material LMS", materials ? `${materials.length} disponible(s)` : "Datos LMS insuficientes"],
    ["Evaluaciones LMS", evaluations ? `${evaluations.length} disponible(s)` : "Datos LMS insuficientes"],
    ["Asistencia LMS", attendance ? `${attendancePresent} presente(s)` : "Datos LMS insuficientes"]
  ].forEach(([label, value]) => {
    const card = createSummaryElement("article", "course-dashboard-metric");
    card.append(createSummaryElement("span", "", label), createSummaryElement("strong", "", value));
    summary.append(card);
  });
  $("#teacher-course-dashboard-summary").replaceChildren(summary);
  $("#teacher-course-analytics").replaceChildren(createSummaryElement("p", "empty-state", course.analytics ? "Analítica LMS disponible sin indicadores adicionales." : "Datos LMS insuficientes para analítica del curso."));

  renderLmsList($("#teacher-course-students"), students, "student-row", "Datos LMS insuficientes para estudiantes.", student => {
    const row = createSummaryElement("article", "student-row");
    const identity = document.createElement("div");
    identity.append(createSummaryElement("b", "", lmsValue(student.name, "Estudiante LMS")), createSummaryElement("small", "", lmsValue(student.role, "STUDENT")));
    row.append(identity);
    return row;
  });
  renderLmsList($("#teacher-course-materials"), materials, "material-card", "No hay materiales LMS disponibles.", material => {
    const card = createSummaryElement("article", "material-card");
    card.append(createSummaryElement("b", "", lmsValue(material.title, "Material LMS")), createSummaryElement("small", "", lmsValue(material.type, "Tipo no disponible")));
    return card;
  });
  $("#materials-summary").textContent = materials ? `${materials.length} LMS` : "Datos LMS insuficientes";
  renderLmsList($("#teacher-course-evaluations"), evaluations, "teacher-evaluation-card", "No hay evaluaciones LMS disponibles.", evaluation => {
    const card = createSummaryElement("article", "teacher-evaluation-card");
    card.append(createSummaryElement("b", "", lmsValue(evaluation.title, "Evaluación LMS")), createSummaryElement("small", "", `Evaluación LMS · ${lmsValue(evaluation.status, "Estado no disponible")}`));
    return card;
  });
  $("#course-evaluations-summary").textContent = evaluations ? `${evaluations.length} LMS` : "Datos LMS insuficientes";
  renderLmsList($("#teacher-course-messages"), messages, "teacher-message-card", "No hay mensajes LMS disponibles.", message => {
    const card = createSummaryElement("article", "teacher-message-card");
    card.append(createSummaryElement("b", "", lmsValue(message.subject, "Mensaje LMS")), createSummaryElement("small", "", "Mensaje LMS"));
    return card;
  });
  $("#course-messages-summary").textContent = messages ? `${messages.length} LMS` : "Datos LMS insuficientes";
  $("#attendance-summary").textContent = attendance ? `${attendance.length} registro(s) LMS` : "Datos LMS insuficientes";
  disableDemoCourseMutations();
}

function renderCourseDashboardSummary(courseId) {
  const container = $("#teacher-course-dashboard-summary");
  const result = getTeacherDashboardSummary({ teacherId: teacherRouteGuard.identity?.id });
  const summary = result.courses.find(item => item.courseId === courseId);
  if (!summary) {
    container.replaceChildren(createSummaryElement("p", "empty-state", "No hay métricas demo disponibles para este curso."));
    return;
  }
  const metrics = [
    ["Promedio demo", summary.averageDemo === null ? "Sin notas demo" : summary.averageDemo.toFixed(1).replace(".", ",")],
    ["Asistencia demo", summary.attendancePercentage === null ? "Sin asistencia registrada" : `${summary.attendancePercentage.toFixed(1).replace(".", ",")}%`],
    ["Material", summary.materialsCount ? `${summary.materialsCount} publicado(s)` : "Sin materiales publicados"],
    ["Avisos", summary.announcementsCount ? `${summary.announcementsCount} enviado(s)` : "Sin avisos"]
  ];
  const fragment = document.createDocumentFragment();
  metrics.forEach(([label, value]) => {
    const card = createSummaryElement("article", "course-dashboard-metric");
    card.append(createSummaryElement("span", "", label), createSummaryElement("strong", "", value));
    fragment.append(card);
  });
  container.replaceChildren(fragment);
}

function renderCourseAnalytics(courseId) {
  const container = $("#teacher-course-analytics");
  const result = getTeacherCourseAnalytics({ teacherId: teacherRouteGuard.identity?.id, courseId });
  const analytics = result.courses[0];
  if (!analytics) {
    container.replaceChildren(createSummaryElement("p", "empty-state", "Sin datos suficientes para analizar."));
    return;
  }
  const performance = analytics.averageDemo === null ? null : Number(((analytics.averageDemo / 7) * 100).toFixed(1));
  const attendance = analytics.attendance.percentage;
  const indicators = [
    ["Rendimiento general", performance, analytics.averageDemo === null ? "Sin notas demo" : `Promedio demo ${analytics.averageDemo.toFixed(1).replace(".", ",")}`],
    ["Asistencia", attendance, attendance === null ? "Sin asistencia registrada" : `${attendance.toFixed(1).replace(".", ",")}% demo`]
  ];
  const fragment = document.createDocumentFragment();
  indicators.forEach(([label, value, caption]) => {
    const card = createSummaryElement("article", "course-analytics-card");
    const bar = createSummaryElement("span", "course-analytics-bar");
    const fill = createSummaryElement("i", "");
    fill.style.width = `${Math.max(0, Math.min(100, value ?? 0))}%`;
    bar.append(fill);
    card.append(createSummaryElement("b", "", label), createSummaryElement("strong", "", caption), bar);
    fragment.append(card);
  });
  fragment.append(createSummaryElement("p", "course-analytics-followup", `Estudiantes en seguimiento: ${analytics.studentsFollowUp}`));
  container.replaceChildren(fragment);
}

function renderStudents(courseId) {
  const students = getStudentsByCourse(courseId);
  $("#course-students-caption").textContent = `${students.length} inscritos`;
  const container = $("#teacher-course-students");
  const fragment = document.createDocumentFragment();
  students.forEach(student => {
    const academic = getStudentAcademicInfo(student.id);
    const attendance = studentMetric(student, "asistencia", "Sin registro");
    const average = studentMetric(student, "promedio", "Sin registro");
    const row = createSummaryElement("article", "student-row");
    const identity = document.createElement("div");
    const attendanceBlock = document.createElement("span");
    const averageBlock = document.createElement("span");
    identity.append(createSummaryElement("b", "", student.nombre), createSummaryElement("small", "", `${academic?.courses.length || 0} curso(s) institucional(es)`));
    attendanceBlock.append(createSummaryElement("small", "", "Asistencia"), createSummaryElement("b", "", `${attendance}${typeof attendance === "number" ? "%" : ""}`));
    averageBlock.append(createSummaryElement("small", "", "Promedio"), createSummaryElement("b", "", typeof average === "number" ? average.toFixed(1) : String(average)));
    row.append(identity, attendanceBlock, averageBlock);
    fragment.append(row);
  });
  container.replaceChildren(students.length ? fragment : createSummaryElement("p", "empty-state", "No hay alumnos inscritos en este curso."));
}

function showAttendanceFeedback(message, tone = "") {
  const feedback = $("#attendance-feedback");
  feedback.textContent = message;
  feedback.className = `attendance-feedback ${tone}`;
}

function renderAttendanceSummary(courseId) {
  const date = $("#teacher-attendance-date").value || null;
  const result = getTeacherCourseAttendance({ courseId, date, identity: teacherRouteGuard.identity });
  if (!result.allowed) return showAttendanceFeedback(result.warning, "error");
  const summary = result.summary;
  $("#attendance-summary").textContent = `${summary.present} presentes · ${summary.absent} ausentes · ${summary.justified} justificados · ${summary.unregistered} sin registrar`;
  if (result.warning) showAttendanceFeedback(result.warning, "error");
}

function renderAttendanceSession(session) {
  const studentsById = new Map(getStudentsByCourse(activeCourseId).map(student => [student.id, student]));
  const container = $("#attendance-student-list");
  const fragment = document.createDocumentFragment();
  session.students.forEach(record => {
    const student = studentsById.get(record.studentId);
    const statusLabel = record.status === "PRESENT" ? "Presente" : record.status === "ABSENT" ? "Ausente" : record.status === "JUSTIFIED" ? "Justificado" : "Sin registrar";
    const percentageLabel = record.percentage.percentage === null ? "Sin sesiones registradas" : `${record.percentage.percentage.toFixed(1)}% de asistencia demo`;
    const row = createSummaryElement("article", "attendance-student-row");
    const identity = document.createElement("div");
    const label = document.createElement("label");
    const select = document.createElement("select");
    identity.append(createSummaryElement("b", "", student?.nombre || "Estudiante institucional"), createSummaryElement("small", "", percentageLabel));
    label.append("Estado");
    select.dataset.attendanceStudent = record.studentId;
    select.setAttribute("aria-label", `Estado de asistencia de ${student?.nombre || record.studentId}`);
    [["", "Sin registrar"], ["PRESENT", "Presente"], ["ABSENT", "Ausente"], ["JUSTIFIED", "Justificado"]].forEach(([value, labelText]) => {
      const option = createSummaryElement("option", "", labelText);
      option.value = value;
      option.selected = value === (record.status || "");
      select.append(option);
    });
    label.append(select, createSummaryElement("small", "attendance-current-status", `Estado actual: ${statusLabel}`));
    row.append(identity, label);
    fragment.append(row);
  });
  container.replaceChildren(session.students.length ? fragment : createSummaryElement("p", "empty-state", "No hay alumnos inscritos para registrar asistencia."));
  $("#save-attendance-btn").disabled = session.students.length === 0;
}

function prepareAttendanceList() {
  const date = $("#teacher-attendance-date").value;
  if (!date) {
    showAttendanceFeedback("Selecciona una fecha válida antes de preparar la lista.", "error");
    return;
  }

  try {
    const session = getTeacherAttendanceSession({ courseId: activeCourseId, date, identity: teacherRouteGuard.identity });
    if (!session.allowed) throw new Error(session.warning);
    renderAttendanceSession(session);
    renderAttendanceSummary(activeCourseId);
    showAttendanceFeedback("Lista preparada. Selecciona el estado de cada estudiante.", "success");
  } catch (error) {
    showAttendanceFeedback(error.message, "error");
  }
}

function saveAttendance(event) {
  event.preventDefault();
  const date = $("#teacher-attendance-date").value;
  if (!date) return showAttendanceFeedback("Selecciona una fecha válida antes de guardar.", "error");

  const selections = [...document.querySelectorAll("[data-attendance-student]")].map(select => ({
    courseId: activeCourseId,
    studentId: select.dataset.attendanceStudent,
    date,
    status: select.value,
    identity: teacherRouteGuard.identity
  })).filter(item => item.status);
  if (!selections.length) return showAttendanceFeedback("Selecciona al menos un estado. Los estudiantes sin estado permanecerán sin registrar.", "error");

  const saved = selections.map(data => saveTeacherAttendance(data));
  if (saved.some(item => !item.saved)) {
    const details = saved.flatMap(item => item.errors || []).join(" ");
    return showAttendanceFeedback(`No se pudo guardar toda la asistencia. ${details}`, "error");
  }

  const session = getTeacherAttendanceSession({ courseId: activeCourseId, date, identity: teacherRouteGuard.identity });
  renderAttendanceSession(session);
  renderAttendanceSummary(activeCourseId);
  showAttendanceFeedback(`Asistencia guardada correctamente para ${saved.length} estudiante(s).`, "success");
}

function setupAttendanceRegistration(courseId) {
  activeCourseId = courseId;
  renderAttendanceSummary(courseId);
  $("#prepare-attendance-btn").addEventListener("click", prepareAttendanceList);
  $("#teacher-attendance-form").addEventListener("submit", saveAttendance);
  $("#teacher-attendance-date").addEventListener("change", () => {
    $("#attendance-student-list").replaceChildren();
    $("#save-attendance-btn").disabled = true;
    showAttendanceFeedback("");
    renderAttendanceSummary(courseId);
  });
}

function formatQrTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function qrDemoMatrix(payload, size = 21) {
  let value = 2166136261;
  for (const character of payload) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => {
    const finder = (row < 7 && column < 7) || (row < 7 && column >= size - 7) || (row >= size - 7 && column < 7);
    if (finder) {
      const localRow = row < 7 ? row : row - (size - 7);
      const localColumn = column < 7 ? column : column - (size - 7);
      return localRow === 0 || localRow === 6 || localColumn === 0 || localColumn === 6 || (localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4);
    }
    value = Math.imul(value ^ (row * size + column + 1), 16777619);
    return Boolean(value & 1);
  }));
}

function createQrDemoCanvas(payload) {
  const size = 21;
  const cell = 8;
  const canvas = document.createElement("canvas");
  canvas.className = "teacher-qr-canvas";
  canvas.width = size * cell;
  canvas.height = size * cell;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Código QR visual de demostración para asistencia");
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#20377D";
  qrDemoMatrix(payload, size).forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
    if (filled) context.fillRect(columnIndex * cell, rowIndex * cell, cell, cell);
  }));
  return canvas;
}

function renderQrAttendanceSession(sessionId) {
  const container = $("#teacher-qr-attendance-session");
  const status = $("#teacher-qr-attendance-status");
  if (qrAttendanceTimer) window.clearInterval(qrAttendanceTimer);
  const update = () => {
    const { session } = getQrAttendanceSession(sessionId);
    container.replaceChildren();
    if (!session) {
      status.textContent = "Sin sesión activa";
      container.append(createSummaryElement("p", "attendance-feedback error", "No fue posible recuperar la sesión QR."));
      return;
    }
    const remaining = getQrAttendanceTimeRemaining(session);
    const course = getCourseById(session.courseId);
    if (!remaining) {
      status.textContent = "Sesión expirada";
      container.append(createSummaryElement("p", "attendance-feedback error", "La sesión QR expiró. Genera una nueva sesión si es necesario."));
      if (qrAttendanceTimer) window.clearInterval(qrAttendanceTimer);
      return;
    }
    const payload = getQrAttendancePayload(session);
    const card = createSummaryElement("article", "teacher-qr-session-card");
    const detail = document.createElement("div");
    const code = createSummaryElement("code", "teacher-qr-payload", payload);
    detail.append(createSummaryElement("small", "", "Sesión activa"), createSummaryElement("b", "", course?.nombre || "Curso"), createSummaryElement("p", "", `Tiempo restante: ${formatQrTime(remaining)}`), createSummaryElement("small", "", "Código demo para registrar asistencia:"), code);
    card.append(createQrDemoCanvas(payload), detail);
    container.append(card);
    status.textContent = "Sesión activa";
  };
  update();
  qrAttendanceTimer = window.setInterval(update, 1000);
}

function setupQrAttendance(courseId) {
  const button = $("#generate-qr-attendance-btn");
  button.addEventListener("click", () => {
    const result = generateQrAttendanceSession({ courseId, teacherId: teacherRouteGuard.identity?.id });
    if (!result.created) {
      $("#teacher-qr-attendance-status").textContent = "No disponible";
      $("#teacher-qr-attendance-session").replaceChildren(createSummaryElement("p", "attendance-feedback error", result.warning || "No fue posible generar el código QR."));
      return;
    }
    renderQrAttendanceSession(result.session.id);
  });
}

function showMessageFeedback(message, tone = "") {
  const feedback = $("#teacher-message-feedback");
  feedback.textContent = message;
  feedback.className = `announcement-feedback ${tone}`;
}

function renderCourseMessages(courseId) {
  const result = getCourseMessages({ courseId, identity: teacherRouteGuard.identity });
  $("#course-messages-summary").textContent = `${result.messages.length} enviado(s)`;
  const container = $("#teacher-course-messages");
  if (!result.allowed) {
    container.replaceChildren(createSummaryElement("p", "empty-state", result.warning || "No fue posible cargar los mensajes."));
    return showMessageFeedback(result.warning || "No tienes acceso a estos mensajes.", "error");
  }
  const fragment = document.createDocumentFragment();
  result.messages.forEach(message => {
    const row = createSummaryElement("article", "teacher-message-row");
    const detail = document.createElement("div");
    detail.append(createSummaryElement("b", "", message.subject), createSummaryElement("p", "", message.message), createSummaryElement("small", "", `Enviado: ${formatAnnouncementDate(message.createdAt)}`));
    row.append(detail, createSummaryElement("span", "message-recipient-count", "Curso completo"));
    fragment.append(row);
  });
  container.replaceChildren(result.messages.length ? fragment : createSummaryElement("p", "empty-state", "Aún no has enviado mensajes a este curso."));
  if (result.warning) showMessageFeedback(result.warning, "error");
}

function setupCourseMessages(courseId) {
  renderCourseMessages(courseId);
  $("#teacher-message-form").addEventListener("submit", event => {
    event.preventDefault();
    const result = sendCourseMessage({
      courseId,
      subject: $("#teacher-message-subject").value,
      message: $("#teacher-message-content").value,
      identity: teacherRouteGuard.identity
    });
    if (!result.sent) return showMessageFeedback((result.errors || ["No fue posible enviar el mensaje."]).join(" "), "error");
    event.currentTarget.reset();
    renderCourseMessages(courseId);
    showMessageFeedback("Mensaje enviado correctamente.", "success");
  });
}

function showEvaluationFeedback(message, tone = "") {
  const feedback = $("#teacher-evaluation-feedback");
  feedback.textContent = message;
  feedback.className = `announcement-feedback ${tone}`;
}

function renderEvaluationReview(evaluationId) {
  const container = $("#teacher-evaluation-review");
  const result = getEvaluationSubmissions({ evaluationId, identity: teacherRouteGuard.identity });
  container.replaceChildren();
  if (!result.allowed) {
    container.append(createSummaryElement("p", "empty-state", result.warning || "No fue posible cargar las respuestas."));
    return;
  }
  const heading = createSummaryElement("h3", "", `Revisar respuestas · ${result.evaluation.title}`);
  const fragment = document.createDocumentFragment();
  const students = new Map(getStudentsByCourse(activeCourseId).map(student => [student.id, student]));
  result.submissions.forEach(submission => {
    const row = createSummaryElement("article", "teacher-evaluation-submission");
    const student = students.get(submission.studentId);
    const answers = document.createElement("div");
    answers.className = "teacher-evaluation-answers";
    result.evaluation.questions.forEach(question => {
      const answer = createSummaryElement("p", "", submission.answers[question.id] || "Sin respuesta");
      answer.prepend(createSummaryElement("b", "", `${question.question || question.prompt || "Pregunta demo"}: `));
      answers.append(answer);
    });
    const form = createSummaryElement("form", "teacher-evaluation-grade-form");
    form.noValidate = true;
    form.dataset.evaluationSubmission = submission.id;
    const grade = document.createElement("input");
    grade.type = "text"; grade.inputMode = "decimal"; grade.name = "grade"; grade.value = submission.grade ?? ""; grade.placeholder = "Ej.: 5,5"; grade.setAttribute("aria-label", `Nota para ${student?.nombre || "estudiante"}`);
    const comment = document.createElement("textarea");
    comment.name = "comment"; comment.maxLength = 2000; comment.placeholder = "Comentario opcional"; comment.value = submission.comment || ""; comment.setAttribute("aria-label", `Comentario para ${student?.nombre || "estudiante"}`);
    const save = createSummaryElement("button", "grades-save-btn", submission.grade === null ? "Publicar nota demo" : "Actualizar nota demo");
    save.type = "submit";
    form.append(grade, comment, save);
    if (submission.autoGrade) row.append(createSummaryElement("small", "", submission.autoGrade.grade === null ? "Corrección automática pendiente de revisión docente." : `Nota automática demo: ${submission.autoGrade.grade.toFixed(1).replace(".", ",")}`));
    row.append(createSummaryElement("b", "", student?.nombre || "Estudiante"), createSummaryElement("small", "", `Enviada: ${formatAnnouncementDate(submission.submittedAt)}`), answers, form);
    fragment.append(row);
  });
  container.append(heading, result.submissions.length ? fragment : createSummaryElement("p", "empty-state", "Aún no hay respuestas para esta evaluación."));
}

function renderQuestionBank(courseId) {
  const container = $("#teacher-question-bank-list");
  const result = getQuestionBank({ courseId, identity: teacherRouteGuard.identity });
  container.replaceChildren();
  if (!result.allowed) return container.append(createSummaryElement("p", "empty-state", result.warning || "No fue posible cargar el banco de preguntas."));
  if (!result.questions.length) return container.append(createSummaryElement("p", "empty-state", "Aún no hay preguntas demo para este curso."));
  const fragment = document.createDocumentFragment();
  result.questions.forEach(question => {
    const label = createSummaryElement("label", "teacher-question-bank-item");
    const check = document.createElement("input");
    check.type = "checkbox"; check.name = "teacher-evaluation-question"; check.value = question.id;
    const detail = document.createElement("span");
    detail.append(createSummaryElement("b", "", question.question), createSummaryElement("small", "", `${question.topic} · ${question.type}`));
    label.append(check, detail);
    fragment.append(label);
  });
  container.append(fragment);
}

function renderEvaluationStatistics(evaluationId) {
  const result = getEvaluationAutoGradeStatistics({ evaluationId, identity: teacherRouteGuard.identity });
  if (!result.allowed || !result.statistics) return;
  const container = $("#teacher-evaluation-review");
  const stats = createSummaryElement("article", "teacher-evaluation-statistics");
  const average = result.statistics.average === null ? "Sin resultados automáticos" : result.statistics.average.toFixed(1).replace(".", ",");
  stats.append(createSummaryElement("h3", "", "Estadísticas de evaluación"), createSummaryElement("p", "", `Promedio automático demo: ${average} · Respuestas: ${result.statistics.submissions}`));
  result.statistics.difficultQuestions.forEach(question => stats.append(createSummaryElement("p", "", `${question.topic} · ${question.correctPercentage === null ? "Pendiente de corrección" : `${question.correctPercentage}% correcto`}`)));
  if (result.statistics.weakTopics.length) stats.append(createSummaryElement("small", "", `Temas a reforzar: ${result.statistics.weakTopics.join(" · ")}`));
  container.prepend(stats);
}

function renderCourseEvaluations(courseId) {
  const result = getTeacherCourseEvaluations({ courseId, identity: teacherRouteGuard.identity });
  $("#course-evaluations-summary").textContent = `${result.evaluations.length} publicada(s)`;
  const container = $("#teacher-course-evaluations");
  if (!result.allowed) {
    container.replaceChildren(createSummaryElement("p", "empty-state", result.warning || "No fue posible cargar las evaluaciones."));
    return showEvaluationFeedback(result.warning || "No tienes acceso a estas evaluaciones.", "error");
  }
  const fragment = document.createDocumentFragment();
  result.evaluations.forEach(evaluation => {
    const row = createSummaryElement("article", "teacher-evaluation-row");
    const detail = document.createElement("div");
    const review = createSummaryElement("button", "outline-btn", "Revisar respuestas");
    review.type = "button"; review.dataset.evaluationReview = evaluation.id;
    detail.append(createSummaryElement("b", "", evaluation.title), createSummaryElement("p", "", evaluation.description || "Sin descripción adicional."), createSummaryElement("small", "", `Fecha límite: ${evaluation.dueDate} · ${evaluation.type === "QUIZ" ? "Alternativa" : "Desarrollo"}`));
    row.append(detail, createSummaryElement("span", "message-recipient-count", `${evaluation.submissionsCount} respuesta(s)`), review);
    fragment.append(row);
  });
  container.replaceChildren(result.evaluations.length ? fragment : createSummaryElement("p", "empty-state", "Aún no has publicado evaluaciones demo para este curso."));
  if (result.warning) showEvaluationFeedback(result.warning, "error");
}

function setupCourseEvaluations(courseId) {
  const dueDate = $("#teacher-evaluation-due-date");
  dueDate.min = new Date().toISOString().slice(0, 10);
  renderCourseEvaluations(courseId);
  renderQuestionBank(courseId);
  $("#teacher-question-form").addEventListener("submit", event => {
    event.preventDefault();
    const options = $("#teacher-question-options").value.split(/\r?\n/);
    const result = createQuestion({ courseId, identity: teacherRouteGuard.identity, type: $("#teacher-question-type").value, question: $("#teacher-question-text").value, options, correctAnswer: $("#teacher-question-correct").value, topic: $("#teacher-question-topic").value, difficulty: $("#teacher-question-difficulty").value });
    if (!result.created) return showEvaluationFeedback((result.errors || ["No fue posible guardar la pregunta demo."]).join(" "), "error");
    event.currentTarget.reset();
    renderQuestionBank(courseId);
    showEvaluationFeedback("Pregunta agregada al banco correctamente.", "success");
  });
  $("#teacher-evaluation-form").addEventListener("submit", event => {
    event.preventDefault();
    const selectedQuestionIds = [...document.querySelectorAll("[name='teacher-evaluation-question']:checked")].map(input => input.value);
    const requestedCount = Number($("#teacher-evaluation-question-count").value);
    const questionIds = Number.isInteger(requestedCount) && requestedCount > 0 ? selectedQuestionIds.slice(0, requestedCount) : selectedQuestionIds;
    const result = createEvaluation({ courseId, title: $("#teacher-evaluation-title").value, description: $("#teacher-evaluation-description").value, type: $("#teacher-evaluation-type").value, dueDate: dueDate.value, questionIds, identity: teacherRouteGuard.identity });
    if (!result.created) return showEvaluationFeedback((result.errors || ["No fue posible publicar la evaluación."]).join(" "), "error");
    event.currentTarget.reset();
    renderCourseEvaluations(courseId);
    showEvaluationFeedback("Evaluación publicada correctamente.", "success");
  });
  $("#teacher-course-evaluations").addEventListener("click", event => {
    const button = event.target.closest("[data-evaluation-review]");
    if (button) { renderEvaluationReview(button.dataset.evaluationReview); renderEvaluationStatistics(button.dataset.evaluationReview); }
  });
  $("#teacher-evaluation-review").addEventListener("submit", event => {
    const form = event.target.closest("[data-evaluation-submission]");
    if (!form) return;
    event.preventDefault();
    const result = gradeEvaluationSubmission({ submissionId: form.dataset.evaluationSubmission, grade: form.elements.grade.value, comment: form.elements.comment.value, identity: teacherRouteGuard.identity });
    if (!result.graded) return showEvaluationFeedback((result.errors || ["No fue posible publicar la nota demo."]).join(" "), "error");
    renderEvaluationReview(result.submission.evaluationId);
    renderCourseEvaluations(courseId);
    showEvaluationFeedback("Nota demo publicada correctamente.", "success");
  });
}

function showGradesFeedback(message, tone = "") {
  const feedback = $("#grades-feedback");
  feedback.textContent = message;
  feedback.className = `grades-feedback ${tone}`;
}

function renderGradeEntry(courseId, evaluationId) {
  const entry = prepareGradeEntry(courseId, evaluationId);
  activeGradeEvaluationId = entry.evaluation?.id || null;

  if (!entry.evaluation) {
    $("#grades-student-list").replaceChildren(createSummaryElement("p", "empty-state", entry.warning || "No hay información de notas disponible."));
    $("#save-grades-btn").disabled = true;
    showGradesFeedback(entry.warning || "", "error");
    return;
  }

  const gradeList = $("#grades-student-list");
  const gradeFragment = document.createDocumentFragment();
  entry.students.forEach(({ student, grade, alreadyRecorded }) => {
    const row = createSummaryElement("article", `grades-student-row${alreadyRecorded ? " is-recorded" : ""}`);
    const identity = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");
    identity.append(createSummaryElement("b", "", student.nombre), createSummaryElement("small", "", alreadyRecorded ? "Nota institucional ya registrada" : "Sin nota registrada"));
    label.append("Nota");
    input.type = "number"; input.min = "1"; input.max = "7"; input.step = "0.1"; input.value = grade.grade ?? "";
    input.dataset.gradeStudent = student.id; input.readOnly = alreadyRecorded; input.setAttribute("aria-label", `Nota de ${student.nombre}`);
    if (alreadyRecorded) input.setAttribute("aria-readonly", "true");
    label.append(input);
    row.append(identity, label, createSummaryElement("span", "grade-entry-status", alreadyRecorded ? `Registrada: ${Number(grade.grade).toFixed(1)}` : "Pendiente"));
    gradeFragment.append(row);
  });
  gradeList.replaceChildren(entry.students.length ? gradeFragment : createSummaryElement("p", "empty-state", "No hay alumnos inscritos en este curso."));

  const pendingCount = entry.students.filter(item => !item.alreadyRecorded).length;
  $("#save-grades-btn").disabled = pendingCount === 0;
  showGradesFeedback(entry.warning || (pendingCount ? "Ingresa notas entre 1.0 y 7.0 para los alumnos pendientes." : ""), entry.warning ? "error" : "");
}

function renderGradesRegistration(courseId) {
  const courseGrades = getCourseGrades(courseId);
  const select = $("#teacher-grade-evaluation");
  $("#grades-summary").textContent = `${courseGrades.evaluations.length} evaluación(es)`;

  if (!courseGrades.course || !courseGrades.evaluations.length) {
    const option = createSummaryElement("option", "", "Sin evaluaciones oficiales");
    option.value = "";
    select.replaceChildren(option);
    select.disabled = true;
    renderGradeEntry(courseId, "");
    return;
  }

  select.disabled = false;
  const options = document.createDocumentFragment();
  courseGrades.evaluations.forEach(evaluation => {
    const option = createSummaryElement("option", "", `${evaluation.title} · ${evaluation.percentage}%`);
    option.value = evaluation.id;
    options.append(option);
  });
  select.replaceChildren(options);
  renderGradeEntry(courseId, select.value);
}

function saveGrades(event) {
  event.preventDefault();
  if (!activeGradeEvaluationId) {
    showGradesFeedback("Selecciona una evaluación institucional válida.", "error");
    return;
  }

  const entry = prepareGradeEntry(activeCourseId, activeGradeEvaluationId);
  if (!entry.evaluation) {
    showGradesFeedback(entry.warning || "La evaluación no existe.", "error");
    return;
  }

  const submissions = [...document.querySelectorAll("[data-grade-student]")]
    .filter(input => !input.readOnly)
    .map(input => ({
      courseId: activeCourseId,
      evaluationId: activeGradeEvaluationId,
      studentId: input.dataset.gradeStudent,
      grade: input.value
    }));
  if (!submissions.length) {
    showGradesFeedback("Todas las notas de esta evaluación ya están registradas. Para proteger el registro académico, no se permiten duplicados.", "error");
    return;
  }

  const validations = submissions.map(data => ({ data, result: validateGradeSubmission(data) }));
  const invalid = validations.filter(item => !item.result.valid);
  if (invalid.length) {
    showGradesFeedback(`No se guardaron las notas. ${invalid.flatMap(item => item.result.errors).join(" ")}`, "error");
    return;
  }

  const saved = validations.map(item => saveStudentGrade(item.data));
  if (saved.some(item => !item.saved)) {
    showGradesFeedback(`No se guardaron las notas. ${saved.flatMap(item => item.errors || []).join(" ") || "Revisa los datos ingresados."}`, "error");
    return;
  }

  renderGradeEntry(activeCourseId, activeGradeEvaluationId);
  showGradesFeedback(`Notas guardadas correctamente para ${saved.length} estudiante(s).`, "success");
}

function setupGradesRegistration(courseId) {
  renderGradesRegistration(courseId);
  $("#teacher-grade-evaluation").addEventListener("change", event => renderGradeEntry(courseId, event.target.value));
  $("#teacher-grades-form").addEventListener("submit", saveGrades);
}

function formatDemoGrade(value) {
  return Number(value).toFixed(1).replace(".", ",");
}

function showDemoGradeFeedback(message, tone = "") {
  const feedback = $("#demo-grade-feedback");
  feedback.textContent = message;
  feedback.className = `grades-feedback ${tone}`;
}

function resetDemoGradeForm() {
  $("#teacher-demo-grade-form").reset();
  $("#teacher-demo-grade-id").value = "";
  $("#teacher-demo-grade-student").disabled = false;
  $("#save-demo-grade-btn").textContent = "Guardar nota demo";
  $("#cancel-demo-grade-btn").hidden = true;
}

function renderDemoGrades(courseId) {
  const result = getTeacherCourseGrades({ courseId, identity: teacherRouteGuard.identity });
  const students = new Map(getStudentsByCourse(courseId).map(student => [student.id, student]));
  $("#demo-grades-summary").textContent = `${result.grades.length} nota(s) demo`;
  const gradeStudentSelect = $("#teacher-demo-grade-student");
  const studentOptions = document.createDocumentFragment();
  getStudentsByCourse(courseId).forEach(student => {
    const option = createSummaryElement("option", "", student.nombre);
    option.value = student.id;
    studentOptions.append(option);
  });
  gradeStudentSelect.replaceChildren(studentOptions);

  if (!result.allowed) {
    $("#teacher-demo-grades").replaceChildren(createSummaryElement("p", "empty-state", result.warning || "No fue posible cargar las notas demo."));
    $("#save-demo-grade-btn").disabled = true;
    showDemoGradeFeedback(result.warning || "No tienes acceso a este curso.", "error");
    return;
  }

  const demoGradeList = $("#teacher-demo-grades");
  const demoGradeFragment = document.createDocumentFragment();
  result.grades.forEach(grade => {
    const row = createSummaryElement("article", "demo-grade-row");
    const detail = document.createElement("div");
    const actions = createSummaryElement("div", "demo-grade-row-actions");
    const edit = createSummaryElement("button", "", "Editar");
    const remove = createSummaryElement("button", "", "Eliminar");
    edit.type = "button"; edit.dataset.editDemoGrade = grade.id;
    remove.type = "button"; remove.dataset.deleteDemoGrade = grade.id;
    detail.append(createSummaryElement("b", "", students.get(grade.studentId)?.nombre || "Estudiante institucional"), createSummaryElement("small", "", `${grade.assessmentName} · Última modificación: ${grade.updatedAt}`));
    actions.append(edit, remove);
    row.append(detail, createSummaryElement("strong", "", formatDemoGrade(grade.value)), actions);
    demoGradeFragment.append(row);
  });
  demoGradeList.replaceChildren(result.grades.length ? demoGradeFragment : createSummaryElement("p", "empty-state", "Aún no hay notas demo para este curso. Crea la primera evaluación cuando esté lista."));
  if (result.warning) showDemoGradeFeedback(result.warning, "error");
}

function saveDemoGrade(event) {
  event.preventDefault();
  const id = $("#teacher-demo-grade-id").value;
  const data = {
    courseId: activeCourseId,
    studentId: $("#teacher-demo-grade-student").value,
    assessmentName: $("#teacher-demo-grade-assessment").value,
    value: $("#teacher-demo-grade-value").value,
    identity: teacherRouteGuard.identity
  };
  const result = id ? updateTeacherGrade({ ...data, id }) : createTeacherGrade(data);
  if (!(result.created || result.updated)) {
    showDemoGradeFeedback((result.errors || ["No fue posible guardar la nota demo."]).join(" "), "error");
    return;
  }
  const message = result.updated ? "Nota actualizada correctamente." : "Nota guardada correctamente.";
  resetDemoGradeForm();
  renderDemoGrades(activeCourseId);
  showDemoGradeFeedback(message, "success");
}

function manageDemoGrade(event) {
  const edit = event.target.closest("[data-edit-demo-grade]");
  const remove = event.target.closest("[data-delete-demo-grade]");
  const result = getTeacherCourseGrades({ courseId: activeCourseId, identity: teacherRouteGuard.identity });
  if (edit) {
    const grade = result.grades.find(item => item.id === edit.dataset.editDemoGrade);
    if (!grade) return showDemoGradeFeedback("La nota demo seleccionada no existe.", "error");
    $("#teacher-demo-grade-id").value = grade.id;
    $("#teacher-demo-grade-assessment").value = grade.assessmentName;
    $("#teacher-demo-grade-student").value = grade.studentId;
    $("#teacher-demo-grade-student").disabled = true;
    $("#teacher-demo-grade-value").value = formatDemoGrade(grade.value);
    $("#save-demo-grade-btn").textContent = "Actualizar nota demo";
    $("#cancel-demo-grade-btn").hidden = false;
    showDemoGradeFeedback("Editando una nota demo local.");
    return;
  }
  if (!remove || !window.confirm("¿Eliminar esta nota demo? Las notas institucionales no se modifican.")) return;
  const deleted = deleteTeacherGrade({ id: remove.dataset.deleteDemoGrade, courseId: activeCourseId, identity: teacherRouteGuard.identity });
  if (!deleted.deleted) return showDemoGradeFeedback((deleted.errors || ["No fue posible eliminar la nota demo."]).join(" "), "error");
  resetDemoGradeForm();
  renderDemoGrades(activeCourseId);
  showDemoGradeFeedback("Nota eliminada correctamente.", "success");
}

function setupDemoGradeManagement(courseId) {
  renderDemoGrades(courseId);
  $("#teacher-demo-grade-form").addEventListener("submit", saveDemoGrade);
  $("#teacher-demo-grades").addEventListener("click", manageDemoGrade);
  $("#cancel-demo-grade-btn").addEventListener("click", () => {
    resetDemoGradeForm();
    showDemoGradeFeedback("");
  });
}

function showMaterialFeedback(message, tone = "") {
  const feedback = $("#material-feedback");
  feedback.textContent = message;
  feedback.className = `material-feedback ${tone}`;
}

function renderCourseMaterials(courseId) {
  const institutional = getCourseMaterials(courseId);
  const local = getTeacherCourseMaterials({ courseId, identity: teacherRouteGuard.identity });
  const materials = [
    ...institutional.materials.map(material => ({ ...material, source: "institutional", createdAt: material.publishedAt })),
    ...local.materials.map(material => ({ ...material, source: "local" }))
  ];
  $("#materials-summary").textContent = `${materials.length} material(es)`;

  if (!institutional.course || !local.allowed) {
    const warning = institutional.warning || local.warning || "No fue posible cargar el material.";
    $("#teacher-course-materials").replaceChildren(createSummaryElement("p", "empty-state", warning));
    $("#save-material-btn").disabled = true;
    showMaterialFeedback(warning, "error");
    return;
  }

  const materialList = $("#teacher-course-materials");
  const materialFragment = document.createDocumentFragment();
  materials.forEach(material => {
    const row = createSummaryElement("article", "material-row");
    const detail = document.createElement("div");
    const actions = createSummaryElement("div", "material-row-actions");
    detail.append(createSummaryElement("b", "", material.title), createSummaryElement("small", "", `${material.type} · ${material.createdAt || "Fecha no disponible"}`));
    if (material.description) detail.append(createSummaryElement("p", "", material.description));
    if (material.url) {
      const link = createSummaryElement("a", "", "Abrir enlace");
      link.href = material.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      actions.append(link);
    }
    if (material.source === "local") {
      const remove = createSummaryElement("button", "material-delete-btn", "Eliminar");
      remove.type = "button"; remove.dataset.deleteMaterial = material.id;
      actions.append(remove);
    } else actions.append(createSummaryElement("span", "material-no-link", "Material institucional"));
    row.append(detail, actions); materialFragment.append(row);
  });
  materialList.replaceChildren(materials.length ? materialFragment : createSummaryElement("p", "empty-state", "Aún no hay materiales para este curso. Agrega el primero cuando esté listo."));
  if (local.warning) showMaterialFeedback(local.warning, "error");
}

function saveMaterial(event) {
  event.preventDefault();
  const saved = createTeacherMaterial({
    courseId: activeCourseId,
    title: $("#teacher-material-title").value,
    description: $("#teacher-material-description").value,
    type: $("#teacher-material-type").value,
    identity: teacherRouteGuard.identity
  });
  if (!saved.created) {
    showMaterialFeedback((saved.errors || ["No fue posible agregar el material."]).join(" "), "error");
    return;
  }

  $("#teacher-material-form").reset();
  renderCourseMaterials(activeCourseId);
  showMaterialFeedback("Material agregado correctamente.", "success");
}

function deleteMaterial(event) {
  const button = event.target.closest("[data-delete-material]");
  if (!button || !window.confirm("¿Eliminar este material demo? Esta acción solo afecta el contenido local del curso.")) return;
  const result = deleteTeacherMaterial({
    courseId: activeCourseId,
    materialId: button.dataset.deleteMaterial,
    identity: teacherRouteGuard.identity
  });
  if (!result.deleted) return showMaterialFeedback((result.errors || ["No fue posible eliminar el material."]).join(" "), "error");
  renderCourseMaterials(activeCourseId);
  showMaterialFeedback("Material demo eliminado correctamente.", "success");
}

function setupMaterialRegistration(courseId) {
  const typeSelect = $("#teacher-material-type");
  const materialTypes = document.createDocumentFragment();
  TEACHER_MATERIAL_TYPES.forEach(type => {
    const option = createSummaryElement("option", "", type.charAt(0) + type.slice(1).toLocaleLowerCase("es"));
    option.value = type;
    materialTypes.append(option);
  });
  typeSelect.replaceChildren(materialTypes);
  renderCourseMaterials(courseId);
  $("#teacher-material-form").addEventListener("submit", saveMaterial);
  $("#teacher-course-materials").addEventListener("click", deleteMaterial);
}

function showAnnouncementFeedback(message, tone = "") {
  const feedback = $("#announcement-feedback");
  feedback.textContent = message;
  feedback.className = `announcement-feedback ${tone}`;
}

function formatAnnouncementDate(value) {
  try { return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return value || "Fecha no disponible"; }
}

function resetAnnouncementForm() {
  $("#teacher-announcement-form").reset();
  $("#teacher-announcement-id").value = "";
  $("#save-announcement-btn").textContent = "Publicar aviso";
  $("#cancel-announcement-btn").hidden = true;
}

function renderAnnouncements(courseId) {
  const result = getTeacherCourseAnnouncements({ courseId, identity: teacherRouteGuard.identity });
  $("#announcements-summary").textContent = `${result.announcements.length} aviso(s)`;
  if (!result.allowed) {
    $("#teacher-course-announcements").replaceChildren(createSummaryElement("p", "empty-state", result.warning));
    $("#save-announcement-btn").disabled = true;
    return showAnnouncementFeedback(result.warning, "error");
  }
  const announcementList = $("#teacher-course-announcements");
  const announcementFragment = document.createDocumentFragment();
  result.announcements.forEach(announcement => {
    const row = createSummaryElement("article", "announcement-row");
    const detail = document.createElement("div");
    const actions = createSummaryElement("div", "announcement-row-actions");
    const edit = createSummaryElement("button", "", "Editar");
    const remove = createSummaryElement("button", "", "Eliminar");
    edit.type = "button"; edit.dataset.editAnnouncement = announcement.id;
    remove.type = "button"; remove.dataset.deleteAnnouncement = announcement.id;
    detail.append(createSummaryElement("b", "", announcement.title), createSummaryElement("p", "", announcement.content), createSummaryElement("small", "", `Publicado: ${formatAnnouncementDate(announcement.createdAt)}${announcement.updatedAt !== announcement.createdAt ? ` · Editado: ${formatAnnouncementDate(announcement.updatedAt)}` : ""}`));
    actions.append(edit, remove); row.append(detail, actions); announcementFragment.append(row);
  });
  announcementList.replaceChildren(result.announcements.length ? announcementFragment : createSummaryElement("p", "empty-state", "No hay avisos para este curso. Los avisos publicados por el profesor aparecerán aquí."));
  if (result.warning) showAnnouncementFeedback(result.warning, "error");
}

function saveAnnouncement(event) {
  event.preventDefault();
  const payload = { id: $("#teacher-announcement-id").value, courseId: activeCourseId, title: $("#teacher-announcement-title").value, content: $("#teacher-announcement-content").value, identity: teacherRouteGuard.identity };
  const result = payload.id ? updateTeacherAnnouncement(payload) : createTeacherAnnouncement(payload);
  if (!(result.created || result.updated)) return showAnnouncementFeedback((result.errors || ["No fue posible guardar el aviso."]).join(" "), "error");
  const wasUpdated = Boolean(result.updated);
  resetAnnouncementForm();
  renderAnnouncements(activeCourseId);
  showAnnouncementFeedback(wasUpdated ? "Aviso actualizado correctamente." : "Aviso publicado correctamente.", "success");
}

function manageAnnouncement(event) {
  const edit = event.target.closest("[data-edit-announcement]");
  const remove = event.target.closest("[data-delete-announcement]");
  if (!edit && !remove) return;
  const id = (edit || remove).dataset.editAnnouncement || (edit || remove).dataset.deleteAnnouncement;
  const result = getTeacherCourseAnnouncements({ courseId: activeCourseId, identity: teacherRouteGuard.identity });
  const announcement = result.announcements.find(item => item.id === id);
  if (!announcement) return showAnnouncementFeedback("El aviso demo seleccionado no existe.", "error");
  if (edit) {
    $("#teacher-announcement-id").value = announcement.id;
    $("#teacher-announcement-title").value = announcement.title;
    $("#teacher-announcement-content").value = announcement.content;
    $("#save-announcement-btn").textContent = "Guardar cambios";
    $("#cancel-announcement-btn").hidden = false;
    $("#teacher-announcement-title").focus();
    return;
  }
  if (!window.confirm("¿Eliminar este aviso demo? Esta acción solo afecta este curso en este dispositivo.")) return;
  const deleted = deleteTeacherAnnouncement({ id, courseId: activeCourseId, identity: teacherRouteGuard.identity });
  if (!deleted.deleted) return showAnnouncementFeedback((deleted.errors || ["No fue posible eliminar el aviso."]).join(" "), "error");
  resetAnnouncementForm();
  renderAnnouncements(activeCourseId);
  showAnnouncementFeedback("Aviso eliminado correctamente.", "success");
}

function setupAnnouncementManagement(courseId) {
  renderAnnouncements(courseId);
  $("#teacher-announcement-form").addEventListener("submit", saveAnnouncement);
  $("#cancel-announcement-btn").addEventListener("click", () => { resetAnnouncementForm(); showAnnouncementFeedback(""); });
  $("#teacher-course-announcements").addEventListener("click", manageAnnouncement);
}

function renderCourseDetail() {
  if (!teacherRouteGuard.allowed) return;
  const course = getCourseById(selectedCourseId());
  if (!course) {
    void renderLmsCourseDetail(selectedCourseId());
    return;
  }
  if (course.professorId !== teacherRouteGuard.identity?.id) {
    $("#teacher-course-detail").replaceChildren(createSummaryElement("p", "empty-state", "No tienes autorización para gestionar este curso."));
    return;
  }

  const professor = getProfessorById(course.professorId);
  const room = universityRooms.find(item => item.id === course.roomId);
  const students = getStudentsByCourse(course.id);

  $("#teacher-course-title").textContent = course.nombre;
  $("#teacher-course-section").textContent = course.codigo;
  $("#teacher-course-teacher").textContent = professor?.nombre || "Profesor por confirmar";
  $("#teacher-course-schedule").textContent = courseScheduleLabel(course);
  $("#teacher-course-room").textContent = room?.nombre || "Sala por confirmar";
  $("#teacher-course-student-count").textContent = `${students.length} inscritos`;
  renderCourseDashboardSummary(course.id);
  renderCourseAnalytics(course.id);
  renderStudents(course.id);
  setupAttendanceRegistration(course.id);
  setupQrAttendance(course.id);
  setupCourseMessages(course.id);
  setupCourseEvaluations(course.id);
  setupGradesRegistration(course.id);
  setupDemoGradeManagement(course.id);
  setupMaterialRegistration(course.id);
  setupAnnouncementManagement(course.id);
}

applyThemePreference(getThemePreference());
renderCourseDetail();
