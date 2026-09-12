import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/logger.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { integrationRouter } from "./routes/integration.routes.js";
import { lmsRouter } from "./routes/lms.routes.js";
import { recommendationRouter } from "./routes/recommendation.routes.js";
import { tutorRouter } from "./routes/tutor.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  app.use(requestLogger);

  app.get("/api/health", (request, response) => {
    response.status(200).json({
      status: "ok",
      service: config.apiName,
      architecture: "intelligent-layer"
    });
  });

  app.get("/api/database/health", async (request, response, next) => {
    try {
      response.status(200).json(await checkDatabaseConnection());
    } catch (error) {
      if (config.nodeEnv === "development") {
        response.status(503).json({ database: "unavailable" });
        return;
      }
      next(error);
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tutor", tutorRouter);
  app.use("/api/recommendations", recommendationRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/lms", lmsRouter);
  app.use("/integration", integrationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
