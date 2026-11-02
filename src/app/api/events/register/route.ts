import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateLimitResult = await checkRateLimit(`event_reg:${ip}`, 5, 60);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many registrations. Please wait." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const eventId = String(body.event_id || "");
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)) {
      return NextResponse.json({ error: "Invalid event selection." }, { status: 400 });
    }
    if (!fullName || fullName.length > 120) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    // Check event exists and capacity
    const eventResult = await query<{ id: string; title: string; capacity: number | null; status: string }>(
      "SELECT id, title, capacity, status FROM events WHERE id = $1 LIMIT 1",
      [eventId]
    );
    const event = eventResult.rows[0];
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (event.status === "completed" || event.status === "cancelled") {
      return NextResponse.json({ error: "Registration is closed for this event." }, { status: 400 });
    }

    if (event.capacity) {
      const countResult = await query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1 AND status != 'cancelled'",
        [eventId]
      );
      if (countResult.rows[0].count >= event.capacity) {
        return NextResponse.json(
          { error: `This event has reached its capacity limit of ${event.capacity} participants.` },
          { status: 400 }
        );
      }
    }

    // Generate unique reference code
    const refCode = `CMG-EVT-${Math.floor(1000 + Math.random() * 9000)}`;

    const regResult = await query<{ id: string; event_id: string; full_name: string; email: string; reference_code: string; registered_at: string }>(
      `INSERT INTO event_registrations (event_id, full_name, email, phone, reference_code, status)
       VALUES ($1, $2, $3, $4, $5, 'registered')
       ON CONFLICT (event_id, email) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, event_id, full_name, email, reference_code, registered_at`,
      [eventId, fullName, email, phone, refCode]
    );

    // Notify admins
    await createNotification({
      title: `Event Registration: ${event.title}`,
      message: `${fullName} registered for ${event.title}.`,
      category: "project",
      link: `/admin?tab=events&eventId=${eventId}`,
    });

    return NextResponse.json({
      ok: true,
      registration: regResult.rows[0],
      reference_code: refCode,
      message: `Registration confirmed for "${event.title}".`,
    }, { status: 201 });
  } catch (error) {
    console.error("Event registration failed:", error);
    return NextResponse.json({ error: "Unable to complete registration." }, { status: 500 });
  }
}
