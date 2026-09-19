import { Router } from "express";
import { studentCourseProgress, studentProgress } from "../controllers/progress-controller.js";
export const progressRouter = Router();
progressRouter.get("/student", studentProgress);
progressRouter.get("/student/:courseId", studentCourseProgress);
