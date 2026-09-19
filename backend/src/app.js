import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/logger.js";
import { requireSession } from "./middleware/session-auth.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { integrationRouter } from "./routes/integration.routes.js";
import { lmsRouter } from "./routes/lms.routes.js";
import { materialRouter } from "./routes/material.routes.js";
import { recommendationRouter } from "./routes/recommendation.routes.js";
import { intelligentRecommendationRouter } from "./routes/intelligent-recommendation.routes.js";
import { tutorRouter } from "./routes/tutor.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { courseRouter } from "./routes/course.routes.js";
import { courseIdentityRouter } from "./routes/course-identity.routes.js";
import { evaluationRouter, submissionRouter } from "./routes/evaluation.routes.js";
import { messageRouter } from "./routes/message.routes.js";
import { qrAttendanceRouter } from "./routes/qr-attendance.routes.js";
import { userPreferencesRouter } from "./routes/user-preferences.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { progressRouter } from "./routes/progress.routes.js";
import { academicIntelligenceRouter } from "./routes/academic-intelligence.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4173", "http://127.0.0.1:4173"], credentials: true }));
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
  app.use("/api/users", userRouter);
  app.use("/api/user", requireSession, userPreferencesRouter);
  app.use("/api/notifications", requireSession, notificationRouter);
  app.use("/api/progress", requireSession, progressRouter);
  app.use("/api/intelligence", requireSession, academicIntelligenceRouter);
  app.use("/api/courses", requireSession, courseRouter);
  app.use("/api/course-identity", courseIdentityRouter);
  app.use("/api/courses/:courseId/materials", requireSession, materialRouter);
  app.use("/api/materials", requireSession, materialRouter);
  app.use("/api/tutor", requireSession, tutorRouter);
  app.use("/api/recommendations", requireSession, recommendationRouter);
  app.use("/api/recommendations", requireSession, intelligentRecommendationRouter);
  app.use("/api/evaluations", requireSession, evaluationRouter);
  app.use("/api/submissions", requireSession, submissionRouter);
  app.use("/api/messages", requireSession, messageRouter);
  app.use("/api/attendance", requireSession, qrAttendanceRouter);
  app.use("/api/analytics", requireSession, analyticsRouter);
  app.use("/api/lms", requireSession, lmsRouter);
  app.use("/integration", integrationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
