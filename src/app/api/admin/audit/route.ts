import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageStaff } from "@/lib/admin-roles";
export const runtime = "nodejs";
declare global { var codeMtaaniAuditPool: Pool | undefined; }
function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!global.codeMtaaniAuditPool) global.codeMtaaniAuditPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, connectionTimeoutMillis: 8000 });
  return global.codeMtaaniAuditPool;
}
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const q = request.nextUrl.searchParams;
    const limit = Math.min(300, Math.max(1, Number(q.get("limit")) || 150));
    const result = await db().query(`SELECT id, actor_email AS actor, action, target_type, target_id, metadata, created_at, 'audit' AS source FROM admin_audit_log
      UNION ALL
      SELECT id, 'Authentication service' AS actor, CASE WHEN succeeded THEN 'login_succeeded' ELSE 'login_failed' END AS action,
      'authentication' AS target_type, NULL AS target_id, '{}'::jsonb AS metadata, attempted_at AS created_at, 'authentication' AS source
      FROM admin_login_attempts ORDER BY created_at DESC LIMIT $1`, [limit]);
    const action = (q.get("action") || "").trim().toLowerCase();
    const search = (q.get("q") || "").trim().toLowerCase();
    const events = result.rows.filter(row => {
      const text = [row.actor,row.action,row.target_type,row.target_id,JSON.stringify(row.metadata || {})].join(" ").toLowerCase();
      return (!action || row.action.toLowerCase().includes(action)) && (!search || text.includes(search));
    });
    return NextResponse.json({ events, total: events.length, limit }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin audit log query failed:", error);
    return NextResponse.json({ error: "Unable to load the activity log. Check the staff-access database migration and database connection." }, { status: 503 });
  }
}
