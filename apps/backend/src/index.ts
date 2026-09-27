import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/user_routes/user.routes.js";
import { sendError } from "./utils/common/response.js";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Global Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "backend-auth",
  });
});

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/users", userRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  sendError(res, 404, "API endpoint not found");
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Global Error:", err);
  sendError(
    res,
    err.status || 500,
    err.message || "Internal server error",
    process.env.NODE_ENV === "development" ? err.stack : undefined
  );
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/health`);
});

export default app;
