import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { ROLE_DEFINITIONS } from "@/lib/admin-roles";
import { query } from "@/lib/db";
import { ensureMasterSchema } from "@/lib/master-schema-sync";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  await ensureMasterSchema();

  try {
    // Count active staff by role in database
    const countResult = await query<{ role: string; count: number; active_count: number }>(
      `SELECT role,
              COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE active = TRUE)::int AS active_count
       FROM admin_users
       GROUP BY role`
    );

    const countsMap = new Map<string, { total: number; active: number }>();
    countResult.rows.forEach((r) => {
      countsMap.set(r.role, { total: r.count, active: r.active_count });
    });

    const rolesList = Object.values(ROLE_DEFINITIONS).map((def) => {
      const counts = countsMap.get(def.key) || { total: 0, active: 0 };
      return {
        ...def,
        userCount: counts.total,
        activeUserCount: counts.active,
      };
    });

    // Sort by level (1 to 5) then title
    rolesList.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));

    return NextResponse.json(
      {
        roles: rolesList,
        userRole: session.role,
        isSuperAdmin: session.role === "super_admin",
      },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error: unknown) {
    console.error("Roles GET failed:", error);
    const err = error as { message?: string };
    return NextResponse.json({ error: `Unable to load roles: ${err.message || "Database error."}` }, { status: 500 });
  }
}
