import { Router } from "express";
import { getCourse, listCourseStudents, listCourses } from "../controllers/course-controller.js";

export const courseRouter = Router();

courseRouter.get("/", listCourses);
courseRouter.get("/:id/students", listCourseStudents);
courseRouter.get("/:id", getCourse);
