import assert from "node:assert/strict";
import { createAttendanceModel } from "../data/models/attendance-model.js";
import { createCourseModel } from "../data/models/course-model.js";
import { createGradeModel } from "../data/models/grade-model.js";
import { createMaterialModel } from "../data/models/material-model.js";
import { adaptAttendance } from "./adapters/attendance-adapter.js";
import { adaptCourse } from "./adapters/course-adapter.js";
import { adaptGrade } from "./adapters/grade-adapter.js";
import { adaptStudent } from "./adapters/student-adapter.js";
import { getAttendanceByCourse } from "./attendance-service.js";
import { getCourses, getCourseById } from "./course-service.js";
import { getGradesByCourse } from "./grade-service.js";
import { getMaterialsByCourse } from "./material-service.js";
import { getAssignedCourses } from "./professor-service.js";
import { getStudents, getStudentById } from "./student-service.js";

const courseInput = { students: ["student-a"], scheduleIds: ["schedule-a"] };
const courseModel = createCourseModel({ id: "course-a", students: courseInput.students });
courseInput.students.push("student-b");
assert.deepEqual(courseModel.students, ["student-a"]);

assert.deepEqual(createGradeModel(), {
  courseId: null, studentId: null, evaluation: "", grade: null, weight: null
});
assert.deepEqual(createAttendanceModel(), {
  courseId: null, studentId: null, date: null, status: null
});
assert.deepEqual(createMaterialModel(), {
  courseId: null, title: "", type: "", url: ""
});

const adapterSource = {
  id: "course-source",
  name: "Curso fuente",
  studentIds: ["student-a"],
  scheduleIds: ["schedule-a"]
};
adaptCourse(adapterSource);
adaptStudent({ name: "Estudiante fuente", courses: [{ id: "course-source" }] });
adaptGrade({ courseId: "course-source", score: 6.2 });
adaptAttendance({ courseId: "course-source", studentId: "student-a", date: "2026-09-01", status: "present" });
assert.deepEqual(adapterSource.studentIds, ["student-a"]);
assert.deepEqual(adapterSource.scheduleIds, ["schedule-a"]);

const courses = getCourses();
courses[0].studentIds.push("mutated-student");
courses[0].scheduleIds.push("mutated-schedule");
assert.ok(!getCourseById(courses[0].id).studentIds.includes("mutated-student"));
assert.ok(!getCourseById(courses[0].id).scheduleIds.includes("mutated-schedule"));
assert.equal(getCourseById("course-inexistente"), null);

const assigned = getAssignedCourses("teacher-carlos-perez");
assigned[0].studentIds.push("mutated-student");
assert.ok(!getAssignedCourses("teacher-carlos-perez")[0].studentIds.includes("mutated-student"));

const students = getStudents();
students[0].nombre = "Mutado";
assert.notEqual(getStudentById(students[0].id)?.nombre, "Mutado");

const attendance = getAttendanceByCourse("course-db-2026-1");
attendance[0].attendedClasses = 0;
assert.notEqual(getAttendanceByCourse("course-db-2026-1")[0].attendedClasses, 0);

const materials = getMaterialsByCourse("course-db-2026-1");
materials[0].title = "Mutado";
assert.notEqual(getMaterialsByCourse("course-db-2026-1")[0].title, "Mutado");

const evaluations = getGradesByCourse("course-db-2026-1");
const originalScore = evaluations[0].grades[0].score;
evaluations[0].grades[0].score = 0;
assert.equal(getGradesByCourse("course-db-2026-1")[0].grades[0].score, originalScore);

console.log("academic-hardening.test.js: OK");
