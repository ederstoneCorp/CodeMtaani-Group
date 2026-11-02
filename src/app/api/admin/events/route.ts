import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageEvents, audit } from "@/lib/admin-roles";
import { getAllEvents, createEvent } from "@/lib/events";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const events = await getAllEvents();
    return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin events GET failed:", error);
    return NextResponse.json({ error: "Unable to load events." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageEvents(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const description = String(body.description || "").trim();
    const startTime = String(body.start_time || "").trim();

    if (!title || !slug || !description || !startTime) {
      return NextResponse.json({ error: "Title, slug, description and start time are required." }, { status: 400 });
    }

    const event = await createEvent({
      title,
      slug,
      event_type: body.event_type || "meetup",
      description,
      start_time: startTime,
      end_time: body.end_time || null,
      location: body.location || null,
      is_virtual: Boolean(body.is_virtual),
      meeting_link: body.meeting_link || null,
      capacity: body.capacity ? Number(body.capacity) : null,
      status: body.status || "upcoming",
    });

    await audit(session, "event_created", "event", event.id, { title: event.title });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Admin event create failed:", error);
    return NextResponse.json({ error: "Unable to create event." }, { status: 500 });
  }
}
