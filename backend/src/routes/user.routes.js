import { Router } from "express";
import { getCurrentUser, getUserById } from "../controllers/user-controller.js";
import { requireSession } from "../middleware/session-auth.js";

export const userRouter = Router();

// `/me` debe registrarse antes de `/:id` para no interpretar "me" como un id.
userRouter.get("/me", requireSession, getCurrentUser);
userRouter.get("/:id", getUserById);
