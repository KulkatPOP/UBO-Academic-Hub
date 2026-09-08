import assert from "node:assert/strict";
import { adaptCareer } from "./career-adapter.js";
import { adaptRoom } from "./room-adapter.js";
import { adaptSchedule } from "./schedule-adapter.js";

const careerSource = { nombre: "Ingeniería Informática", metadata: { source: "demo" } };
const career = adaptCareer(careerSource);
assert.equal(career.compatible, true);
assert.equal(career.model.careerId, "career-informatica");
assert.equal(career.model.status, "available");
career.model.name = "Mutado";
assert.equal(careerSource.nombre, "Ingeniería Informática");
assert.equal(adaptCareer({ nombre: "Carrera sin equivalencia" }).compatible, false);
assert.equal(adaptCareer({ careerId: "career-x", status: "available" }).compatible, false);
assert.equal(adaptCareer({ careerId: "career-x", nombre: "Carrera Demo" }).compatible, false);
assert.equal(adaptCareer({ nombre: "Ingeniería Informática", status: "" }).compatible, true);

const roomSource = {
  nombre: "Laboratorio 302",
  edificio: "Edificio de Ingeniería",
  capacidad: 36,
  metadata: { source: "demo" }
};
const room = adaptRoom(roomSource);
assert.equal(room.compatible, true);
assert.equal(room.model.roomId, "room-lab-302");
assert.equal(room.model.capacity, 36);
room.model.building = "Mutado";
assert.equal(roomSource.edificio, "Edificio de Ingeniería");
assert.equal(adaptRoom({ ...roomSource, capacidad: -1 }).compatible, false);
assert.equal(adaptRoom({ nombre: "Laboratorio 302", capacidad: 36 }).compatible, false);
assert.equal(adaptRoom({ edificio: "Edificio", capacidad: 36 }).compatible, false);

const scheduleSource = {
  id: "schedule-db-monday",
  courseId: "course-db-2026-1",
  roomId: "room-lab-302",
  day: "lunes",
  time: "08:30 - 10:00",
  status: "active",
  nested: { source: "demo" }
};
const schedule = adaptSchedule(scheduleSource);
assert.equal(schedule.compatible, true);
assert.equal(schedule.model.startTime, "08:30");
assert.equal(schedule.model.endTime, "10:00");
schedule.model.dayOfWeek = "martes";
assert.equal(scheduleSource.day, "lunes");
assert.equal(adaptSchedule({ ...scheduleSource, status: "" }).compatible, false);
assert.equal(adaptSchedule({ ...scheduleSource, time: "10:00 - 08:30" }).compatible, false);
assert.equal(adaptSchedule({ ...scheduleSource, roomId: "" }).compatible, false);

console.log("canonical-adapters.test.js: OK");
