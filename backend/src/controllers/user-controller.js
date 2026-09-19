import { getPublicUserById } from "../services/user-service.js";

function requestedUserId(request) {
  const value = request.get("x-user-id");
  return typeof value === "string" ? value.trim() : "";
}

function sendUserNotFound(response) {
  response.status(404).json({ error: "USER_NOT_FOUND", message: "Usuario no encontrado." });
}

export async function getUserById(request, response, next) {
  try {
    const user = await getPublicUserById(request.params.id);
    if (!user) {
      sendUserNotFound(response);
      return;
    }
    response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Contexto demo transitorio: la identidad llega por x-user-id hasta que exista
 * autenticación institucional. No sustituye controles de autorización reales.
 */
export async function getCurrentUser(request, response, next) {
  try {
    const userId = requestedUserId(request);
    if (!userId) {
      response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: "Se requiere contexto de usuario." });
      return;
    }

    const user = await getPublicUserById(userId);
    if (!user) {
      sendUserNotFound(response);
      return;
    }
    response.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
