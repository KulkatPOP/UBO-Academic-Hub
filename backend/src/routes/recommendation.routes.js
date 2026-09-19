import { Router } from "express";
import { generateRecommendations, listRecommendations } from "../controllers/recommendation-controller.js";

export const recommendationRouter = Router();

recommendationRouter.get("/", listRecommendations);
recommendationRouter.post("/generate", generateRecommendations);
