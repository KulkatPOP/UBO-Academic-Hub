import { getUserPreferences, updateUserPreferences } from "../services/user-preferences-service.js";

function userIdFrom(request) {
  return request.get("x-user-id")?.trim() || "";
}

function sendFailure(response, result) {
  if (result.validation && !result.validation.valid) {
    response.status(result.validation.code === "USER_NOT_FOUND" ? 404 : 400).json({ error: result.validation.code, message: "Preferencias inválidas." });
    return;
  }
  if (!result.user) {
    response.status(404).json({ error: "USER_NOT_FOUND", message: "Usuario no encontrado." });
  }
}

export async function getPreferences(request, response, next) {
  try {
    const userId = userIdFrom(request);
    if (!userId) return response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: "Se requiere contexto de usuario." });
    const result = await getUserPreferences(userId);
    if (!result.user) return sendFailure(response, result);
    return response.status(200).json({ source: "LMS", preferences: result.preferences });
  } catch (error) {
    return next(error);
  }
}

export async function patchPreferences(request, response, next) {
  try {
    const userId = userIdFrom(request);
    if (!userId) return response.status(401).json({ error: "USER_CONTEXT_REQUIRED", message: "Se requiere contexto de usuario." });
    const result = await updateUserPreferences(userId, request.body);
    if (!result.user || !result.validation.valid) return sendFailure(response, result);
    return response.status(200).json({ source: "LMS", preferences: result.preferences });
  } catch (error) {
    return next(error);
  }
}
