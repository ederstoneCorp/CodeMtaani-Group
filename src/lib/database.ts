import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var codeMtaaniPool: Pool | undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!global.codeMtaaniPool) {
    global.codeMtaaniPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return global.codeMtaaniPool;
}

export type SubmissionInput = {
  type: "enquiry" | "career" | "partnership";
  name: string;
  email: string;
  organisation?: string;
  category?: string;
  subject?: string;
  area?: string;
  link?: string;
  message: string;
};

export async function saveSubmission(input: SubmissionInput) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO submissions
      (type, name, email, organisation, category, subject, area, link, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, created_at`,
    [input.type,input.name,input.email,input.organisation ?? null,input.category ?? null,input.subject ?? null,input.area ?? null,input.link ?? null,input.message],
  );
  return result.rows[0] as { id: string; created_at: Date };
}
