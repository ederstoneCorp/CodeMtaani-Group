import { query } from "./db";

export type Event = {
  id: string; title: string; slug: string; event_type: string;
  description: string; start_time: string; end_time: string | null;
  location: string | null; is_virtual: boolean; meeting_link: string | null;
  capacity: number | null; status: string; created_at: string; updated_at: string;
};

export type EventRegistration = {
  id: string; event_id: string; full_name: string; email: string; registered_at: string;
};

export async function getUpcomingEvents() {
  const r = await query<Event>("SELECT * FROM events WHERE status IN ('upcoming','ongoing') ORDER BY start_time ASC");
  return r.rows;
}

export async function getPastEvents(limit = 20) {
  const r = await query<Event>("SELECT * FROM events WHERE status = 'completed' ORDER BY start_time DESC LIMIT $1", [limit]);
  return r.rows;
}

export async function getAllEvents() {
  const r = await query<Event>("SELECT * FROM events ORDER BY start_time DESC");
  return r.rows;
}

export async function getEventBySlug(slug: string) {
  const r = await query<Event>("SELECT * FROM events WHERE slug = $1 LIMIT 1", [slug]);
  return r.rows[0] || null;
}

export async function createEvent(data: Omit<Event, "id" | "created_at" | "updated_at">) {
  const r = await query<Event>(
    `INSERT INTO events (title, slug, event_type, description, start_time, end_time, location, is_virtual, meeting_link, capacity, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [data.title, data.slug, data.event_type, data.description, data.start_time, data.end_time, data.location, data.is_virtual, data.meeting_link, data.capacity, data.status]
  );
  return r.rows[0];
}

export async function registerForEvent(eventId: string, fullName: string, email: string) {
  const r = await query<EventRegistration>(
    `INSERT INTO event_registrations (event_id, full_name, email) VALUES ($1,$2,$3) ON CONFLICT (event_id, email) DO NOTHING RETURNING *`,
    [eventId, fullName, email]
  );
  return r.rows[0] || null;
}

export async function getEventRegistrations(eventId: string) {
  const r = await query<EventRegistration>("SELECT * FROM event_registrations WHERE event_id = $1 ORDER BY registered_at DESC", [eventId]);
  return r.rows;
}

export async function getRegistrationCount(eventId: string) {
  const r = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1", [eventId]);
  return r.rows[0]?.count || 0;
}
