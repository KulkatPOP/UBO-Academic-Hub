// Vista DEMO de Casino UBO.
// Consulta datos mediante casino-service y prepara acciones solamente en memoria.

import {
  getMenu,
  getMenuItemById,
  getAvailableMenuItems,
  getCasinoHours,
  getOrders,
  getOrdersByUser,
  getConsumptionByUser,
  getCasinoStatistics
} from "../../../services/casino-service.js";
import {
  getAvailableCasinoActions,
  prepareCasinoAction,
  prepareOrder,
  prepareOrderCancellation,
  prepareMenuAvailability
} from "../../../services/casino-actions/casino-action-service.js";

const $ = selector => document.querySelector(selector);
let activeFilter = "all";
let searchTerm = "";
let activeRole = "STUDENT";
let cart = [];

const demoActors = {
  STUDENT: { id: "student-sofia-martinez", role: "STUDENT", name: "Sofía Martínez Rojas" },
  TEACHER: { id: "teacher-carlos-perez", role: "TEACHER", name: "Carlos Pérez" },
  ADMIN: { id: "admin-ubo", role: "ADMIN", name: "Administrador UBO" }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
}

function activeActor() {
  return { ...demoActors[activeRole] };
}

function labelStatus(status) {
  return { pending: "Pendiente", confirmed: "Confirmado", completed: "Completado", cancelled: "Cancelado", open: "Abierto", closed: "Cerrado" }[status] || status;
}

function actionAvailable(type) {
  return getAvailableCasinoActions().some(action => action.type === type && action.roles.includes(activeRole));
}

function setActionMessage(message, tone = "") {
  const target = $("#casino-action-message");
  target.textContent = message;
  target.className = `action-message ${tone}`.trim();
}

function menuSource() {
  if (activeFilter === "available") return getAvailableMenuItems();
  if (activeFilter.startsWith("category:")) {
    const category = activeFilter.slice("category:".length);
    return getMenu().filter(item => item.category === category);
  }
  return getMenu();
}

function matchesSearch(item) {
  const query = searchTerm.trim().toLocaleLowerCase("es-CL");
  if (!query) return true;
  return [item.name, item.description, item.category, item.mealType]
    .some(value => String(value).toLocaleLowerCase("es-CL").includes(query));
}

function renderRoleInfo() {
  const actor = activeActor();
  $("#selected-user").textContent = `${actor.name} · ${actor.role}`;
  const available = getAvailableCasinoActions().filter(action => action.roles.includes(activeRole));
  $("#role-actions-status").innerHTML = activeRole === "ADMIN"
    ? `<b>${available.length} acciones de consulta disponibles.</b><span>Gestión futura: requiere fuente institucional.</span>`
    : `<b>${available.length} acciones disponibles.</b><span>La validación no guarda cambios.</span>`;
  $("#admin-cart-note").hidden = activeRole !== "ADMIN";
  $("#admin-actions-text").textContent = activeRole === "ADMIN"
    ? "Consulta de pedidos disponible. Gestión administrativa: requiere fuente institucional."
    : "Selecciona ADMIN para visualizar el estado de esta capa.";
}

function renderStatistics() {
  const statistics = getCasinoStatistics();
  $("#stat-menu").textContent = statistics.totalMenuItems;
  $("#stat-available").textContent = statistics.availableMenuItems;
  $("#stat-orders").textContent = statistics.totalOrders;
  $("#stat-active-orders").textContent = statistics.activeOrders;
  $("#stat-consumption").textContent = statistics.totalConsumptionRecords;
  $("#stat-revenue").textContent = money(statistics.totalRevenue);
}

function renderFilters() {
  const categories = [...new Set(getMenu().map(item => item.category))];
  const entries = [
    ["all", "Todos"],
    ["available", "Disponibles"],
    ...categories.map(category => [`category:${category}`, category[0].toUpperCase() + category.slice(1)])
  ];
  $("#menu-filters").innerHTML = entries.map(([value, label]) => `
    <button class="filter-button ${activeFilter === value ? "active" : ""}" type="button" data-menu-filter="${escapeHtml(value)}">${escapeHtml(label)}</button>
  `).join("");
}

function renderMenu() {
  const items = menuSource().filter(matchesSearch);
  const target = $("#menu-results");
  if (!items.length) {
    target.innerHTML = `<p class="empty-state">No hay productos para esta búsqueda o filtro.</p>`;
    return;
  }
  target.innerHTML = items.map(item => `
    <article class="menu-card">
      <div class="menu-card-top"><span class="category-badge">${escapeHtml(item.category)}</span><span class="availability ${item.available ? "available" : "unavailable"}">${item.available ? "Disponible" : "No disponible"}</span></div>
      <h3>${escapeHtml(item.name)}</h3>
      <p class="menu-description">${escapeHtml(item.description)}</p>
      <dl class="menu-meta">
        <div><dt>Tipo de comida</dt><dd>${escapeHtml(item.mealType)}</dd></div>
        <div><dt>Alérgenos</dt><dd>${item.allergens.length ? escapeHtml(item.allergens.join(", ")) : "Sin alérgenos declarados"}</dd></div>
      </dl>
      <div class="menu-price">${money(item.price)}</div>
      <div class="menu-actions">
        <button class="text-button" type="button" data-casino-action="availability" data-menu-item-id="${escapeHtml(item.id)}">Consultar disponibilidad</button>
        <button class="add-button" type="button" data-cart-action="add" data-menu-item-id="${escapeHtml(item.id)}" ${item.available && activeRole !== "ADMIN" ? "" : "disabled"}>Agregar</button>
      </div>
    </article>
  `).join("");
}

function cartItem(itemId) {
  return cart.find(item => item.menuItemId === itemId) || null;
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + (getMenuItemById(item.menuItemId)?.price || 0) * item.quantity, 0);
}

function renderCart() {
  const target = $("#cart-items");
  $("#cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cart-total").textContent = money(cartTotal());
  if (!cart.length) {
    target.innerHTML = `<p class="empty-state compact-empty">Agrega productos disponibles para preparar un pedido.</p>`;
    return;
  }
  target.innerHTML = cart.map(item => {
    const product = getMenuItemById(item.menuItemId);
    if (!product) return "";
    const subtotal = product.price * item.quantity;
    return `<article class="cart-item"><div><h3>${escapeHtml(product.name)}</h3><p>${money(product.price)} c/u · Subtotal ${money(subtotal)}</p></div><div class="quantity-control"><button type="button" aria-label="Disminuir ${escapeHtml(product.name)}" data-cart-action="decrease" data-menu-item-id="${escapeHtml(product.id)}">−</button><b>${item.quantity}</b><button type="button" aria-label="Aumentar ${escapeHtml(product.name)}" data-cart-action="increase" data-menu-item-id="${escapeHtml(product.id)}">+</button></div><button class="remove-button" type="button" data-cart-action="remove" data-menu-item-id="${escapeHtml(product.id)}">Eliminar</button></article>`;
  }).join("");
}

function updateCart(action, itemId) {
  const product = getMenuItemById(itemId);
  if (!product) {
    setActionMessage("No se encontró el producto solicitado.", "error");
    return;
  }
  if (action === "add") {
    if (!product.available) {
      setActionMessage("El producto no está disponible.", "error");
      return;
    }
    const existing = cartItem(itemId);
    if (existing) existing.quantity += 1;
    else cart = [...cart, { menuItemId: itemId, quantity: 1 }];
  }
  if (action === "increase") cartItem(itemId).quantity += 1;
  if (action === "decrease") {
    const existing = cartItem(itemId);
    if (existing.quantity > 1) existing.quantity -= 1;
    else cart = cart.filter(item => item.menuItemId !== itemId);
  }
  if (action === "remove") cart = cart.filter(item => item.menuItemId !== itemId);
  renderCart();
}

function orderItemsMarkup(order) {
  return order.items.map(item => {
    const product = getMenuItemById(item.menuItemId);
    return `<li>${escapeHtml(product?.name || item.menuItemId)} · ${escapeHtml(item.quantity)} × ${money(product?.price || 0)}</li>`;
  }).join("");
}

function visibleOrders() {
  return activeRole === "ADMIN" ? getOrders() : getOrdersByUser(activeActor().id);
}

function renderOrders() {
  const orders = visibleOrders();
  $("#orders-context").textContent = activeRole === "ADMIN" ? "Vista administrativa de solo lectura" : "Tus pedidos demo";
  const target = $("#order-list");
  if (!orders.length) {
    target.innerHTML = `<p class="empty-state">No hay pedidos para el usuario seleccionado.</p>`;
    return;
  }
  target.innerHTML = orders.map(order => `
    <article class="order-item"><div><h3>${escapeHtml(order.id)}</h3><p>${escapeHtml(order.orderDate)} · ${activeRole === "ADMIN" ? `Usuario: ${escapeHtml(order.userId)}` : ""}</p></div><span class="status-badge status-${escapeHtml(order.status)}">${escapeHtml(labelStatus(order.status))}</span><ul>${orderItemsMarkup(order)}</ul><div class="order-footer"><strong>${money(order.total)}</strong>${activeRole !== "ADMIN" && ["pending", "confirmed"].includes(order.status) ? `<button class="text-button" type="button" data-casino-action="cancel-order" data-order-id="${escapeHtml(order.id)}">Preparar cancelación</button>` : ""}</div></article>
  `).join("");
}

function renderHours() {
  $("#hours-list").innerHTML = getCasinoHours().map(hour => `
    <article class="hour-item"><div><h3>${escapeHtml(hour.mealType)}</h3><p>${escapeHtml(hour.day)}</p></div><div><b>${escapeHtml(hour.openingTime)} – ${escapeHtml(hour.closingTime)}</b><span class="status-badge status-${escapeHtml(hour.status)}">${escapeHtml(labelStatus(hour.status))}</span></div></article>
  `).join("");
}

function renderConsumption() {
  const target = $("#consumption-list");
  if (activeRole === "ADMIN") {
    const statistics = getCasinoStatistics();
    target.innerHTML = `<p class="admin-consumption">Consulta general: ${escapeHtml(statistics.totalConsumptionRecords)} registros de consumo demo.</p>`;
    return;
  }
  const records = getConsumptionByUser(activeActor().id);
  target.innerHTML = records.length ? records.map(record => `
    <article class="consumption-item"><b>${escapeHtml(record.mealType)}</b><span>${escapeHtml(record.date)}</span><small>Pedido: ${escapeHtml(record.orderId)}</small></article>
  `).join("") : `<p class="empty-state">No hay consumos para el usuario seleccionado.</p>`;
}

function handleCasinoAction(action, dataset = {}) {
  const actor = activeActor();
  if (action === "availability") return prepareMenuAvailability({ actor, itemId: dataset.menuItemId });
  if (action === "cancel-order") return prepareOrderCancellation({ actor, orderId: dataset.orderId });
  return prepareCasinoAction({ actor, action });
}

function showActionResult(action, result) {
  if (!result.prepared) {
    setActionMessage(result.warning || "No fue posible preparar la acción.", "error");
    return;
  }
  const messages = {
    availability: "Disponibilidad consultada correctamente.",
    "cancel-order": "Cancelación preparada. El pedido todavía no ha sido modificado."
  };
  setActionMessage(`${messages[action] || "Acción preparada correctamente."} ${action === "availability" ? "" : ""}`.trim(), "success");
}

function prepareCurrentOrder() {
  const actor = activeActor();
  const result = prepareOrder({ actor, userId: actor.id, items: cart.map(item => ({ ...item })) });
  if (!result.prepared) {
    setActionMessage(result.warning || "No fue posible preparar el pedido.", "error");
    return;
  }
  setActionMessage(`Pedido preparado correctamente. El pedido todavía no se ha guardado. Total demo: ${money(result.data.total)}.`, "success");
}

function setupEvents() {
  $("#menu-search").addEventListener("input", event => {
    searchTerm = event.target.value;
    renderMenu();
  });
  $("#casino-role").addEventListener("change", event => {
    activeRole = event.target.value;
    renderRoleInfo();
    renderMenu();
    renderOrders();
    renderConsumption();
    setActionMessage("");
  });
  $("#prepare-order").addEventListener("click", prepareCurrentOrder);
  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-menu-filter]");
    if (filter) {
      activeFilter = filter.dataset.menuFilter;
      renderFilters();
      renderMenu();
      return;
    }
    const cartAction = event.target.closest("[data-cart-action]");
    if (cartAction) {
      updateCart(cartAction.dataset.cartAction, cartAction.dataset.menuItemId);
      return;
    }
    const actionButton = event.target.closest("[data-casino-action]");
    if (actionButton) showActionResult(actionButton.dataset.casinoAction, handleCasinoAction(actionButton.dataset.casinoAction, actionButton.dataset));
  });
}

function init() {
  renderRoleInfo();
  renderStatistics();
  renderFilters();
  renderMenu();
  renderCart();
  renderOrders();
  renderHours();
  renderConsumption();
  setupEvents();
}

init();
