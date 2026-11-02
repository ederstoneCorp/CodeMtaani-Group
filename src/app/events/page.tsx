import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getUpcomingEvents } from "@/lib/events";
import { Calendar, Clock, MapPin, Video } from "lucide-react";
import { EventRegisterButton } from "@/components/event-register-button";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, hackathons, training sessions and meetups hosted by CodeMtaani Group.",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = [];
  try {
    events = await getUpcomingEvents();
  } catch (error) {
    console.error("Failed to load events:", error);
  }

  return (
    <PageShell
      eyebrow="Community &amp; Learning / Events"
      title="Hands-on sessions, hackathons and tech meetups."
      intro="We organise practical workshops, technical deep-dives, developer roundtables and innovation hackathons designed to empower youth and build real engineering solutions."
    >
      <section className="content-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Upcoming Sessions</p>
              <h2 className="section-title">
                Learn with peers.<br />
                <span>Build with purpose.</span>
              </h2>
            </div>
            <div className="heading-aside">
              <p>
                From beginner-friendly software development workshops to advanced AI model integrations and architecture design reviews, our events focus on practical skills.
              </p>
            </div>
          </div>

          {events.length > 0 ? (
            <div className="card-grid" style={{ marginTop: "40px" }}>
              {events.map((ev) => (
                <article className="info-card" key={ev.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#65d5e1", fontSize: "11px" }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{ev.event_type}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {ev.is_virtual ? <Video size={13} /> : <MapPin size={13} />}
                      {ev.is_virtual ? "Online" : ev.location || "In-person"}
                    </span>
                  </div>
                  <h3 style={{ marginTop: "18px", fontSize: "22px", lineHeight: "1.3" }}>{ev.title}</h3>
                  <p style={{ marginTop: "12px", color: "#c2d8dc", fontSize: "13px", lineHeight: "1.75" }}>
                    {ev.description}
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#a8c7cd" }}>
                      <Calendar size={14} style={{ color: "#48c6d4" }} />
                      {new Date(ev.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#a8c7cd" }}>
                      <Clock size={14} style={{ color: "#48c6d4" }} />
                      {new Date(ev.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <EventRegisterButton eventId={ev.id} eventTitle={ev.title} isVirtual={ev.is_virtual} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: "40px",
                padding: "48px 32px",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                background: "rgba(4,35,41,0.5)",
                textAlign: "center",
              }}
            >
              <Calendar size={36} style={{ color: "#48c6d4", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Next community calendar being scheduled</h3>
              <p className="body-copy" style={{ margin: "0 auto", maxWidth: "600px" }}>
                Our next round of developer meetups and technical workshops is currently being finalized.
                Events are posted with verified dates, agendas and speaker information once confirmed.
              </p>
              <div style={{ marginTop: "28px" }}>
                <Link href="/membership" className="button-primary">
                  Join community for event invites ↗
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="content-section soft-section">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Host or Collaborate</p>
          </div>
          <div>
            <h2 className="section-title">Want to speak or sponsor a hackathon?</h2>
            <p className="body-copy">
              We collaborate with universities, developer communities, and technology companies to host high-impact hackathons and training bootcamps. Reach out to coordinate with our events and partnerships team.
            </p>
            <div style={{ marginTop: "24px" }}>
              <Link href="/partnerships" className="text-link">
                Discuss an event partnership ↗
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
