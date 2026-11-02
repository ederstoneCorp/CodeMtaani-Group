import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canViewAudit } from "@/lib/admin-roles";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function sanitizeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canViewAudit(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const format = q.get("format");
    const limit = Math.min(500, Math.max(1, Number(q.get("limit")) || 200));

    const result = await query<{
      id: string;
      actor: string;
      staff_number: string | null;
      action: string;
      target_type: string | null;
      target_id: string | null;
      metadata: Record<string, unknown>;
      previous_state: Record<string, unknown> | null;
      new_state: Record<string, unknown> | null;
      ip_address: string | null;
      created_at: string;
      source: string;
    }>(
      `SELECT id::text, actor_email AS actor, staff_number, action, target_type, target_id,
              metadata, previous_state, new_state, ip_address, created_at, 'audit' AS source
       FROM admin_audit_log
       UNION ALL
       SELECT id::text, 'Security Gateway' AS actor, NULL AS staff_number,
              CASE WHEN succeeded THEN 'login_succeeded' ELSE 'login_failed' END AS action,
              'authentication' AS target_type, NULL AS target_id, '{}'::jsonb AS metadata,
              NULL AS previous_state, NULL AS new_state, NULL AS ip_address, attempted_at AS created_at,
              'authentication' AS source
       FROM admin_login_attempts
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    const action = (q.get("action") || "").trim().toLowerCase();
    const search = (q.get("q") || "").trim().toLowerCase();
    const targetType = (q.get("targetType") || "").trim().toLowerCase();

    const filtered = result.rows.filter((row) => {
      const matchAction = !action || row.action.toLowerCase().includes(action);
      const matchType = !targetType || (row.target_type && row.target_type.toLowerCase() === targetType);
      const text = [
        row.actor,
        row.staff_number || "",
        row.action,
        row.target_type || "",
        row.target_id || "",
        JSON.stringify(row.metadata || {}),
      ].join(" ").toLowerCase();
      const matchSearch = !search || text.includes(search);
      return matchAction && matchType && matchSearch;
    });

    // CSV Export option
    if (format === "csv") {
      const headers = ["Timestamp", "Actor", "Staff Number", "Action", "Target Type", "Target ID", "Details"];
      const rows = filtered.map((e) => [
        new Date(e.created_at).toISOString(),
        e.actor,
        e.staff_number || "N/A",
        e.action,
        e.target_type || "N/A",
        e.target_id || "N/A",
        JSON.stringify(e.metadata || {}),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.map(sanitizeCsv).join(","))].join("\r\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="CodeMtaani-Audit-Log-${Date.now()}.csv"`,
          "Cache-Control": "no-store, private",
        },
      });
    }

    // Security Intelligence Summary
    const failedLogins = filtered.filter((e) => e.action === "login_failed").length;
    const staffModifications = filtered.filter((e) => e.action.startsWith("staff_")).length;
    const roleChanges = filtered.filter((e) => e.action === "staff_updated" && JSON.stringify(e.metadata).includes("role")).length;

    return NextResponse.json(
      {
        events: filtered,
        total: filtered.length,
        intelligence: {
          failedLoginsInView: failedLogins,
          staffModifications,
          roleChanges,
          securityAlertActive: failedLogins >= 5,
        },
      },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("Admin audit query failed:", error);
    return NextResponse.json({ error: "Unable to retrieve audit trail." }, { status: 500 });
  }
}
