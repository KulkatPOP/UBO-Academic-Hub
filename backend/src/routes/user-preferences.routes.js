import { Router } from "express";
import { getPreferences, patchPreferences } from "../controllers/user-preferences-controller.js";

export const userPreferencesRouter = Router();
userPreferencesRouter.get("/preferences", getPreferences);
userPreferencesRouter.patch("/preferences", patchPreferences);
