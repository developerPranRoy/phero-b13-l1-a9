
import "dotenv/config";
import path from "path";
import fs from "fs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS_DIR = path.join(__dirname, "../../migrations");

const ensureMigrationsTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL      PRIMARY KEY,
      filename    VARCHAR(255) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);
};

const getApplied = async (): Promise<Set<string>> => {
  const { rows } = await pool.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations ORDER BY id"
  );
  return new Set(rows.map((r) => r.filename));
};

const run = async (): Promise<void> => {
  console.log("  Running migrations...\n");

  await ensureMigrationsTable();
  const applied = await getApplied();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`   Skipping  ${file}  (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations(filename) VALUES($1)",
        [file]
      );
      await client.query("COMMIT");
      console.log(`    Applied   ${file}`);
      count++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`    Failed    ${file}:`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  if (count === 0) {
    console.log("\n  Nothing to migrate — all up to date.");
  } else {
    console.log(`\n  ${count} migration(s) applied.`);
  }

  await pool.end();
};

run();
