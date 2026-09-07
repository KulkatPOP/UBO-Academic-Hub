// Vista DEMO de Pagos UBO.
// Consulta servicios y prepara operaciones en memoria; no procesa ni persiste transacciones.

import {
  getPayments,
  getPaymentById,
  getPaymentStatistics
} from "../../../services/payment-service.js";
import {
  getAvailablePaymentActions,
  preparePaymentAction,
  preparePayment,
  preparePaymentCancellation,
  preparePaymentRetry
} from "../../../services/payment-actions/payment-action-service.js";

const $ = selector => document.querySelector(selector);
const filters = [
  ["all", "Todos"],
  ["paid", "Pagados"],
  ["pending", "Pendientes"],
  ["failed", "Fallidos"],
  ["cancelled", "Cancelados"]
];

const demoActors = {
  STUDENT: { id: "student-sofia-martinez", role: "STUDENT", name: "Sofía Martínez" },
  TEACHER: { id: "teacher-carlos-perez", role: "TEACHER", name: "Carlos Pérez" },
  ADMIN: { id: "admin-ubo", role: "ADMIN", name: "Administrador UBO" }
};

let activeRole = "STUDENT";
let activeFilter = "all";
let searchTerm = "";

function escapeHtml(value) {
  return String(value ?? "Sin información disponible")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);
}

function activeActor() {
  return demoActors[activeRole];
}

function labelStatus(status) {
  return ({ paid: "Pagado", pending: "Pendiente", failed: "Fallido", cancelled: "Cancelado" })[status] || "Sin información disponible";
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin información disponible" : date.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

function setMessage(message = "", type = "") {
  const target = $("#payment-message");
  target.textContent = message;
  target.className = `payment-message ${type}`.trim();
}

function visiblePayments() {
  const actor = activeActor();
  const source = activeRole === "ADMIN" ? getPayments() : getPayments().filter(payment => payment.userId === actor.id);
  return source.filter(payment => {
    const query = `${payment.id} ${payment.orderId} ${payment.userId}`.toLowerCase();
    return (activeFilter === "all" || payment.status === activeFilter) && query.includes(searchTerm.toLowerCase().trim());
  });
}

function renderRoleInfo() {
  const actor = activeActor();
  const available = getAvailablePaymentActions().filter(action => action.roles.includes(actor.role));
  $("#selected-user").textContent = `${actor.name} · ${actor.role}`;
  $("#role-actions-status").innerHTML = activeRole === "ADMIN"
    ? `<b>${available.length} acciones de consulta disponibles.</b><span>Gestión futura: requiere fuente institucional.</span>`
    : `<b>${available.length} acciones disponibles.</b><span>Las operaciones se preparan sin persistencia.</span>`;
  $("#prepare-restriction").hidden = activeRole !== "ADMIN";
  $("#prepare-payment-button").disabled = activeRole === "ADMIN";
  $("#payment-order-id").disabled = activeRole === "ADMIN";
  $("#payment-amount").disabled = activeRole === "ADMIN";
  $("#payment-method").disabled = activeRole === "ADMIN";
  $("#admin-action-button").hidden = activeRole !== "ADMIN";
  $("#admin-actions-text").textContent = activeRole === "ADMIN"
    ? "Consulta de pagos y estadísticas disponible. Gestión administrativa: requiere fuente institucional."
    : "Selecciona ADMIN para visualizar el estado de esta capa.";
}

function renderStatistics() {
  const statistics = getPaymentStatistics();
  $("#stat-total").textContent = statistics.totalPayments;
  $("#stat-paid").textContent = statistics.paidPayments;
  $("#stat-pending").textContent = statistics.pendingPayments;
  $("#stat-failed").textContent = statistics.failedPayments;
  $("#stat-cancelled").textContent = statistics.cancelledPayments;
  $("#stat-amount").textContent = money(statistics.totalPaidAmount);
}

function renderFilters() {
  $("#payment-filters").innerHTML = filters.map(([value, label]) => `
    <button class="filter-button ${activeFilter === value ? "active" : ""}" type="button" data-payment-filter="${value}">${label}</button>
  `).join("");
}

function actionButtons(payment) {
  const isOwner = payment.userId === activeActor().id;
  if (activeRole === "ADMIN" || !isOwner) return "";
  const buttons = [`<button class="text-button" type="button" data-payment-action="status" data-payment-id="${escapeHtml(payment.id)}">Consultar estado</button>`];
  if (payment.status === "pending") {
    buttons.push(`<button class="secondary-button" type="button" data-payment-action="fill-payment" data-payment-id="${escapeHtml(payment.id)}">Preparar pago</button>`);
    buttons.push(`<button class="text-button danger-button" type="button" data-payment-action="cancel" data-payment-id="${escapeHtml(payment.id)}">Preparar cancelación</button>`);
  }
  if (payment.status === "failed") {
    buttons.push(`<button class="secondary-button" type="button" data-payment-action="retry" data-payment-id="${escapeHtml(payment.id)}">Preparar reintento</button>`);
  }
  return buttons.join("");
}

function paymentNote(payment) {
  if (payment.status === "paid") return "Este pago ya figura como pagado en la fuente DEMO.";
  if (payment.status === "cancelled") return "Este pago está cancelado y no se considera exitoso.";
  if (payment.status === "failed") return "Puede prepararse un reintento; no se realizará una transacción.";
  return "Pendiente de una fuente transaccional institucional.";
}

function renderPayments() {
  const payments = visiblePayments();
  $("#payments-context").textContent = activeRole === "ADMIN" ? "Vista global de solo lectura" : "Solo se muestran tus pagos demo";
  const target = $("#payment-list");
  if (!payments.length) {
    target.innerHTML = `<p class="empty-state">No hay pagos para el filtro o búsqueda seleccionados.</p>`;
    return;
  }
  target.innerHTML = payments.map(payment => `
    <article class="payment-card">
      <div class="card-top"><span class="status-badge status-${escapeHtml(payment.status)}">${escapeHtml(labelStatus(payment.status))}</span><button class="detail-button" type="button" data-payment-action="detail" data-payment-id="${escapeHtml(payment.id)}">Ver detalle</button></div>
      <h3>${escapeHtml(payment.id)}</h3>
      <dl class="payment-meta">
        <div><dt>Usuario</dt><dd>${escapeHtml(payment.userId)}</dd></div>
        <div><dt>Pedido</dt><dd>${escapeHtml(payment.orderId)}</dd></div>
        <div><dt>Fecha</dt><dd>${escapeHtml(formatDate(payment.createdAt))}</dd></div>
        <div><dt>Método</dt><dd>${escapeHtml(payment.method || "Sin información disponible")}</dd></div>
      </dl>
      <div class="payment-footer"><strong>${money(payment.amount)} ${escapeHtml(payment.currency)}</strong><span>${escapeHtml(paymentNote(payment))}</span></div>
      <div class="payment-actions">${actionButtons(payment)}</div>
    </article>
  `).join("");
}

function openDetail(paymentId) {
  const payment = getPaymentById(paymentId);
  if (!payment) {
    setMessage("El pago no existe.", "error");
    return;
  }
  $("#payment-detail-content").innerHTML = [
    ["paymentId", payment.id], ["userId", payment.userId], ["orderId", payment.orderId],
    ["Monto", `${money(payment.amount)} ${payment.currency || ""}`], ["Estado", labelStatus(payment.status)],
    ["Fecha", formatDate(payment.createdAt)], ["Método", payment.method], ["Descripción", payment.description]
  ].map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "Sin información disponible")}</dd></div>`).join("");
  $("#payment-detail-dialog").showModal();
}

function fillPaymentForm(paymentId) {
  const payment = getPaymentById(paymentId);
  if (!payment || payment.userId !== activeActor().id) {
    setMessage("El pago pertenece a otro usuario o no existe.", "error");
    return;
  }
  $("#payment-order-id").value = payment.orderId;
  $("#payment-amount").value = payment.amount;
  $("#payment-method").value = payment.method || "";
  setMessage("Datos del pago pendiente cargados. Preparar no procesará ninguna transacción.", "success");
  $("#payment-order-id").focus();
}

function showPreparedResult(result, successMessage) {
  if (!result.prepared) {
    setMessage(result.warning || "No fue posible preparar la operación.", "error");
    return;
  }
  setMessage(`${successMessage} Simulación: no se realizó ninguna transacción. Operación preparada — sin persistencia.`, "success");
  renderStatistics();
  renderPayments();
}

function submitPaymentForm(event) {
  event.preventDefault();
  if (activeRole === "ADMIN") {
    setMessage("Esta operación requiere fuente institucional.", "error");
    return;
  }
  const form = new FormData(event.currentTarget);
  const result = preparePayment({
    actor: activeActor(),
    userId: activeActor().id,
    orderId: String(form.get("orderId") || "").trim(),
    amount: form.get("amount"),
    method: String(form.get("method") || "")
  });
  showPreparedResult(result, "Pago preparado correctamente.");
}

function handleAction(action, paymentId) {
  const actor = activeActor();
  if (action === "detail") return openDetail(paymentId);
  if (action === "fill-payment") return fillPaymentForm(paymentId);
  if (action === "status") {
    return showPreparedResult(preparePaymentAction({ actor, action: "consult-payment-status", paymentId }), "Estado de pago consultado correctamente.");
  }
  if (action === "cancel") {
    return showPreparedResult(preparePaymentCancellation({ actor, paymentId }), "Cancelación preparada correctamente.");
  }
  if (action === "retry") {
    return showPreparedResult(preparePaymentRetry({ actor, paymentId }), "Reintento preparado correctamente.");
  }
  if (action === "admin-management") {
    return showPreparedResult(preparePaymentAction({ actor, action: "manage-payments" }), "");
  }
}

function setupEvents() {
  $("#payment-role").addEventListener("change", event => {
    activeRole = event.target.value;
    $("#prepare-payment-form").reset();
    renderRoleInfo();
    renderPayments();
    setMessage();
  });
  $("#payment-search").addEventListener("input", event => {
    searchTerm = event.target.value;
    renderPayments();
  });
  $("#prepare-payment-form").addEventListener("submit", submitPaymentForm);
  $("#admin-action-button").addEventListener("click", () => handleAction("admin-management"));
  $("#close-detail").addEventListener("click", () => $("#payment-detail-dialog").close());
  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-payment-filter]");
    if (filter) {
      activeFilter = filter.dataset.paymentFilter;
      renderFilters();
      renderPayments();
      return;
    }
    const action = event.target.closest("[data-payment-action]");
    if (action) handleAction(action.dataset.paymentAction, action.dataset.paymentId);
  });
}

function init() {
  renderRoleInfo();
  renderStatistics();
  renderFilters();
  renderPayments();
  setupEvents();
}

init();
