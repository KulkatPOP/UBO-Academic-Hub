import { Router } from "express";
import { resolve } from "../controllers/course-identity-controller.js";

export const courseIdentityRouter = Router();

courseIdentityRouter.get("/resolve", resolve);
