import "dotenv/config";
import createApp from "./app";
import connectDB, { disconnectDB } from "./config/db";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV ?? "development"}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n  ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log("  Server closed");
      process.exit(0);
    });
    setTimeout(() => { console.error("   Force exit"); process.exit(1); }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => { console.error("💥  Unhandled Rejection:", reason); process.exit(1); });
  process.on("uncaughtException", (err) => { console.error("💥  Uncaught Exception:", err); process.exit(1); });
};

startServer();
