import "express-async-errors"; // must be first — patches express to catch async errors
import express, { Application } from "express";
import cors from "cors";
import apiRoutes from "./routes";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";

const createApp = (): Application => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRoutes);

  app.get("/", (_req, res) => {
    res.json({ message: "🎓 MediQueue API", version: "1.0.0" });
  });

  app.use(notFoundHandler);

  app.use(globalErrorHandler);

  return app;
};

export default createApp;
