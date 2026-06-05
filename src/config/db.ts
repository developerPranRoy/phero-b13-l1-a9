import { getPool } from "../db/pool";

const connectDB = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  try {
    const pool = getPool();
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() AS now");
    client.release();
    console.log(` PostgreSQL connected — server time: ${result.rows[0].now}`);
  } catch (error) {
    console.error(" PostgreSQL connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await getPool().end();
  console.log("  PostgreSQL pool closed");
};

export default connectDB;
