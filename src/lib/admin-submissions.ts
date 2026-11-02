import { query } from "./db";

type Filters = { type: string; status: string; search: string; allowedTypes: string[] };
function buildWhere(filters: Filters) {
  const values: unknown[] = [filters.allowedTypes];
  const where = ["type = ANY($1::text[])"];
  if (["enquiry","career","partnership"].includes(filters.type) && filters.allowedTypes.includes(filters.type)) { values.push(filters.type); where.push(`type = $${values.length}`); }
  if (["new","reviewing","responded","closed","rejected"].includes(filters.status)) { values.push(filters.status); where.push(`status = $${values.length}`); }
  if (filters.search.trim()) { values.push(`%${filters.search.trim().slice(0,100)}%`); where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR subject ILIKE $${values.length} OR organisation ILIKE $${values.length} OR message ILIKE $${values.length})`); }
  return { clause: "WHERE " + where.join(" AND "), values };
}
export async function getSubmissions(filters: Filters) {
  const { clause, values } = buildWhere(filters);
  const [rows, counts] = await Promise.all([
    query(`SELECT id,type,name,email,organisation,category,subject,area,link,message,status,internal_notes,created_at FROM submissions ${clause} ORDER BY created_at DESC LIMIT 200`, values),
    query(`SELECT type,status,COUNT(*)::int AS count FROM submissions ${clause} GROUP BY type,status`, values),
  ]);
  return { submissions: rows.rows, counts: counts.rows };
}
export async function updateSubmission(id: string, status: string, notes: string, allowedTypes: string[]) {
  const result = await query("UPDATE submissions SET status=$2, internal_notes=$3, updated_at=NOW() WHERE id=$1 AND type = ANY($4::text[]) RETURNING id", [id,status,notes.trim(),allowedTypes]);
  return result.rowCount ? result.rows[0] : null;
}
export async function exportSubmissions(filters: Filters) {
  const { clause, values } = buildWhere(filters);
  const result = await query<Record<string, unknown>>(`SELECT id,type,name,email,organisation,category,subject,area,link,message,status,internal_notes,created_at,updated_at FROM submissions ${clause} ORDER BY created_at DESC LIMIT 5000`, values);
  return result.rows;
}
