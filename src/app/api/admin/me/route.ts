import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canEdit, canManageStaff } from "@/lib/admin-roles";
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  return NextResponse.json({ user: { email: session.email, fullName: session.fullName, role: session.role, scope: session.scope }, permissions: { edit: canEdit(session), manageStaff: canManageStaff(session), export: session.role !== "viewer" } }, { headers: { "Cache-Control": "no-store, private" } });
}
