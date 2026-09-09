import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isRepositoryPort } from "../../../UniEcosystemCore/core/ports/repository-port.js";
import {
  createUboRoomRepository,
  uboRoomRepository
} from "./core-room-repository-adapter.js";

const source = [
  { id: "room-a", nombre: "Sala A", edificio: "Edificio A", capacidad: 20, tipo: "Sala" },
  { id: "room-b", nombre: "Laboratorio B", edificio: "Edificio B", capacidad: 0, tipo: "Laboratorio" }
];
const mappings = [
  { roomId: "room-a", currentRoomName: "Sala A", status: "available" },
  { roomId: "room-b", currentRoomName: "Laboratorio B", status: "planned" }
];
const repository = createUboRoomRepository({ source, mappings });

assert.equal(isRepositoryPort(repository), true);
assert.equal(typeof repository.create, "undefined");
assert.equal(typeof repository.update, "undefined");
assert.equal(typeof repository.delete, "undefined");
assert.equal(typeof repository.save, "undefined");

assert.deepEqual(repository.list(), [
  { roomId: "room-a", name: "Sala A", building: "Edificio A", capacity: 20, status: "available", campus: null, floor: null, type: "Sala" },
  { roomId: "room-b", name: "Laboratorio B", building: "Edificio B", capacity: 0, status: "planned", campus: null, floor: null, type: "Laboratorio" }
]);
assert.deepEqual(repository.getById("room-a"), {
  roomId: "room-a",
  name: "Sala A",
  building: "Edificio A",
  capacity: 20,
  status: "available",
  campus: null,
  floor: null,
  type: "Sala"
});
assert.equal(repository.getById("room-missing"), null);
assert.equal(repository.getById(""), null);

const listed = repository.list();
listed[0].building = "Mutado";
assert.equal(source[0].edificio, "Edificio A");
assert.equal(repository.list()[0].building, "Edificio A");

const selected = repository.getById("room-a");
selected.type = "Mutado";
assert.equal(source[0].tipo, "Sala");
assert.equal(repository.getById("room-a").type, "Sala");

source[0].nombre = "Fuente mutada";
source[0].capacidad = 999;
mappings[0].status = "Mutado";
assert.equal(repository.getById("room-a").name, "Sala A");
assert.equal(repository.getById("room-a").capacity, 20);
assert.equal(repository.getById("room-a").status, "available");

assert.deepEqual(createUboRoomRepository({ source: [], mappings }).list(), []);
assert.throws(() => createUboRoomRepository({ source: null, mappings }), /room source/);
assert.throws(() => createUboRoomRepository({ source: {}, mappings }), /room source/);
assert.throws(() => createUboRoomRepository({ source: [null], mappings }), /registro inválido/);
assert.throws(
  () => createUboRoomRepository({ source: [{ id: "room-a", edificio: "Edificio" }], mappings }),
  /room source.nombre/
);
assert.throws(
  () => createUboRoomRepository({ source: [{ id: "room-a", nombre: "Sala A", edificio: "Edificio", capacidad: -1 }], mappings }),
  /capacity/
);
assert.throws(
  () => createUboRoomRepository({ source: [{ id: "room-a", nombre: "Sala A", edificio: "Edificio", capacidad: 1 }], mappings: [{ ...mappings[0], status: "" }] }),
  /room mapping.status/
);

const adapterSource = readFileSync(new URL("./core-room-repository-adapter.js", import.meta.url), "utf8");
assert.doesNotMatch(adapterSource, /localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|WebSocket|document\.|window\.|process\.env/);
assert.doesNotMatch(adapterSource, /app\.js|authorization-context|permission-policy|session-port/i);

assert.equal(uboRoomRepository.list().length, 2);
assert.equal(uboRoomRepository.getById("room-lab-302")?.capacity, 36);

console.log("core-room-repository-adapter.test.js: OK");
