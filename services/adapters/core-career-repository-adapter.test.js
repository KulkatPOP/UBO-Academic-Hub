import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isRepositoryPort } from "../../../UniEcosystemCore/core/ports/repository-port.js";
import {
  createUboCareerRepository,
  uboCareerRepository
} from "./core-career-repository-adapter.js";

const source = [
  { id: "career-a", nombre: "Carrera A", studentIds: ["student-a"] },
  { id: "career-b", nombre: "Carrera B", studentIds: [] }
];
const mappings = [
  { careerId: "career-a", currentCareer: "Carrera A", status: "available" },
  { careerId: "career-b", currentCareer: "Carrera B", status: "planned" }
];
const repository = createUboCareerRepository({ source, mappings });

assert.equal(isRepositoryPort(repository), true);
assert.equal(typeof repository.create, "undefined");
assert.equal(typeof repository.update, "undefined");
assert.equal(typeof repository.delete, "undefined");
assert.equal(typeof repository.save, "undefined");

assert.deepEqual(repository.list(), [
  { careerId: "career-a", name: "Carrera A", status: "available", facultyId: null, degreeType: null },
  { careerId: "career-b", name: "Carrera B", status: "planned", facultyId: null, degreeType: null }
]);
assert.deepEqual(repository.getById("career-a"), {
  careerId: "career-a",
  name: "Carrera A",
  status: "available",
  facultyId: null,
  degreeType: null
});
assert.equal(repository.getById("career-missing"), null);
assert.equal(repository.getById(""), null);

const firstList = repository.list();
firstList[0].name = "Mutada";
assert.equal(source[0].nombre, "Carrera A");
assert.equal(repository.list()[0].name, "Carrera A");

const selected = repository.getById("career-a");
selected.status = "Mutado";
assert.equal(source[0].id, "career-a");
assert.equal(repository.getById("career-a").status, "available");

source[0].nombre = "Fuente mutada";
mappings[0].status = "Mutado";
assert.deepEqual(repository.list(), [
  { careerId: "career-a", name: "Carrera A", status: "available", facultyId: null, degreeType: null },
  { careerId: "career-b", name: "Carrera B", status: "planned", facultyId: null, degreeType: null }
]);
assert.equal(repository.getById("career-a").name, "Carrera A");
assert.equal(repository.getById("career-a").status, "available");

assert.deepEqual(createUboCareerRepository({ source: [], mappings }).list(), []);
assert.throws(
  () => createUboCareerRepository({ source: [{ id: "career-x", nombre: "Sin mapping" }], mappings }),
  /mapping Career/
);
assert.throws(
  () => createUboCareerRepository({ source: [{}], mappings }),
  /career source.id/
);
assert.throws(() => createUboCareerRepository({ source: null, mappings }), /career source/);
assert.throws(() => createUboCareerRepository({ source: {}, mappings }), /career source/);
assert.throws(() => createUboCareerRepository({ source: [null], mappings }), /registro inválido/);
assert.throws(
  () => createUboCareerRepository({ source: [{ id: "career-a" }], mappings }),
  /career source.nombre/
);
assert.throws(
  () => createUboCareerRepository({ source: [{ id: "career-a", nombre: "Carrera A" }], mappings: [{ ...mappings[0], status: "" }] }),
  /career mapping.status/
);

const adapterSource = readFileSync(new URL("./core-career-repository-adapter.js", import.meta.url), "utf8");
assert.doesNotMatch(adapterSource, /localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|WebSocket|document\.|window\./);
assert.doesNotMatch(adapterSource, /app\.js|authorization-context|permission-policy|session-port/i);

assert.equal(uboCareerRepository.list().length, 2);
assert.equal(uboCareerRepository.getById("career-informatica")?.name, "Ingeniería Informática");

console.log("core-career-repository-adapter.test.js: OK");
