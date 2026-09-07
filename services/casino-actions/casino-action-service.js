// Acciones futuras de Casino UBO.
// Esta capa solo prepara y valida contextos en memoria; no crea pedidos ni pagos.

import {
  getMenu,
  getMenuItemById,
  getAvailableMenuItems,
  getOrders
} from "../casino-service.js";

const casinoActions = [
  { type: "consult-menu", roles: ["STUDENT", "TEACHER", "ADMIN"], status: "available" },
  { type: "consult-availability", roles: ["STUDENT", "TEACHER", "ADMIN"], status: "available" },
  { type: "consult-orders", roles: ["ADMIN"], status: "available" },
  { type: "create-order", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "cancel-order", roles: ["STUDENT", "TEACHER"], status: "available" },
  { type: "manage-casino-orders", roles: ["ADMIN"], status: "requires-source" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionDefinition(type) {
  return casinoActions.find(action => action.type === type) || null;
}

function actorFor(data = {}) {
  return data.actor && typeof data.actor === "object" ? data.actor : null;
}

function result(valid, action, warning = null, data = null) {
  return {
    valid,
    action: action ? clone(action) : null,
    warning,
    data: data ? clone(data) : null
  };
}

function validateActor(action, data) {
  const actor = actorFor(data);
  if (!actor?.id || !actor?.role) return "Debes indicar un actor demo con id y rol.";
  if (!action.roles.includes(actor.role)) return "El rol indicado no puede preparar esta acción.";
  return null;
}

function validateOwnership(actor, userId) {
  return actor?.id === userId
    ? null
    : "La operación solo puede prepararse para el registro del propio usuario.";
}

function prepareOrderItems(items) {
  if (!Array.isArray(items) || !items.length) {
    return { warning: "Debes indicar al menos un producto para preparar el pedido.", items: null };
  }

  const preparedItems = [];
  for (const item of items) {
    if (!item?.menuItemId) {
      return { warning: "Cada producto debe indicar menuItemId.", items: null };
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { warning: "La cantidad de cada producto debe ser un entero mayor que cero.", items: null };
    }
    const menuItem = getMenuItemById(item.menuItemId);
    if (!menuItem) return { warning: "No se encontró uno de los productos solicitados.", items: null };
    if (!menuItem.available) return { warning: "Uno de los productos solicitados no está disponible.", items: null };
    preparedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      subtotal: menuItem.price * item.quantity
    });
  }
  return { warning: null, items: preparedItems };
}

export function getAvailableCasinoActions() {
  return clone(casinoActions.filter(action => action.status === "available"));
}

export function validateCasinoAction(data = {}) {
  const action = actionDefinition(data.action);
  if (!action) return result(false, null, "La acción de Casino no es válida.");

  const actorWarning = validateActor(action, data);
  if (actorWarning) return result(false, action, actorWarning);
  if (action.status !== "available") {
    return result(false, action, "La acción requiere una fuente administrativa antes de poder prepararse.");
  }

  const actor = actorFor(data);

  if (action.type === "consult-menu") {
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      menu: getMenu()
    });
  }

  if (action.type === "consult-availability") {
    if (data.itemId) {
      const item = getMenuItemById(data.itemId);
      if (!item) return result(false, action, "No se encontró el producto solicitado.");
      return result(true, action, "Validación demo pendiente de autenticación institucional.", {
        item,
        available: item.available
      });
    }
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      availableItems: getAvailableMenuItems()
    });
  }

  if (action.type === "consult-orders") {
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      orders: getOrders()
    });
  }

  if (action.type === "create-order") {
    if (!data.userId) return result(false, action, "Debes indicar userId.");
    const ownershipWarning = validateOwnership(actor, data.userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    const prepared = prepareOrderItems(data.items);
    if (prepared.warning) return result(false, action, prepared.warning);
    const total = prepared.items.reduce((sum, item) => sum + item.subtotal, 0);
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      userId: data.userId,
      items: prepared.items,
      total
    });
  }

  if (action.type === "cancel-order") {
    if (!data.orderId) return result(false, action, "Debes indicar orderId.");
    const order = getOrders().find(item => item.id === data.orderId);
    if (!order) return result(false, action, "No se encontró el pedido solicitado.");
    const ownershipWarning = validateOwnership(actor, order.userId);
    if (ownershipWarning) return result(false, action, ownershipWarning);
    if (!["pending", "confirmed"].includes(order.status)) {
      return result(false, action, "El estado actual del pedido no permite preparar su cancelación.");
    }
    return result(true, action, "Validación demo pendiente de autenticación institucional.", {
      order
    });
  }

  return result(false, action, "La acción no tiene una preparación disponible.");
}

export function prepareCasinoAction(data = {}) {
  const validation = validateCasinoAction(data);
  return validation.valid ? { prepared: true, ...validation } : { prepared: false, ...validation };
}

export function prepareOrder(data = {}) {
  return prepareCasinoAction({ ...data, action: "create-order" });
}

export function prepareOrderCancellation(data = {}) {
  return prepareCasinoAction({ ...data, action: "cancel-order" });
}

export function prepareMenuAvailability(data = {}) {
  return prepareCasinoAction({ ...data, action: "consult-availability" });
}
