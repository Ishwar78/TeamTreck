import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

import { superAdminRoutes } from "./routes/superAdmin.routes";
import { authRoutes } from "./routes/auth.routes";
import { companyRoutes } from "./routes/company.routes";
import { sessionRoutes } from "./routes/session.routes";
import { activityRoutes } from "./routes/activity.routes";
import { screenshotRoutes } from "./routes/screenshot.routes";
import { adminRoutes } from "./routes/admin.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { publicRoutes } from "./routes/public.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { claimRoutes } from "./routes/claim.routes";
import { reportRoutes } from "./routes/reports.routes";
import { taskRoutes } from "./routes/task.routes";
import { notificationRoutes } from "./routes/notification.routes";

const app = express();


app.set("trust proxy", 1);

/* ================= SECURITY ================= */
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

/* ================= BODY PARSER ================= */
app.use(express.json({ limit: "5mb" }));

/* ================= CORS ================= */
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:3005",
 "https://multiclout.in",
"https://www.multiclout.in",
   "http://multiclout.in",
  "https://www.mbbsgyan.com",
  ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((o) => o.trim()) : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || !env.CORS_ORIGIN) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* ================= STATIC ================= */
app.use("/uploads", express.static("uploads"));

/* ================= RATE LIMIT ================= */
app.use(rateLimiter);

/* ================= HEALTH ================= */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/sessions", sessionRoutes);

/* 🔥 FIXED ACTIVITY ROUTE */
app.use("/api/activity", activityRoutes);

app.use("/api/agent/screenshots", screenshotRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

/* ================= ERROR HANDLER ================= */
app.use(errorHandler);

export default app;