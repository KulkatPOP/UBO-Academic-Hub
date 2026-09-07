// Adaptador futuro entre datos actuales de ramos y CourseModel.
// La transformación es pura y no modifica el objeto de origen.

import { createCourseModel } from "../../data/models/course-model.js";

function identifierFrom(value, fallback) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

export function adaptCourse(currentCourse = {}) {
  const students = currentCourse.students || currentCourse.studentIds || [];
  const schedule = currentCourse.scheduleId || currentCourse.scheduleIds || currentCourse.schedule || null;

  return createCourseModel({
    id: currentCourse.id || identifierFrom(currentCourse.name || currentCourse.nombre, "course-unknown"),
    name: currentCourse.name || currentCourse.nombre || "",
    code: currentCourse.code || currentCourse.codigo || "",
    teacherId: currentCourse.teacherId || currentCourse.professorId || identifierFrom(currentCourse.teacher || currentCourse.professor, "teacher-unknown"),
    careerId: currentCourse.careerId || identifierFrom(currentCourse.career || currentCourse.carrera, "career-unknown"),
    students: Array.isArray(students) ? students.map(student => typeof student === "string" ? student : student?.id).filter(Boolean) : [],
    roomId: currentCourse.roomId || identifierFrom(currentCourse.room || currentCourse.sala, "room-unknown"),
    scheduleId: Array.isArray(schedule) ? schedule[0] || null : schedule
  });
}
