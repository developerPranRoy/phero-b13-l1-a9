import { Pool } from "pg";

let pool: Pool;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected pg pool error:", err);
      // Lazily import to avoid a circular dependency at module load time
      import("../config/db").then(({ resetConnection }) => resetConnection()).catch(() => { });
      process.exit(1);
    });
  }
  return pool;
};

export const query = <T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => getPool().query<T>(text, params);

export default getPool;
