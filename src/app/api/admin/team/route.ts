import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageStaff, audit } from "@/lib/admin-roles";
import { getAllTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/team";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const members = await getAllTeamMembers();
    return NextResponse.json({ members }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin team GET failed:", error);
    return NextResponse.json({ error: "Unable to load team members." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const fullName = String(body.full_name || "").trim();
    const roleTitle = String(body.role_title || "").trim();

    if (!fullName || !roleTitle) {
      return NextResponse.json({ error: "Full name and role title are required." }, { status: 400 });
    }

    const member = await createTeamMember({
      full_name: fullName,
      role_title: roleTitle,
      department: body.department || null,
      bio: body.bio || null,
      avatar_url: body.avatar_url || null,
      skills: Array.isArray(body.skills) ? body.skills : [],
      social_links: typeof body.social_links === "object" && body.social_links !== null ? body.social_links : {},
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== false,
    });

    await audit(session, "team_member_created", "team_member", member.id, { name: member.full_name });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Admin team member create failed:", error);
    return NextResponse.json({ error: "Unable to create team member." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid team member ID." }, { status: 400 });
    }

    const updated = await updateTeamMember(id, body);
    if (!updated) return NextResponse.json({ error: "Team member not found." }, { status: 404 });

    await audit(session, "team_member_updated", "team_member", id);
    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Admin team member update failed:", error);
    return NextResponse.json({ error: "Unable to update team member." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const id = q.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid team member ID." }, { status: 400 });
    }

    const success = await deleteTeamMember(id);
    if (!success) return NextResponse.json({ error: "Team member not found." }, { status: 404 });

    await audit(session, "team_member_deleted", "team_member", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin team member delete failed:", error);
    return NextResponse.json({ error: "Unable to delete team member." }, { status: 500 });
  }
}
