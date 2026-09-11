import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getStudentAcademicAlerts } from "../services/student-actions/student-alert-service.js";

const sofia = "student-sofia-martinez";
const db = "course-db-2026-1";
const iot = "course-iot-2026-1";

const sources = {
  attendance: () => ({ available: true, courses: [
    { courseId: db, registered: 4, percentage: 50, records: [{ id: "attendance-db", date: "2026-09-12", createdAt: "2026-09-12T10:00:00.000Z" }] },
    { courseId: iot, registered: 2, percentage: 100, records: [{ id: "attendance-iot", date: "2026-09-11", createdAt: "2026-09-11T10:00:00.000Z" }] }
  ] }),
  grades: () => ({ available: true, grades: [
    { id: "grade-low", courseId: db, value: 3.8, createdAt: "2026-09-13T10:00:00.000Z" },
    { id: "grade-good", courseId: iot, value: 6.2, createdAt: "2026-09-14T10:00:00.000Z" }
  ] }),
  materials: () => ({ available: true, materials: [
    { id: "material-db", courseId: db, title: "<script>alert(1)</script>", createdAt: "2026-09-15T10:00:00.000Z" }
  ] }),
  announcements: () => ({ available: true, announcements: [
    { id: "announcement-db", courseId: db, title: "Aviso", createdAt: "2026-09-16T10:00:00.000Z" }
  ] })
};

const result = getStudentAcademicAlerts({ studentId: sofia, sources });
assert.equal(result.available, true);
assert.equal(result.alerts.length, 5);
assert.equal(result.alerts[0].type, "ATTENDANCE_WARNING");
assert.equal(result.alerts[0].severity, "HIGH");
assert.equal(result.alerts[1].type, "GRADE_WARNING");
assert.equal(result.alerts[1].severity, "MEDIUM");
assert.ok(result.alerts.some(item => item.type === "GOOD_PERFORMANCE"));
assert.ok(result.alerts.some(item => item.type === "NEW_MATERIAL"));
assert.ok(result.alerts.some(item => item.type === "NEW_ANNOUNCEMENT"));
assert.ok(result.alerts.every(item => [db, iot].includes(item.courseId)));
assert.ok(result.alerts.every(item => !item.description.includes("<script>")));
assert.deepEqual(getStudentAcademicAlerts({ studentId: sofia, sources }), result);

const capped = getStudentAcademicAlerts({
  studentId: sofia,
  sources: {
    ...sources,
    attendance: () => ({ available: true, courses: [
      { courseId: db, registered: 2, percentage: 50, records: [{ id: "attendance-db", date: "2026-09-12", createdAt: "2026-09-12T10:00:00.000Z" }] },
      { courseId: iot, registered: 2, percentage: 60, records: [{ id: "attendance-iot", date: "2026-09-12", createdAt: "2026-09-12T11:00:00.000Z" }] }
    ] })
  }
});
assert.equal(capped.alerts.length, 5);

const byCourse = getStudentAcademicAlerts({ studentId: sofia, courseId: db, sources });
assert.equal(byCourse.available, true);
assert.ok(byCourse.alerts.length > 0);
assert.ok(byCourse.alerts.every(item => item.courseId === db));
assert.equal(getStudentAcademicAlerts({ studentId: sofia, courseId: "course-missing", sources }).available, false);
assert.equal(getStudentAcademicAlerts({ studentId: "student-missing", sources }).available, false);

const partial = getStudentAcademicAlerts({
  studentId: sofia,
  sources: { ...sources, grades: () => { throw new Error("corrupt"); } }
});
assert.equal(partial.available, true);
assert.ok(partial.alerts.some(item => item.type === "ATTENDANCE_WARNING"));
assert.ok(partial.warnings.some(item => item.source === "notas"));

const none = getStudentAcademicAlerts({
  studentId: sofia,
  storage: null,
  sources: {
    attendance: () => ({ available: true, courses: [] }),
    grades: () => ({ available: true, grades: [] }),
    materials: () => ({ available: true, materials: [] }),
    announcements: () => ({ available: true, announcements: [] })
  }
});
assert.equal(none.available, true);
assert.deepEqual(none.alerts, []);

result.alerts[0].title = "alterado";
assert.notEqual(getStudentAcademicAlerts({ studentId: sofia, sources }).alerts[0].title, "alterado");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const renderer = appSource.slice(appSource.indexOf("function renderStudentAcademicAlerts"), appSource.indexOf("const phase188RenderScreen"));
assert.match(renderer, /\.textContent=/);
assert.doesNotMatch(renderer, /\.innerHTML/);
assert.equal(typeof getStudentAcademicAlerts.createTeacherGrade, "undefined");
assert.equal(typeof getStudentAcademicAlerts.saveTeacherAttendance, "undefined");

console.log("STUDENT_ALERTS_OK");
console.log("STUDENT_ALERTS_READ_ONLY_OK");
console.log("STUDENT_ALERTS_ISOLATION_OK");
console.log("STUDENT_ALERTS_PRIORITY_OK");
console.log("STUDENT_ALERTS_XSS_SAFE");
console.log("STUDENT_ALERTS_DEGRADATION_OK");
console.log("student-alert.test.js: OK");
