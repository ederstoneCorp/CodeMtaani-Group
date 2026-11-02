import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageAnnouncements } from "@/lib/admin-roles";
import { createAnnouncement, getAnnouncements, markAnnouncementAsRead } from "@/lib/communication";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const announcements = await getAnnouncements(session.id, session.department);
    return NextResponse.json({ announcements }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Announcements GET failed:", error);
    return NextResponse.json({ error: "Unable to load announcements." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageAnnouncements(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const announcement = await createAnnouncement({
      title,
      content,
      priority: body.priority || "normal",
      target_department: body.target_department || null,
      attachment_url: body.attachment_url || null,
      created_by: session.id,
    });

    // Broadcast notification to relevant staff
    await createNotification({
      title: `Announcement: ${title}`,
      message: `${session.fullName} published a new organisational bulletin.`,
      category: "announcement",
      link: "/admin?tab=communication&view=announcements",
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Announcement creation failed:", error);
    return NextResponse.json({ error: "Unable to create announcement." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid announcement ID." }, { status: 400 });
    }

    const success = await markAnnouncementAsRead(id, session.id);
    return NextResponse.json({ ok: success });
  } catch (error) {
    console.error("Announcement PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update read status." }, { status: 500 });
  }
}
