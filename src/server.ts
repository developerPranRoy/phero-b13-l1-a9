import "dotenv/config";
import createApp from "./app";
import connectDB from "./config/db";
import { ENV } from "./config/env";

const app = createApp();

// Vercel serverless: connect DB on first request via a lightweight middleware.
// For local dev: connect immediately and start the HTTP server.
if (ENV.IS_PROD) {
  let dbReady = false;

  // Prepend a one-time DB connection middleware for serverless cold starts
  app.use(async (_req, _res, next) => {
    if (!dbReady) {
      await connectDB();
      dbReady = true;
    }
    next();
  });
} else {
  const start = async () => {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`Server running on http://localhost:${ENV.PORT}`);
    });
  };

  start();
}

export default app;
