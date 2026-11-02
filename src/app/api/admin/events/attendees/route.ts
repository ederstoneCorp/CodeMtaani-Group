import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageEvents, audit } from "@/lib/admin-roles";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageEvents(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const eventId = q.get("eventId");
    if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const attendees = await query(
      `SELECT id, event_id, full_name, email, phone, reference_code, status, checked_in_at, registered_at
       FROM event_registrations
       WHERE event_id = $1
       ORDER BY registered_at DESC`,
      [eventId]
    );

    return NextResponse.json({ attendees: attendees.rows }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Attendees GET failed:", error);
    return NextResponse.json({ error: "Unable to load attendees." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageEvents(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "registered");

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid attendee ID." }, { status: 400 });
    }

    const checkedInAt = status === "attended" ? "NOW()" : "NULL";

    const updated = await query(
      `UPDATE event_registrations
       SET status = $2, checked_in_at = ${checkedInAt}
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );

    if (!updated.rowCount) return NextResponse.json({ error: "Attendee not found." }, { status: 404 });

    await audit(session, "attendance_updated", "event_registration", id, { status });
    return NextResponse.json({ attendee: updated.rows[0] });
  } catch (error) {
    console.error("Attendance update failed:", error);
    return NextResponse.json({ error: "Unable to update attendee." }, { status: 500 });
  }
}
