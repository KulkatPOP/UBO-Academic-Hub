import assert from "node:assert/strict";
import { getCareers, getCareerById } from "./career-service.js";
import { getRooms, getRoomById } from "./room-service.js";
import { getSchedules, getScheduleById } from "./schedule-service.js";

const careers = getCareers();
assert.ok(careers.length > 0);
assert.equal(careers[0].careerId, "career-informatica");
assert.equal(getCareerById("career-informatica")?.name, "Ingeniería Informática");
assert.equal(getCareerById("career-inexistente"), null);
careers[0].name = "Mutada";
assert.equal(getCareerById("career-informatica").name, "Ingeniería Informática");

const rooms = getRooms();
assert.ok(rooms.length > 0);
assert.equal(rooms[0].roomId, "room-lab-302");
assert.equal(getRoomById("room-lab-302")?.capacity, 36);
assert.equal(getRoomById("room-inexistente"), null);
rooms[0].building = "Mutado";
assert.equal(getRoomById("room-lab-302").building, "Edificio de Ingeniería");

const schedules = getSchedules();
assert.ok(schedules.length > 0);
assert.ok(schedules.every(item => item.compatible === false));
assert.ok(schedules.every(item => item.model === null));
assert.ok(schedules.every(item => item.warning.startsWith("REQUIERE FUENTE INSTITUCIONAL:")));
assert.equal(getScheduleById("schedule-db-monday")?.compatible, false);
assert.equal(getScheduleById("schedule-inexistente"), null);
schedules[0].warning = "Mutada";
assert.ok(getScheduleById("schedule-db-monday").warning.startsWith("REQUIERE FUENTE INSTITUCIONAL:"));

console.log("canonical-read-services.test.js: OK");
