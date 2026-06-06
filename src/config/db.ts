import { getPool } from "../db/pool";
import { ENV } from "./env";

let connected = false;

export const resetConnection = (): void => {
  connected = false;
};

const connectDB = async (): Promise<void> => {
  if (connected) return;

  if (!ENV.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  try {
    const pool = getPool();
    const client = await pool.connect();

    await client.query("SELECT NOW()");
    client.release();

    connected = true;
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    throw error;
  }
};

export default connectDB;
