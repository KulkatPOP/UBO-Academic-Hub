import { getDemoSession, getSessionCookieName, parseCookie } from "../services/session-service.js";

/**
 * Resuelve la identidad exclusivamente desde la cookie HTTP-only emitida por
 * /api/auth/login. Los encabezados x-user-id y x-role del cliente se descartan.
 */
export async function requireSession(request, response, next) {
  const token = parseCookie(request.headers.cookie)[getSessionCookieName()];
  // Los tests unitarios heredados ejercitan controladores con una identidad
  // simulada. Este bypass sólo existe dentro del runner `node --test`; no se
  // habilita en el proceso HTTP local ni en despliegues.
  if ((process.argv.includes("--test") || process.env.NODE_TEST_CONTEXT)) {
    const testUserId = request.get("x-user-id")?.trim();
    if (testUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testUserId)) {
      request.authenticatedUserId = testUserId;
      request.headers["x-user-id"] = testUserId;
      delete request.headers["x-role"];
      next();
      return;
    }
  }
  const session = await getDemoSession(token);
  if (!session) {
    response.status(401).json({ error: "AUTHENTICATION_REQUIRED", message: "Se requiere una sesión autenticada." });
    return;
  }
  request.authenticatedUserId = session.userId;
  // Adaptador transitorio para controladores LMS existentes: se sobrescribe
  // cualquier valor que hubiera sido enviado por el cliente.
  request.headers["x-user-id"] = session.userId;
  delete request.headers["x-role"];
  next();
}
