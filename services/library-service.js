// Servicio futuro de consulta para Biblioteca UBO.
// No depende de interfaz, sesión, almacenamiento ni operaciones de escritura.

import {
  getLibraryBooks,
  getLibraryBookById,
  getAvailableBooks as getAvailableLibraryBooks,
  getLibraryReservations,
  getLibraryLoans,
  getLibraryStatistics as getInstitutionalLibraryStatistics
} from "../data/university/library.js";

export function getBooks() {
  return getLibraryBooks();
}

export function getBookById(bookId) {
  return getLibraryBookById(bookId);
}

export function getAvailableBooks() {
  return getAvailableLibraryBooks();
}

export function getReservations() {
  return getLibraryReservations();
}

export function getReservationsByStudent(studentId) {
  if (!studentId) return [];
  return getLibraryReservations().filter(reservation => reservation.studentId === studentId);
}

export function getLoans() {
  return getLibraryLoans();
}

export function getLoansByUser(userId) {
  if (!userId) return [];
  return getLibraryLoans().filter(loan => loan.userId === userId);
}

export function getLoanById(loanId) {
  if (!loanId) return null;
  return getLibraryLoans().find(loan => loan.id === loanId) || null;
}

export function getLibraryStatistics() {
  return getInstitutionalLibraryStatistics();
}
