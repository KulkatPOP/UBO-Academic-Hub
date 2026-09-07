// Fuente institucional DEMO para Biblioteca UBO.
// No está conectada a servicios, interfaces, persistencia ni autenticación.

const libraryBooks = [
  {
    id: "library-data-systems",
    isbn: "978-0-000-00001-1",
    title: "Sistemas de datos aplicados",
    author: "Autoría Demo",
    category: "Informática",
    publicationYear: 2024,
    publisher: "Editorial Académica Demo",
    type: "Libro",
    availableCopies: 3,
    totalCopies: 5,
    location: "Biblioteca demo · Estante INF-01",
    status: "available"
  },
  {
    id: "library-software-design",
    isbn: "978-0-000-00002-8",
    title: "Diseño de software universitario",
    author: "Equipo Editorial Demo",
    category: "Ingeniería de software",
    publicationYear: 2023,
    publisher: "Ediciones Campus Demo",
    type: "Libro",
    availableCopies: 0,
    totalCopies: 2,
    location: "Biblioteca demo · Estante INF-04",
    status: "unavailable"
  },
  {
    id: "library-research-guide",
    isbn: "978-0-000-00003-5",
    title: "Guía de investigación académica",
    author: "Colección Metodología Demo",
    category: "Metodología",
    publicationYear: 2025,
    publisher: "Publicaciones Educativas Demo",
    type: "Recurso digital",
    availableCopies: 8,
    totalCopies: 8,
    location: "Biblioteca demo · Colección digital",
    status: "available"
  }
];

const libraryReservations = [
  {
    id: "reservation-software-design-sofia",
    bookId: "library-software-design",
    studentId: "student-sofia-martinez",
    reservationDate: "2026-09-06",
    expirationDate: "2026-09-13",
    status: "active"
  },
  {
    id: "reservation-data-systems-sofia",
    bookId: "library-data-systems",
    studentId: "student-sofia-martinez",
    reservationDate: "2026-08-20",
    expirationDate: "2026-08-27",
    status: "expired"
  }
];

const libraryLoans = [
  {
    id: "loan-data-systems-sofia",
    bookId: "library-data-systems",
    userId: "student-sofia-martinez",
    loanDate: "2026-09-01",
    dueDate: "2026-09-15",
    returnDate: null,
    status: "active"
  },
  {
    id: "loan-research-guide-sofia",
    bookId: "library-research-guide",
    userId: "student-sofia-martinez",
    loanDate: "2026-08-10",
    dueDate: "2026-08-17",
    returnDate: "2026-08-16",
    status: "returned"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getLibraryBooks() {
  return clone(libraryBooks);
}

export function getLibraryBookById(bookId) {
  return clone(libraryBooks.find(book => book.id === bookId) || null);
}

export function getAvailableBooks() {
  return clone(libraryBooks.filter(book => book.availableCopies > 0));
}

export function getLibraryReservations() {
  return clone(libraryReservations);
}

export function getLibraryLoans() {
  return clone(libraryLoans);
}

export function getLibraryStatistics() {
  return {
    totalBooks: libraryBooks.length,
    totalCopies: libraryBooks.reduce((total, book) => total + book.totalCopies, 0),
    availableCopies: libraryBooks.reduce((total, book) => total + book.availableCopies, 0),
    activeLoans: libraryLoans.filter(loan => loan.status === "active").length,
    activeReservations: libraryReservations.filter(reservation => reservation.status === "active").length
  };
}
