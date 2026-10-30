import { Pool } from "pg";
declare global { var codeMtaaniAdminPool: Pool | undefined; }
function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!global.codeMtaaniAdminPool) global.codeMtaaniAdminPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }, max: 3, connectionTimeoutMillis: 8000 });
  return global.codeMtaaniAdminPool;
}
export async function getSubmissions(filters: {type:string;status:string;search:string}) {
  const values: unknown[] = [];
  const where: string[] = [];
  if (["enquiry","career","partnership"].includes(filters.type)) { values.push(filters.type); where.push(`type = $${values.length}`); }
  if (["new","reviewing","responded","closed","rejected"].includes(filters.status)) { values.push(filters.status); where.push(`status = $${values.length}`); }
  if (filters.search.trim()) { values.push(`%${filters.search.trim().slice(0,100)}%`); where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR subject ILIKE $${values.length} OR organisation ILIKE $${values.length} OR message ILIKE $${values.length})`); }
  const clause = where.length ? "WHERE " + where.join(" AND ") : "";
  const [rows, counts] = await Promise.all([
    pool().query(`SELECT id,type,name,email,organisation,category,subject,area,link,message,status,internal_notes,created_at FROM submissions ${clause} ORDER BY created_at DESC LIMIT 200`, values),
    pool().query("SELECT type,status,COUNT(*)::int AS count FROM submissions GROUP BY type,status"),
  ]);
  return { submissions: rows.rows, counts: counts.rows };
}
export async function updateSubmission(id: string, status: string, notes: string) {
  const result = await pool().query("UPDATE submissions SET status=$2, internal_notes=$3, updated_at=NOW() WHERE id=$1 RETURNING id", [id,status,notes.trim()]);
  return result.rowCount ? result.rows[0] : null;
}
