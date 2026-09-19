import { Router } from "express";
import { login, logout } from "../controllers/auth-controller.js";

export const authRouter = Router();

// Demo local. Futura identidad federada se agregará sin cambiar este contrato público.
authRouter.post("/login", login);
authRouter.post("/logout", logout);
