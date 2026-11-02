import { Pool, type PoolClient } from "pg";

declare global {
  var _cmPool: Pool | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!global._cmPool) {
    global._cmPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 8,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return global._cmPool;
}

export function db() {
  return getPool();
}

/** Run a query with automatic pool management */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const result = await getPool().query(text, params);
  return { rows: result.rows as T[], rowCount: result.rowCount };
}

/** Get a client for transactions */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}
