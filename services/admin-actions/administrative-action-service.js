// Acciones administrativas futuras, aisladas de las interfaces actuales.
// Esta capa solo valida y prepara contextos en memoria; no ejecuta cambios.

import { hasPermission, hasRole } from "../../core/permissions.js";
import { getAdministrativeManagementData } from "../admin-service.js";

const administrativeActions = [
  {
    type: "manage-students",
    label: "Gestión de estudiantes",
    entity: "student",
    requiredPermission: "admin.users.manage",
    status: "available"
  },
  {
    type: "manage-professors",
    label: "Gestión de profesores",
    entity: "professor",
    requiredPermission: "admin.professors.manage",
    status: "available"
  },
  {
    type: "manage-careers",
    label: "Gestión de carreras",
    entity: "career",
    requiredPermission: "admin.careers.manage",
    status: "available"
  },
  {
    type: "manage-courses",
    label: "Gestión de cursos",
    entity: "course",
    requiredPermission: "admin.courses.manage",
    status: "available"
  },
  {
    type: "manage-rooms",
    label: "Gestión de salas",
    entity: "room",
    requiredPermission: "admin.rooms.manage",
    status: "available"
  },
  {
    type: "manage-schedules",
    label: "Gestión de horarios",
    entity: "schedule",
    requiredPermission: "admin.schedules.manage",
    status: "available"
  },
  {
    type: "manage-permissions",
    label: "Gestión de permisos",
    entity: "permission",
    requiredPermission: "admin.permissions.manage",
    status: "available"
  },
  {
    type: "manage-notifications",
    label: "Gestión de notificaciones",
    entity: null,
    requiredPermission: "admin.dashboard.read",
    status: "requires-source"
  },
  {
    type: "manage-reports",
    label: "Gestión de reportes",
    entity: null,
    requiredPermission: "admin.analytics.read",
    status: "requires-source"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAction(actionType) {
  return administrativeActions.find(action => action.type === actionType) || null;
}

function getEntityById(entity, entityId) {
  const management = getAdministrativeManagementData();
  const collections = {
    student: management.estudiantes,
    professor: management.profesores,
    career: management.carreras,
    course: management.cursos,
    room: management.salas,
    schedule: management.horarios
  };

  if (entity === "permission") {
    return management.permisos.includes(entityId) ? { id: entityId } : null;
  }

  return (collections[entity] || []).find(item => item.id === entityId) || null;
}

export function getAdministrativeActions() {
  return clone(administrativeActions);
}

export function getAvailableAdministrativeActions() {
  return getAdministrativeActions().filter(action => action.status === "available");
}

export function validateAdministrativeAction(data = {}) {
  const errors = [];
  const action = getAction(data.actionType);
  const actor = data.actor;

  if (!action) {
    errors.push("El tipo de acción administrativa no es válido.");
    return { valid: false, errors, action: null, entity: null };
  }

  if (!actor || !hasRole(actor, "ADMIN")) {
    errors.push("La acción requiere un usuario con rol ADMIN.");
  } else if (!hasPermission(actor, action.requiredPermission)) {
    errors.push("El usuario ADMIN no cuenta con el permiso requerido.");
  }

  if (action.status !== "available") {
    errors.push("La acción requiere migración de fuente institucional antes de poder prepararse.");
  }

  let entity = null;
  if (action.entity) {
    if (!data.entityId) {
      errors.push("Debes indicar la entidad involucrada.");
    } else {
      entity = getEntityById(action.entity, data.entityId);
      if (!entity) errors.push("La entidad indicada no existe en la fuente institucional.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    action: clone(action),
    entity: entity ? clone(entity) : null
  };
}

export function prepareAdministrativeAction(data = {}) {
  const validation = validateAdministrativeAction(data);
  if (!validation.valid) return { prepared: false, ...validation };

  return {
    prepared: true,
    action: validation.action,
    entity: validation.entity,
    // Contexto efímero: no guarda ni ejecuta operaciones administrativas.
    context: {
      actorId: data.actor.id,
      actionType: validation.action.type,
      entityId: validation.entity?.id || null
    }
  };
}
