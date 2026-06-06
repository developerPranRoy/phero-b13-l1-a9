import "express-async-errors";
import express, { Application } from "express";
import cors from "cors";
import apiRoutes from "./routes";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";
import { ENV } from "./config/env";

const createApp = (): Application => {
  const app = express();

  // CORS: use explicit origin list in production, open in development
  const allowedOrigins = ENV.CLIENT_URL
    ? ENV.CLIENT_URL.split(",").map((s) => s.trim())
    : null;

  app.use(cors({
    origin: allowedOrigins ?? "*",
    credentials: !!allowedOrigins,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRoutes);

  app.get("/", (_req, res) => {
    res.json({ message: "MediQueue API", status: "OK" });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
