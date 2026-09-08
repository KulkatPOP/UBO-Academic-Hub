import assert from "node:assert/strict";
import { resolveRoomReadOnly } from "./room-migration-bridge.js";

const validRoom = {
  roomId: "room-lab-302",
  name: "Laboratorio 302",
  building: "Edificio de Ingeniería",
  capacity: 36,
  status: "available",
  campus: null,
  floor: null,
  type: "Laboratorio"
};

const off = resolveRoomReadOnly("Laboratorio 302", {
  enabled: false,
  roomReader: () => { throw new Error("No debe consultarse con flag OFF"); }
});
assert.equal(off.usingCanonical, false);
assert.equal(off.legacyRoom, "Laboratorio 302");

const laboratory = resolveRoomReadOnly("Laboratorio 302", { enabled: true });
assert.equal(laboratory.usingCanonical, true);
assert.equal(laboratory.room.roomId, "room-lab-302");
assert.equal(laboratory.room.name, "Laboratorio 302");

const classroom = resolveRoomReadOnly("Sala 204", { enabled: true });
assert.equal(classroom.usingCanonical, true);
assert.equal(classroom.room.roomId, "room-204");
assert.equal(classroom.room.name, "Sala 204");

const room105 = resolveRoomReadOnly("Sala 105", { enabled: true });
assert.equal(room105.usingCanonical, false);
assert.equal(room105.legacyRoom, "Sala 105");

const missing = resolveRoomReadOnly("Sala inexistente", { enabled: true });
assert.equal(missing.usingCanonical, false);
assert.equal(missing.legacyRoom, "Sala inexistente");

const invalidMapping = resolveRoomReadOnly("Laboratorio 302", {
  enabled: true,
  mappings: [{ currentRoomName: "Laboratorio 302", roomId: "room-invalid" }],
  roomReader: () => null
});
assert.equal(invalidMapping.usingCanonical, false);
assert.match(invalidMapping.warning, /resultado de servicio inválido/);

const invalidService = resolveRoomReadOnly("Laboratorio 302", {
  enabled: true,
  roomReader: () => { throw new Error("servicio no disponible"); }
});
assert.equal(invalidService.usingCanonical, false);
assert.match(invalidService.warning, /servicio no disponible/);

const invalidModel = resolveRoomReadOnly("Laboratorio 302", {
  enabled: true,
  roomReader: () => ({ ...validRoom, capacity: -1 })
});
assert.equal(invalidModel.usingCanonical, false);
assert.match(invalidModel.warning, /modelo de sala inválido/);

const defensiveSource = { ...validRoom };
const first = resolveRoomReadOnly("Laboratorio 302", {
  enabled: true,
  roomReader: () => defensiveSource
});
const second = resolveRoomReadOnly("Laboratorio 302", {
  enabled: true,
  roomReader: () => defensiveSource
});
assert.notEqual(first.room, second.room);
first.room.name = "Mutada";
assert.equal(defensiveSource.name, "Laboratorio 302");
assert.equal(second.room.name, "Laboratorio 302");

console.log("room-migration-bridge.test.js: OK");
