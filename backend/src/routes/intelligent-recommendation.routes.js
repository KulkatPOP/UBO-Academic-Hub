import { Router } from "express";
import { intelligentCourseRecommendations, intelligentRecommendations } from "../controllers/intelligent-recommendation-controller.js";

export const intelligentRecommendationRouter = Router();
intelligentRecommendationRouter.get("/intelligent", intelligentRecommendations);
intelligentRecommendationRouter.get("/intelligent/:courseId", intelligentCourseRecommendations);
