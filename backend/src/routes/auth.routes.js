import { Router } from "express";
import { login } from "../controllers/auth-controller.js";

export const authRouter = Router();

// Demo local. Futura identidad federada se agregará sin cambiar este contrato público.
authRouter.post("/login", login);
