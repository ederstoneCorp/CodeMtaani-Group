import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageMembers, audit } from "@/lib/admin-roles";
import { getAllMembers, updateMemberStatus, getMemberCounts } from "@/lib/members";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams;
    const status = q.get("status") || undefined;
    const [members, counts] = await Promise.all([
      getAllMembers(status),
      getMemberCounts(),
    ]);

    return NextResponse.json({ members, counts }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin members GET failed:", error);
    return NextResponse.json({ error: "Unable to load members." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageMembers(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "");

    const validStatuses = ["pending", "active", "inactive", "suspended"];
    if (!/^[0-9a-f-]{36}$/i.test(id) || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid member update." }, { status: 400 });
    }

    const updated = await updateMemberStatus(id, status);
    if (!updated) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    await audit(session, "member_status_updated", "member", id, { status });
    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Admin member update failed:", error);
    return NextResponse.json({ error: "Unable to update member." }, { status: 500 });
  }
}
