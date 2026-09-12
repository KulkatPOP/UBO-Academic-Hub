import assert from "node:assert/strict";
import {
  createEvaluation,
  getEvaluationSubmissions,
  getStudentEvaluations,
  gradeEvaluationSubmission,
  submitEvaluation
} from "../services/evaluation-service.js";
import { getStudentAcademicAlerts } from "../services/student-actions/student-alert-service.js";

function storage() { const values = new Map(); return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)) }; }

const local = storage();
const teacher = { id: "teacher-carlos-perez", role: "TEACHER" };
const future = "2026-10-01";
const created = createEvaluation({ courseId: "course-db-2026-1", title: "Prueba Unidad 1", description: "Modelos relacionales", type: "QUIZ", dueDate: future, identity: teacher, storage: local, now: "2026-09-11T10:00:00.000Z" });
assert.equal(created.created, true);
assert.equal(getStudentEvaluations({ studentId: "student-sofia-martinez", storage: local, now: "2026-09-11" }).evaluations.length, 1);
assert.equal(getStudentEvaluations({ studentId: "student-daniela-rios", storage: local, now: "2026-09-11" }).evaluations.length, 0);

const submitted = submitEvaluation({ evaluationId: created.evaluation.id, studentId: "student-sofia-martinez", answers: { "question-1": "Opción A" }, storage: local, now: "2026-09-11T11:00:00.000Z" });
assert.equal(submitted.submitted, true);
assert.equal(submitEvaluation({ evaluationId: created.evaluation.id, studentId: "student-sofia-martinez", answers: { "question-1": "Opción A" }, storage: local, now: "2026-09-11T11:05:00.000Z" }).submitted, false);
assert.equal(submitEvaluation({ evaluationId: created.evaluation.id, studentId: "student-daniela-rios", answers: { "question-1": "Opción A" }, storage: local, now: "2026-09-11" }).submitted, false);
assert.equal(submitEvaluation({ evaluationId: created.evaluation.id, studentId: "student-sofia-martinez", answers: { "question-1": "Opción A" }, storage: local, now: "2026-10-03" }).errors[0], "Evaluación cerrada.");

const review = getEvaluationSubmissions({ evaluationId: created.evaluation.id, identity: teacher, storage: local });
assert.equal(review.allowed, true);
assert.equal(review.submissions.length, 1);
const graded = gradeEvaluationSubmission({ submissionId: submitted.submission.id, grade: "6,2", comment: "Buen desarrollo.", identity: teacher, storage: local });
assert.equal(graded.graded, true);
assert.equal(graded.submission.grade, 6.2);
const alerts = getStudentAcademicAlerts({
  studentId: "student-sofia-martinez",
  sources: {
    grades: () => ({ grades: [] }), attendance: () => ({ courses: [] }), materials: () => ({ materials: [] }), announcements: () => ({ announcements: [] }), messages: () => ({ messages: [] }),
    evaluations: params => getStudentEvaluations({ ...params, storage: local, now: "2026-09-11" })
  }
});
assert.ok(alerts.alerts.some(alert => alert.type === "GOOD_PERFORMANCE"));
assert.equal(gradeEvaluationSubmission({ submissionId: submitted.submission.id, grade: 8, identity: teacher, storage: local }).graded, false);
assert.equal(getEvaluationSubmissions({ evaluationId: created.evaluation.id, identity: { id: "teacher-otro", role: "TEACHER" }, storage: local }).allowed, false);
console.log("EVALUATIONS_DEMO_FLOW_OK");
