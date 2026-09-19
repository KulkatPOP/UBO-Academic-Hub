import { Router } from "express";
import { student, studentCourse } from "../controllers/academic-intelligence-controller.js";

export const academicIntelligenceRouter = Router();
academicIntelligenceRouter.get("/student", student);
academicIntelligenceRouter.get("/student/:courseId", studentCourse);
