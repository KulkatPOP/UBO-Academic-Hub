// Servicio canónico de solo lectura para salas.
// Fuente DEMO -> mapping/adaptador -> RoomModel; no depende de interfaz ni sesión.

import { universityRooms } from "../data/university/rooms.js";
import { adaptRoom } from "./adapters/room-adapter.js";

function copy(value) {
  return value ? { ...value } : value;
}

function adaptedRooms() {
  return universityRooms.map(source => adaptRoom(source));
}

export function getRooms() {
  return adaptedRooms()
    .filter(result => result.compatible)
    .map(result => copy(result.model));
}

export function getRoomById(roomId) {
  if (typeof roomId !== "string" || !roomId.trim()) return null;

  const result = adaptedRooms().find(item => item.model?.roomId === roomId) || null;
  return result?.compatible ? copy(result.model) : null;
}
