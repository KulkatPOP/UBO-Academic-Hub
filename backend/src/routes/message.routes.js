import { Router } from "express";
import { course, detail, list, read, unread } from "../controllers/message-controller.js";
export const messageRouter = Router();
messageRouter.get("/", list); messageRouter.get("/unread-count", unread); messageRouter.post("/course/:courseId", course); messageRouter.get("/:id", detail); messageRouter.post("/:id/read", read);
