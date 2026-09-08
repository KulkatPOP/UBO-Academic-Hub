import assert from "node:assert/strict";
import { createCareerModel } from "./career-model.js";
import { createEnrollmentModel, getEnrollmentUniquenessKey } from "./enrollment-model.js";
import { createRoomModel } from "./room-model.js";
import { createScheduleModel } from "./schedule-model.js";
import { createEvaluationModel } from "./evaluation-model.js";

const career = createCareerModel({ careerId: "career-demo", name: "Carrera Demo", status: "active" });
assert.deepEqual(career, { careerId: "career-demo", name: "Carrera Demo", status: "active", facultyId: null, degreeType: null });
assert.throws(() => createCareerModel({ name: "Carrera", status: "active" }), /careerId/);

const enrollment = createEnrollmentModel({ enrollmentId: "enrollment-demo", studentId: "student-demo", courseId: "course-demo", period: "2026-1", status: "active" });
assert.equal(enrollment.withdrawnAt, null);
assert.equal(getEnrollmentUniquenessKey(enrollment), "student-demo::course-demo::2026-1");
assert.throws(() => createEnrollmentModel({ enrollmentId: "x", studentId: "s", courseId: "c", period: "p" }), /status/);

const room = createRoomModel({ roomId: "room-demo", name: "Sala Demo", building: "Edificio Demo", capacity: 0, status: "available" });
assert.equal(room.capacity, 0);
assert.throws(() => createRoomModel({ roomId: "r", name: "n", building: "b", capacity: -1, status: "available" }), /capacity/);

const schedule = createScheduleModel({ scheduleId: "schedule-demo", courseId: "course-demo", roomId: "room-demo", dayOfWeek: "lunes", startTime: "08:30", endTime: "10:00", status: "active" });
assert.equal(schedule.period, null);
assert.throws(() => createScheduleModel({ ...schedule, endTime: "08:30" }), /posterior/);
assert.throws(() => createScheduleModel({ ...schedule, startTime: "8:30" }), /HH:mm/);

const evaluation = createEvaluationModel({ evaluationId: "evaluation-demo", courseId: "course-demo", title: "Evaluación Demo", weight: 0, status: "planned" });
assert.equal(evaluation.weight, 0);
assert.throws(() => createEvaluationModel({ ...evaluation, weight: 101 }), /weight/);
assert.throws(() => createEvaluationModel({ ...evaluation, evaluationId: "" }), /evaluationId/);

const first = createCareerModel({ careerId: "career-a", name: "A", status: "active" });
const second = createCareerModel({ careerId: "career-b", name: "B", status: "active" });
first.name = "Mutado";
assert.equal(second.name, "B");

console.log("canonical-models.test.js: OK");
