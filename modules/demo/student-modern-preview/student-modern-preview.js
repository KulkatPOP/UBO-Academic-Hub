// Vista demo aislada de la futura experiencia institucional de estudiante.
// No usa login, router, sesión ni datos vivos de la aplicación actual.

import { createUserModel } from "../../../data/models/user-model.js";
import { courseIdMap } from "../../../data/mappings/courses-map.js";
import { getCurrentStudentCourses, getCurrentStudentProfile } from "../../../services/adapters/student-app-adapter.js";
import { checkStudentCompatibility } from "../../../services/compatibility/student-compatibility-service.js";
import { getStudentById } from "../../../services/student-service.js";

const currentStudentSnapshot = {
  username: "sofia.martinez",
  studentData: {
    name: "Sofía Martínez Rojas",
    email: "sofia.martinez@pregrado.ubo.cl",
    career: "Ingeniería Informática",
    semester: "5° semestre",
    schedule: "Diurna"
  },
  courses: [
    { id: "db", name: "Bases de Datos", grade: 6.1, attendance: 94 },
    { id: "iot", name: "Programación IoT", grade: 5.9, attendance: 89 },
    { id: "english", name: "Inglés Técnico", grade: 6.0, attendance: 92 },
    { id: "cyber", name: "Ciberseguridad", grade: 6.3, attendance: 96 }
  ]
};

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name) {
  const words = String(name || "").trim().split(/\s+/);
  return `${words[0]?.[0] || "U"}${words[1]?.[0] || "B"}`.toUpperCase();
}

function stateMarkup(compatible) {
  return `<span class="state-pill ${compatible ? "ready" : "review"}">${compatible ? "Compatible" : "Requiere revisión"}</span>`;
}

function renderHeader(profile) {
  $("preview-header").innerHTML = `
    <div class="preview-brand"><span>UNIVERSIDAD</span><strong>BERNARDO O'HIGGINS</strong></div>
    <div class="preview-user"><div><b>${escapeHtml(profile.name)}</b><small>Estudiante</small></div><span class="preview-avatar" aria-hidden="true">${initials(profile.name)}</span></div>
  `;
}

function renderModels(userModel, studentModel, profile) {
  $("profile-models").innerHTML = `
    <article class="student-card">
      <div class="student-card-head"><span class="student-avatar" aria-hidden="true">${initials(profile.name)}</span><div><p class="eyebrow">PERFIL INSTITUCIONAL</p><h2>${escapeHtml(profile.name)}</h2><p>${escapeHtml(profile.career)} · ${escapeHtml(profile.semester)} · ${escapeHtml(profile.schedule)}</p></div></div>
      <div class="model-values"><span>UserModel <b>${escapeHtml(userModel.id || "Pendiente")}</b></span><span>StudentModel <b>${escapeHtml(studentModel.id || "Pendiente")}</b></span><span>Career <b>${escapeHtml(studentModel.careerId || "Pendiente")}</b></span></div>
    </article>
  `;
}

function renderCourses(result, adaptedCourses) {
  const cards = currentStudentSnapshot.courses.map((course, index) => {
    const mapping = courseIdMap.find(item => item.currentCourseId === course.id);
    const compatible = mapping?.status === "available";
    const model = adaptedCourses[index];
    return `
      <article class="course-card ${compatible ? "available" : "pending"}">
        <div><span class="course-icon" aria-hidden="true">${compatible ? "📘" : "◷"}</span><h3>${escapeHtml(course.name)}</h3></div>
        ${stateMarkup(compatible)}
        <p>${compatible ? `Curso institucional: ${escapeHtml(mapping.institutionalCourseId)}` : "Mapeo institucional pendiente"}</p>
        <small>Modelo actual: ${escapeHtml(model.id)}</small>
      </article>
    `;
  }).join("");

  $("courses-preview").innerHTML = cards;
  $("courses-state").outerHTML = stateMarkup(result.studentModel.courses.length === currentStudentSnapshot.courses.length);
}

function renderMigration(result) {
  $("migration-state").outerHTML = stateMarkup(result.compatible);
  const essentialWarnings = result.warnings.filter(warning =>
    warning.toLowerCase().includes("notas") || warning.toLowerCase().includes("asistencia")
  );
  const warnings = essentialWarnings.length ? essentialWarnings : result.warnings;

  $("warnings-preview").innerHTML = warnings.map(warning => `
    <article class="warning-row"><span aria-hidden="true">⚠</span><p>${escapeHtml(warning)}</p></article>
  `).join("") || "<p class='empty-warning'>No hay advertencias para este perfil.</p>";
}

function renderPreview() {
  const compatibility = checkStudentCompatibility(currentStudentSnapshot);
  const institutionalStudent = getStudentById(compatibility.studentModel.id);
  const adaptedProfile = getCurrentStudentProfile({
    ...currentStudentSnapshot.studentData,
    id: compatibility.studentModel.id,
    userId: compatibility.studentModel.userId,
    careerId: compatibility.studentModel.careerId,
    courses: compatibility.studentModel.courses
  });
  const userModel = createUserModel({
    id: compatibility.studentModel.userId,
    name: institutionalStudent?.nombre || currentStudentSnapshot.studentData.name,
    email: institutionalStudent?.email || currentStudentSnapshot.studentData.email,
    role: "STUDENT"
  });
  const adaptedCourses = getCurrentStudentCourses(currentStudentSnapshot.courses);

  renderHeader(currentStudentSnapshot.studentData);
  renderModels(userModel, adaptedProfile, currentStudentSnapshot.studentData);
  renderCourses(compatibility, adaptedCourses);
  renderMigration(compatibility);
}

renderPreview();
