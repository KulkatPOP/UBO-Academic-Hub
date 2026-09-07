// Vista DEMO de Biblioteca UBO.
// Consulta el catálogo mediante library-service y prepara acciones en memoria.

import {
  getBooks,
  getBookById,
  getAvailableBooks,
  getReservations,
  getLoans,
  getLibraryStatistics
} from "../../../services/library-service.js";
import {
  getAvailableLibraryActions,
  validateLibraryAction,
  prepareBookReservation,
  prepareReservationCancellation,
  prepareLoanRequest,
  prepareBookReturn
} from "../../../services/library-actions/library-action-service.js";

const $ = selector => document.querySelector(selector);
let activeFilter = "all";
let searchTerm = "";
let activeRole = "STUDENT";
let selectedBookId = null;

const demoActors = {
  STUDENT: { id: "student-sofia-martinez", role: "STUDENT" },
  TEACHER: { id: "teacher-carlos-perez", role: "TEACHER" },
  ADMIN: { id: "admin-ubo", role: "ADMIN" }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelStatus(status) {
  const labels = {
    available: "Disponible",
    unavailable: "No disponible",
    active: "Activo",
    returned: "Devuelto",
    expired: "Vencida"
  };
  return labels[status] || status;
}

function statusBadge(status) {
  return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(labelStatus(status))}</span>`;
}

function getCatalogSource() {
  return activeFilter === "available" ? getAvailableBooks() : getBooks();
}

function activeActor() {
  return { ...demoActors[activeRole] };
}

function actionAvailable(type) {
  return getAvailableLibraryActions()
    .some(action => action.type === type && action.roles.includes(activeRole));
}

function bookIsAvailable(bookId) {
  return getAvailableBooks().some(book => book.id === bookId);
}

function setActionMessage(message, tone = "") {
  const target = $("#library-action-message");
  target.textContent = message;
  target.className = `action-message ${tone}`.trim();
}

function renderRoleStatus() {
  const available = getAvailableLibraryActions().filter(action => action.roles.includes(activeRole));
  const target = $("#role-actions-status");
  if (activeRole === "ADMIN") {
    target.innerHTML = `<b>${available.length} acción de consulta disponible.</b><span>Las acciones administrativas requieren fuente institucional.</span>`;
    return;
  }
  target.innerHTML = `<b>${available.length} acciones disponibles.</b><span>La validación no guarda cambios.</span>`;
}

function matchesSearch(book) {
  const query = searchTerm.trim().toLocaleLowerCase("es-CL");
  if (!query) return true;
  return [book.title, book.author, book.category, book.isbn]
    .some(value => String(value).toLocaleLowerCase("es-CL").includes(query));
}

function renderStatistics() {
  const statistics = getLibraryStatistics();
  $("#stat-books").textContent = statistics.totalBooks;
  $("#stat-total-copies").textContent = statistics.totalCopies;
  $("#stat-available-copies").textContent = statistics.availableCopies;
  $("#stat-active-loans").textContent = statistics.activeLoans;
  $("#stat-active-reservations").textContent = statistics.activeReservations;
}

function renderCatalog() {
  const books = getCatalogSource().filter(matchesSearch);
  const target = $("#catalog-results");
  if (!books.length) {
    target.innerHTML = `<p class="empty-state">No hay libros disponibles para esta búsqueda.</p>`;
    return;
  }

  target.innerHTML = books.map(book => `
    <article class="book-card">
      <div class="book-card-top">
        <span class="book-cover" aria-hidden="true">⌁</span>
        ${statusBadge(book.status)}
      </div>
      <p class="book-category">${escapeHtml(book.category)}</p>
      <h3>${escapeHtml(book.title)}</h3>
      <p class="book-author">${escapeHtml(book.author)}</p>
      <dl class="book-meta">
        <div><dt>Año</dt><dd>${escapeHtml(book.publicationYear)}</dd></div>
        <div><dt>Tipo</dt><dd>${escapeHtml(book.type)}</dd></div>
        <div><dt>Editorial</dt><dd>${escapeHtml(book.publisher)}</dd></div>
        <div><dt>Ubicación</dt><dd>${escapeHtml(book.location)}</dd></div>
      </dl>
      <div class="copy-summary"><b>${escapeHtml(book.availableCopies)}</b> de ${escapeHtml(book.totalCopies)} copias disponibles</div>
      <button class="detail-button" type="button" data-book-id="${escapeHtml(book.id)}">Ver detalle <span aria-hidden="true">→</span></button>
    </article>
  `).join("");
}

function bookTitle(bookId) {
  return getBookById(bookId)?.title || "Libro no disponible";
}

function renderReservations() {
  const reservations = getReservations();
  const target = $("#reservation-list");
  if (!reservations.length) {
    target.innerHTML = `<p class="empty-state">No hay reservas disponibles.</p>`;
    return;
  }
  target.innerHTML = reservations.map(reservation => `
    <article class="operation-item">
      <div><h3>${escapeHtml(bookTitle(reservation.bookId))}</h3><p>Estudiante: ${escapeHtml(reservation.studentId)}</p></div>
      ${statusBadge(reservation.status)}
      <dl><div><dt>Reserva</dt><dd>${escapeHtml(reservation.reservationDate)}</dd></div><div><dt>Vencimiento</dt><dd>${escapeHtml(reservation.expirationDate)}</dd></div></dl>
      ${actionAvailable("cancel-reservation") && reservation.studentId === activeActor().id && reservation.status === "active" ? `<button class="prepare-button secondary" type="button" data-library-action="cancel-reservation" data-reservation-id="${escapeHtml(reservation.id)}">Cancelar reserva</button>` : ""}
    </article>
  `).join("");
}

function renderLoans() {
  const loans = getLoans();
  const target = $("#loan-list");
  if (!loans.length) {
    target.innerHTML = `<p class="empty-state">No hay préstamos disponibles.</p>`;
    return;
  }
  target.innerHTML = loans.map(loan => `
    <article class="operation-item">
      <div><h3>${escapeHtml(bookTitle(loan.bookId))}</h3><p>Usuario: ${escapeHtml(loan.userId)}</p></div>
      ${statusBadge(loan.status)}
      <dl><div><dt>Préstamo</dt><dd>${escapeHtml(loan.loanDate)}</dd></div><div><dt>Devolución prevista</dt><dd>${escapeHtml(loan.dueDate)}</dd></div><div><dt>Devolución real</dt><dd>${escapeHtml(loan.returnDate || "Sin devolución registrada")}</dd></div></dl>
      ${actionAvailable("return-book") && loan.userId === activeActor().id && loan.status === "active" ? `<button class="prepare-button secondary" type="button" data-library-action="return-book" data-loan-id="${escapeHtml(loan.id)}">Preparar devolución</button>` : ""}
    </article>
  `).join("");
}

function detailActions(book) {
  const isAvailable = bookIsAvailable(book.id);
  const actions = [];
  if (actionAvailable("consult-availability") && activeRole !== "STUDENT") {
    actions.push(`<button class="prepare-button secondary" type="button" data-library-action="consult-availability" data-book-id="${escapeHtml(book.id)}">Consultar disponibilidad</button>`);
  }
  if (actionAvailable("reserve-book") && isAvailable) {
    actions.push(`<button class="prepare-button" type="button" data-library-action="reserve-book" data-book-id="${escapeHtml(book.id)}">Reservar</button>`);
  }
  if (actionAvailable("request-loan") && isAvailable) {
    actions.push(`<button class="prepare-button" type="button" data-library-action="request-loan" data-book-id="${escapeHtml(book.id)}">Solicitar préstamo</button>`);
  }
  if (activeRole === "ADMIN") {
    actions.push(`<p class="requires-source">Acciones administrativas de Biblioteca: requiere fuente institucional.</p>`);
  }
  return actions.length ? `<div class="detail-actions">${actions.join("")}</div>` : "";
}

function showBookDetail(bookId) {
  const book = getBookById(bookId);
  selectedBookId = bookId;
  const content = $("#book-detail-content");
  if (!book) {
    content.innerHTML = `<p class="empty-state">No se encontró el libro solicitado.</p>`;
  } else {
    content.innerHTML = `
      <p class="eyebrow">DETALLE BIBLIOGRÁFICO</p>
      <h2 id="book-detail-title">${escapeHtml(book.title)}</h2>
      <p class="dialog-author">${escapeHtml(book.author)}</p>
      ${statusBadge(book.status)}
      <dl class="detail-meta">
        <div><dt>ISBN</dt><dd>${escapeHtml(book.isbn)}</dd></div>
        <div><dt>Categoría</dt><dd>${escapeHtml(book.category)}</dd></div>
        <div><dt>Año</dt><dd>${escapeHtml(book.publicationYear)}</dd></div>
        <div><dt>Editorial</dt><dd>${escapeHtml(book.publisher)}</dd></div>
        <div><dt>Tipo</dt><dd>${escapeHtml(book.type)}</dd></div>
        <div><dt>Ubicación</dt><dd>${escapeHtml(book.location)}</dd></div>
        <div><dt>Copias disponibles</dt><dd>${escapeHtml(book.availableCopies)}</dd></div>
        <div><dt>Copias totales</dt><dd>${escapeHtml(book.totalCopies)}</dd></div>
      </dl>
      ${detailActions(book)}
    `;
  }
  const dialog = $("#book-detail-dialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function prepareAction(action, dataset) {
  const actor = activeActor();
  if (action === "reserve-book") {
    return prepareBookReservation({ actor, bookId: dataset.bookId, studentId: actor.id });
  }
  if (action === "cancel-reservation") {
    return prepareReservationCancellation({ actor, reservationId: dataset.reservationId });
  }
  if (action === "request-loan") {
    return prepareLoanRequest({ actor, bookId: dataset.bookId, userId: actor.id });
  }
  if (action === "return-book") {
    return prepareBookReturn({ actor, loanId: dataset.loanId });
  }
  return validateLibraryAction({ action, actor, bookId: dataset.bookId });
}

function actionSuccessMessage(action) {
  const messages = {
    "reserve-book": "Reserva preparada correctamente.",
    "cancel-reservation": "Cancelación preparada correctamente.",
    "request-loan": "Solicitud de préstamo preparada correctamente.",
    "return-book": "Devolución preparada correctamente.",
    "consult-availability": "Disponibilidad consultada correctamente."
  };
  return messages[action] || "Acción preparada correctamente.";
}

function handleActionButton(button) {
  const action = button.dataset.libraryAction;
  const prepared = prepareAction(action, button.dataset);
  if (prepared.prepared || prepared.valid) {
    setActionMessage(`${actionSuccessMessage(action)} La operación aún no se ha guardado.`, "success");
  } else {
    setActionMessage(prepared.warning || "No fue posible preparar la acción.", "error");
  }
}

function setupEvents() {
  $("#library-search").addEventListener("input", event => {
    searchTerm = event.target.value;
    renderCatalog();
  });
  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-library-filter]");
    if (filter) {
      activeFilter = filter.dataset.libraryFilter;
      document.querySelectorAll("[data-library-filter]").forEach(button => button.classList.toggle("active", button === filter));
      renderCatalog();
      return;
    }
    const actionButton = event.target.closest("[data-library-action]");
    if (actionButton) {
      handleActionButton(actionButton);
      return;
    }
    const detail = event.target.closest("[data-book-id]");
    if (detail) showBookDetail(detail.dataset.bookId);
  });
  $("#library-role").addEventListener("change", event => {
    activeRole = event.target.value;
    renderRoleStatus();
    renderCatalog();
    renderReservations();
    renderLoans();
    if (selectedBookId && $("#book-detail-dialog").open) showBookDetail(selectedBookId);
    setActionMessage("");
  });
  $("#close-book-detail").addEventListener("click", () => $("#book-detail-dialog").close());
}

function init() {
  renderStatistics();
  renderCatalog();
  renderReservations();
  renderLoans();
  renderRoleStatus();
  setupEvents();
}

init();
