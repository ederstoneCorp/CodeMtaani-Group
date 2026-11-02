import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams;
    const limit = Math.min(Number(q.get("limit") || 25), 100);
    const notifications = await getNotifications(session.id, limit);

    return NextResponse.json({ notifications }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Notifications GET failed:", error);
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const body = await request.json();
    if (body.all) {
      await markAllNotificationsRead(session.id);
      return NextResponse.json({ ok: true, all: true });
    }

    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid notification ID." }, { status: 400 });
    }

    const success = await markNotificationRead(id, session.id);
    return NextResponse.json({ ok: success });
  } catch (error) {
    console.error("Notifications PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update notification." }, { status: 500 });
  }
}
