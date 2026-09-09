// Adapter institucional UBO read-only hacia los contratos genéricos del Core.

import { createRoomModel } from "../../../UniEcosystemCore/data/models/room-model.js";
import { roomIdMap } from "../../data/mappings/rooms-map.js";
import { universityRooms } from "../../data/university/rooms.js";

function requiredText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} debe ser un string no vacío.`);
  }

  return value.trim();
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldName} debe ser un array.`);
  }
}

function copyRoom(room) {
  return { ...room };
}

function resolveRoom(sourceRoom, mappings) {
  if (!sourceRoom || typeof sourceRoom !== "object" || Array.isArray(sourceRoom)) {
    throw new TypeError("room source contiene un registro inválido.");
  }

  const sourceId = requiredText(sourceRoom.id, "room source.id");
  const sourceName = requiredText(sourceRoom.nombre, "room source.nombre");
  const mapping = mappings.find((entry) =>
    entry &&
    entry.roomId === sourceId &&
    entry.currentRoomName === sourceName
  );

  if (!mapping) {
    throw new TypeError(`No existe mapping Room aprobado para ${sourceId}.`);
  }

  return Object.freeze(createRoomModel({
    roomId: requiredText(mapping.roomId, "room mapping.roomId"),
    name: requiredText(mapping.currentRoomName, "room mapping.currentRoomName"),
    building: requiredText(sourceRoom.edificio, "room source.edificio"),
    capacity: sourceRoom.capacidad,
    status: requiredText(mapping.status, "room mapping.status"),
    type: sourceRoom.tipo
  }));
}

/**
 * Implementa RepositoryPort mediante un snapshot UBO inyectable de solo lectura.
 * Las fuentes o mappings inválidos se rechazan con TypeError/RangeError;
 * un ID no encontrado devuelve null.
 */
export function createUboRoomRepository({ source = universityRooms, mappings = roomIdMap } = {}) {
  assertArray(source, "room source");
  assertArray(mappings, "room mappings");

  const rooms = Object.freeze(source.map((room) => resolveRoom(room, mappings)));

  return Object.freeze({
    list() {
      return rooms.map(copyRoom);
    },

    getById(roomId) {
      if (typeof roomId !== "string" || roomId.trim() === "") return null;

      const room = rooms.find((item) => item.roomId === roomId.trim());
      return room ? copyRoom(room) : null;
    }
  });
}

export const uboRoomRepository = createUboRoomRepository();
