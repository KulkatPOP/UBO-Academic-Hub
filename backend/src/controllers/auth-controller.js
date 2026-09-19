import { authenticateDemoUser } from "../services/auth-service.js";
import { clearDemoSession, createDemoSession, getSessionCookieName, parseCookie, sessionCookieOptions } from "../services/session-service.js";

export async function login(request, response, next) {
  try {
    const user = await authenticateDemoUser(request.body);
    if (!user) {
      response.status(401).json({ success: false, message: "Credenciales inválidas" });
      return;
    }
    const session = await createDemoSession(user);
    response.cookie(getSessionCookieName(), session.token, sessionCookieOptions());
    response.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
}
export async function logout(request,response,next){try{await clearDemoSession(parseCookie(request.headers.cookie)[getSessionCookieName()]);const {maxAge,...options}=sessionCookieOptions();response.clearCookie(getSessionCookieName(),options);response.status(204).end();}catch(error){next(error)}}
