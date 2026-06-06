import "express-async-errors";
import express, { Application } from "express";
import cors from "cors";
import apiRoutes from "./routes";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";

const createApp = (): Application => {
  const app = express();

  // CORS: credentials require an explicit origin, not a wildcard
  const clientUrl = process.env.CLIENT_URL;
  app.use(cors({
    origin: clientUrl ? clientUrl.split(",").map((s) => s.trim()) : false,
    credentials: true,
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