import { Router } from "express";
import { ask, history } from "../controllers/tutor-controller.js";

export const tutorRouter = Router();

// El usuario se resuelve exclusivamente desde x-user-id; no se acepta role ni userId en query/body.
tutorRouter.post("/ask", ask);
tutorRouter.get("/history", history);
