// Adaptador puro hacia el contrato canónico RoomModel.
// Edificio, capacidad y estados definitivos REQUIEREN APROBACIÓN INSTITUCIONAL.

import { createRoomModel } from "../../data/models/room-model.js";
import { roomIdMap } from "../../data/mappings/rooms-map.js";

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findMapping(source) {
  const name = text(source?.name) || text(source?.nombre) || text(source?.currentRoomName);
  const sourceId = text(source?.roomId) || text(source?.id);

  return roomIdMap.find(entry =>
    (sourceId && entry.roomId === sourceId) ||
    (name && entry.currentRoomName === name)
  ) || null;
}

function insufficient(reason) {
  return {
    compatible: false,
    model: null,
    warning: `REQUIERE FUENTE INSTITUCIONAL: ${reason}`
  };
}

/**
 * Convierte un snapshot legacy/DEMO a RoomModel sin mutar su entrada.
 */
export function adaptRoom(source = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return insufficient("se requiere un snapshot de sala válido.");
  }

  const mapping = findMapping(source);
  const roomId = text(source.roomId) || (mapping?.roomId ?? null);
  const name = text(source.name) || text(source.nombre) || mapping?.currentRoomName || null;
  const building = text(source.building) || text(source.edificio);
  const capacity = source.capacity ?? source.capacidad;
  const status = text(source.status) || mapping?.status || null;

  if (!roomId) return insufficient("no existe equivalencia de roomId.");
  if (!name) return insufficient("falta el nombre de la sala.");
  if (!building) return insufficient("falta el edificio de la sala.");
  if (!Number.isFinite(capacity) || capacity < 0) {
    return insufficient("falta una capacidad válida de la sala.");
  }
  if (!status) return insufficient("falta el estado de la sala.");

  return {
    compatible: true,
    model: createRoomModel({
      roomId,
      name,
      building,
      capacity,
      status,
      campus: text(source.campus),
      floor: text(source.floor) || text(source.piso),
      type: text(source.type) || text(source.tipo)
    }),
    warning: null
  };
}
