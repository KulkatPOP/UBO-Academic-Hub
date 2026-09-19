import { Router } from "express";
import { getMaterial, listMaterialsByCourse } from "../controllers/material-controller.js";

export const materialRouter = Router({ mergeParams: true });

materialRouter.get("/", listMaterialsByCourse);
materialRouter.get("/:id", getMaterial);
