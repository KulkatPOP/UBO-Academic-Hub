// Detalle aislado para el futuro Panel Profesor.
// Recibe ?courseId=<id> y no se integra con el router de la aplicación actual.

import { getCourseById, getCourses } from "../../services/course-service.js";
import { getProfessorById } from "../../services/professor-service.js";
import { getStudentAcademicInfo, getStudentsByCourse } from "../../services/student-service.js";
import { universityRooms } from "../../data/university/rooms.js";
import { universitySchedules } from "../../data/university/schedules.js";
import {
  getCourseAttendance,
  markStudentAttendance,
  prepareAttendanceSession,
  validateAttendanceSubmission
} from "../../services/teacher-actions/attendance-action-service.js";
import {
  getCourseGrades,
  prepareGradeEntry,
  saveStudentGrade,
  validateGradeSubmission
} from "../../services/teacher-actions/grade-action-service.js";
import {
  ALLOWED_MATERIAL_TYPES,
  getCourseMaterials,
  prepareMaterialSubmission,
  saveCourseMaterial,
  validateMaterialSubmission
} from "../../services/teacher-actions/material-action-service.js";

const $ = selector => document.querySelector(selector);
const dayLabels = { lunes: "Lunes", martes: "Martes", miércoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sábado: "Sábado", domingo: "Domingo" };
let activeCourseId = null;
let activeGradeEvaluationId = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function selectedCourseId() {
  return new URLSearchParams(window.location.search).get("courseId") || getCourses()[0]?.id;
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

function renderStudents(courseId) {
  const students = getStudentsByCourse(courseId);
  $("#course-students-caption").textContent = `${students.length} inscritos`;
  $("#teacher-course-students").innerHTML = students.map(student => {
    const academic = getStudentAcademicInfo(student.id);
    const attendance = studentMetric(student, "asistencia", "Sin registro");
    const average = studentMetric(student, "promedio", "Sin registro");

    return `
      <article class="student-row">
        <div><b>${escapeHtml(student.nombre)}</b><small>${academic?.courses.length || 0} curso(s) institucional(es)</small></div>
        <span><small>Asistencia</small><b>${escapeHtml(attendance)}${typeof attendance === "number" ? "%" : ""}</b></span>
        <span><small>Promedio</small><b>${typeof average === "number" ? average.toFixed(1) : escapeHtml(average)}</b></span>
      </article>
    `;
  }).join("") || "<p class='empty-state'>No hay alumnos inscritos en este curso.</p>";
}

function showAttendanceFeedback(message, tone = "") {
  const feedback = $("#attendance-feedback");
  feedback.textContent = message;
  feedback.className = `attendance-feedback ${tone}`;
}

function renderAttendanceSummary(courseId) {
  const records = getCourseAttendance(courseId);
  $("#attendance-summary").textContent = `${records.length} registro(s) acumulado(s)`;
}

function renderAttendanceSession(session) {
  const studentsById = new Map(getStudentsByCourse(session.courseId).map(student => [student.id, student]));
  $("#attendance-student-list").innerHTML = session.students.map(record => {
    const student = studentsById.get(record.studentId);
    return `
      <article class="attendance-student-row">
        <div><b>${escapeHtml(student?.nombre || "Estudiante institucional")}</b><small>${escapeHtml(record.studentId)}</small></div>
        <label>Estado
          <select data-attendance-student="${escapeHtml(record.studentId)}" aria-label="Estado de asistencia de ${escapeHtml(student?.nombre || record.studentId)}">
            <option value="" ${record.status ? "" : "selected"} disabled>Selecciona estado</option>
            <option value="present" ${record.status === "present" ? "selected" : ""}>Presente</option>
            <option value="absent" ${record.status === "absent" ? "selected" : ""}>Ausente</option>
          </select>
        </label>
      </article>
    `;
  }).join("") || "<p class='empty-state'>No hay alumnos inscritos para registrar asistencia.</p>";
  $("#save-attendance-btn").disabled = session.students.length === 0;
}

function prepareAttendanceList() {
  const date = $("#teacher-attendance-date").value;
  if (!date) {
    showAttendanceFeedback("Selecciona una fecha válida antes de preparar la lista.", "error");
    return;
  }

  try {
    const session = prepareAttendanceSession(activeCourseId, date);
    renderAttendanceSession(session);
    showAttendanceFeedback("Lista preparada. Selecciona el estado de cada estudiante.", "success");
  } catch (error) {
    showAttendanceFeedback(error.message, "error");
  }
}

function saveAttendance(event) {
  event.preventDefault();
  const date = $("#teacher-attendance-date").value;
  if (!date) return showAttendanceFeedback("Selecciona una fecha válida antes de guardar.", "error");

  try {
    // La sesión se prepara nuevamente antes de validar para asegurar curso y fecha reales.
    prepareAttendanceSession(activeCourseId, date);
  } catch (error) {
    return showAttendanceFeedback(error.message, "error");
  }

  const selections = [...document.querySelectorAll("[data-attendance-student]")].map(select => ({
    courseId: activeCourseId,
    studentId: select.dataset.attendanceStudent,
    date,
    status: select.value
  }));
  const validations = selections.map(data => ({ data, result: validateAttendanceSubmission(data) }));
  const invalid = validations.filter(item => !item.result.valid);
  if (invalid.length) {
    const details = invalid.flatMap(item => item.result.errors).join(" ");
    return showAttendanceFeedback(`No se guardó la asistencia. ${details}`, "error");
  }

  const saved = validations.map(item => markStudentAttendance(item.data));
  if (saved.some(item => !item.saved)) {
    return showAttendanceFeedback("No se pudo guardar toda la asistencia. Revisa los estados seleccionados.", "error");
  }

  const session = prepareAttendanceSession(activeCourseId, date);
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
    $("#attendance-student-list").innerHTML = "";
    $("#save-attendance-btn").disabled = true;
    showAttendanceFeedback("");
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
    $("#grades-student-list").innerHTML = `<p class="empty-state">${escapeHtml(entry.warning || "No hay información de notas disponible.")}</p>`;
    $("#save-grades-btn").disabled = true;
    showGradesFeedback(entry.warning || "", "error");
    return;
  }

  $("#grades-student-list").innerHTML = entry.students.map(({ student, grade, alreadyRecorded }) => `
    <article class="grades-student-row ${alreadyRecorded ? "is-recorded" : ""}">
      <div><b>${escapeHtml(student.nombre)}</b><small>${alreadyRecorded ? "Nota institucional ya registrada" : "Sin nota registrada"}</small></div>
      <label>Nota
        <input type="number" min="1" max="7" step="0.1" value="${grade.grade ?? ""}" data-grade-student="${escapeHtml(student.id)}" ${alreadyRecorded ? "readonly aria-readonly=\"true\"" : ""} aria-label="Nota de ${escapeHtml(student.nombre)}" />
      </label>
      <span class="grade-entry-status">${alreadyRecorded ? `Registrada: ${Number(grade.grade).toFixed(1)}` : "Pendiente"}</span>
    </article>
  `).join("") || "<p class='empty-state'>No hay alumnos inscritos en este curso.</p>";

  const pendingCount = entry.students.filter(item => !item.alreadyRecorded).length;
  $("#save-grades-btn").disabled = pendingCount === 0;
  showGradesFeedback(entry.warning || (pendingCount ? "Ingresa notas entre 1.0 y 7.0 para los alumnos pendientes." : ""), entry.warning ? "error" : "");
}

function renderGradesRegistration(courseId) {
  const courseGrades = getCourseGrades(courseId);
  const select = $("#teacher-grade-evaluation");
  $("#grades-summary").textContent = `${courseGrades.evaluations.length} evaluación(es)`;

  if (!courseGrades.course || !courseGrades.evaluations.length) {
    select.innerHTML = "<option value=''>Sin evaluaciones oficiales</option>";
    select.disabled = true;
    renderGradeEntry(courseId, "");
    return;
  }

  select.disabled = false;
  select.innerHTML = courseGrades.evaluations.map(evaluation => `
    <option value="${escapeHtml(evaluation.id)}">${escapeHtml(evaluation.title)} · ${escapeHtml(evaluation.percentage)}%</option>
  `).join("");
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

function showMaterialFeedback(message, tone = "") {
  const feedback = $("#material-feedback");
  feedback.textContent = message;
  feedback.className = `material-feedback ${tone}`;
}

function renderCourseMaterials(courseId) {
  const courseMaterials = getCourseMaterials(courseId);
  $("#materials-summary").textContent = `${courseMaterials.materials.length} material(es)`;

  if (!courseMaterials.course) {
    $("#teacher-course-materials").innerHTML = `<p class="empty-state">${escapeHtml(courseMaterials.warning)}</p>`;
    $("#save-material-btn").disabled = true;
    showMaterialFeedback(courseMaterials.warning, "error");
    return;
  }

  $("#teacher-course-materials").innerHTML = courseMaterials.materials.map(material => `
    <article class="material-row">
      <div><b>${escapeHtml(material.title)}</b><small>${escapeHtml(material.type)}</small></div>
      ${material.url
        ? `<a href="${escapeHtml(material.url)}" target="_blank" rel="noopener noreferrer">Abrir enlace</a>`
        : "<span class='material-no-link'>Sin enlace disponible</span>"}
    </article>
  `).join("") || "<p class='empty-state'>Aún no hay materiales publicados para este curso.</p>";
}

function saveMaterial(event) {
  event.preventDefault();
  const context = prepareMaterialSubmission(activeCourseId);
  if (!context.course) {
    showMaterialFeedback(context.warning || "El curso no existe.", "error");
    return;
  }

  const data = {
    courseId: activeCourseId,
    title: $("#teacher-material-title").value,
    type: $("#teacher-material-type").value,
    url: $("#teacher-material-url").value,
    // El detalle docente usa el profesor asignado por el curso, sin crear identidades nuevas.
    authorId: context.course.professorId
  };
  const validation = validateMaterialSubmission(data);
  if (!validation.valid) {
    showMaterialFeedback(validation.errors.join(" "), "error");
    return;
  }

  const saved = saveCourseMaterial(data);
  if (!saved.saved) {
    showMaterialFeedback((saved.errors || ["No fue posible agregar el material."]).join(" "), "error");
    return;
  }

  $("#teacher-material-form").reset();
  renderCourseMaterials(activeCourseId);
  showMaterialFeedback("Material agregado correctamente.", "success");
}

function setupMaterialRegistration(courseId) {
  const typeSelect = $("#teacher-material-type");
  typeSelect.innerHTML = ALLOWED_MATERIAL_TYPES.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("");
  renderCourseMaterials(courseId);
  $("#teacher-material-form").addEventListener("submit", saveMaterial);
}

function renderCourseDetail() {
  const course = getCourseById(selectedCourseId());
  if (!course) {
    $("#teacher-course-detail").innerHTML = "<p class='empty-state'>No encontramos el curso solicitado.</p>";
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
  renderStudents(course.id);
  setupAttendanceRegistration(course.id);
  setupGradesRegistration(course.id);
  setupMaterialRegistration(course.id);
}

renderCourseDetail();
