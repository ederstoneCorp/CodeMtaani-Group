import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  canEdit,
  canManageStaff,
  canExport,
  canManageProjects,
  canManageContent,
  canManageMembers,
  canManageEnquiries,
  canManageResearch,
  canManageEvents,
  canManageSettings,
} from "@/lib/admin-roles";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  return NextResponse.json(
    {
      user: {
        id: session.id,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        scope: session.scope,
      },
      permissions: {
        edit: canEdit(session),
        manageStaff: canManageStaff(session),
        export: canExport(session),
        manageProjects: canManageProjects(session),
        manageContent: canManageContent(session),
        manageMembers: canManageMembers(session),
        manageEnquiries: canManageEnquiries(session),
        manageResearch: canManageResearch(session),
        manageEvents: canManageEvents(session),
        manageSettings: canManageSettings(session),
      },
    },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}
