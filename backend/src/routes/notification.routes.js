import { Router } from "express";
import { listNotifications, readAllNotifications, readNotification, unreadCount } from "../controllers/notification-controller.js";

export const notificationRouter = Router();
notificationRouter.get("/", listNotifications);
notificationRouter.get("/unread-count", unreadCount);
notificationRouter.patch("/read-all", readAllNotifications);
notificationRouter.patch("/:id/read", readNotification);
