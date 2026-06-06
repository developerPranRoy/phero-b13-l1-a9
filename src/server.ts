import "dotenv/config";
import createApp from "./app";
import connectDB from "./config/db";
import { ENV } from "./config/env";

const app = createApp();

export default app;

if (ENV.NODE_ENV !== "production") {
  const start = async () => {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`Server running on http://localhost:${ENV.PORT}`);
    });
  };

  start();
}
