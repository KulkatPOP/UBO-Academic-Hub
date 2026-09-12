export function notFoundHandler(request, response) {
  response.status(404).json({ error: "NOT_FOUND", message: "Ruta no encontrada." });
}

export function errorHandler(error, request, response, next) { // eslint-disable-line no-unused-vars
  console.error(error);
  response.status(500).json({ error: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." });
}
