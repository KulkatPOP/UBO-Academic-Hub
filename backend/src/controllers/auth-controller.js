import { authenticateDemoUser } from "../services/auth-service.js";

export async function login(request, response, next) {
  try {
    const user = await authenticateDemoUser(request.body);
    if (!user) {
      response.status(401).json({ success: false, message: "Credenciales inválidas" });
      return;
    }
    response.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
}
