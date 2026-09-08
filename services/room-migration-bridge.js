// Puente read-only y reversible entre una sala legacy y RoomModel.
// El catálogo definitivo de salas y estados REQUIERE APROBACIÓN INSTITUCIONAL.

import { createRoomModel } from "../data/models/room-model.js";
import { roomIdMap } from "../data/mappings/rooms-map.js";
import { getRoomById } from "./room-service.js";

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function copyRoom(room) {
  return room ? { ...room } : null;
}

function fallback(legacyRoom, warning = null) {
  return {
    usingCanonical: false,
    room: null,
    legacyRoom,
    warning
  };
}

function mappedRoomId(legacyRoom, mappings) {
  if (!Array.isArray(mappings)) return null;
  return mappings.find(entry =>
    entry && text(entry.currentRoomName) === legacyRoom && text(entry.roomId)
  )?.roomId || null;
}

/**
 * Resuelve una sala para consumo de lectura sin mutar el texto legacy.
 * roomReader y mappings son inyectables únicamente para pruebas controladas.
 */
export function resolveRoomReadOnly(legacyRoom, { enabled = false, roomReader = getRoomById, mappings = roomIdMap } = {}) {
  const legacyName = text(legacyRoom);
  if (!enabled) return fallback(legacyName);
  if (!legacyName) return fallback(null, "ROOM CANONICAL UNAVAILABLE: falta sala legacy.");

  const roomId = mappedRoomId(legacyName, mappings);
  if (!roomId) {
    return fallback(legacyName, "ROOM CANONICAL UNAVAILABLE: mapping de sala no disponible.");
  }

  let candidate;
  try {
    candidate = roomReader(roomId);
  } catch (error) {
    return fallback(legacyName, `ROOM CANONICAL UNAVAILABLE: ${error.message}`);
  }

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return fallback(legacyName, "ROOM CANONICAL UNAVAILABLE: resultado de servicio inválido.");
  }

  let room;
  try {
    room = createRoomModel(candidate);
  } catch {
    return fallback(legacyName, "ROOM CANONICAL UNAVAILABLE: modelo de sala inválido.");
  }

  if (room.roomId !== roomId) {
    return fallback(legacyName, "ROOM CANONICAL UNAVAILABLE: roomId no coincide con el mapping.");
  }

  return {
    usingCanonical: true,
    room: copyRoom(room),
    legacyRoom: legacyName,
    warning: null
  };
}
