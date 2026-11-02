import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getActiveTeamMembers } from "@/lib/team";
import { Github, Globe, Linkedin, Twitter, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the team, developers and contributors building CodeMtaani Group.",
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  let members: Awaited<ReturnType<typeof getActiveTeamMembers>> = [];
  try {
    members = await getActiveTeamMembers();
  } catch (error) {
    console.error("Failed to load team members:", error);
  }

  return (
    <PageShell
      eyebrow="Our People / Team"
      title="The minds behind the mission."
      intro="CodeMtaani Group brings together emerging developers, designers, researchers and technology leaders dedicated to practical digital development and real-world impact across Africa."
    >
      <section className="content-section">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Organisation Structure</p>
          </div>
          <div>
            <h2 className="section-title">Built on accountability, collaboration and talent.</h2>
            <p className="body-copy">
              Our multidisciplinary team leads engineering, product development, applied research and community growth.
              We do not display fabricated profiles or unverified staff. Published team members are verified and manageable via our administrative governance console.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section soft-section">
        <div className="container">
          <p className="eyebrow">Core &amp; Contributing Team</p>
          {members.length > 0 ? (
            <div className="card-grid" style={{ marginTop: "32px" }}>
              {members.map((member) => (
                <article className="info-card" key={member.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "rgba(72,198,212,0.15)",
                        border: "1px solid rgba(72,198,212,0.4)",
                        display: "grid",
                        placeItems: "center",
                        color: "#48c6d4",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      {member.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        member.full_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "20px" }}>{member.full_name}</h3>
                      <span style={{ fontSize: "12px", color: "#65d5e1" }}>{member.role_title}</span>
                    </div>
                  </div>
                  {member.department && (
                    <span className="card-tag" style={{ marginTop: 0, marginBottom: "12px" }}>
                      {member.department}
                    </span>
                  )}
                  {member.bio && <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#c2d8dc" }}>{member.bio}</p>}
                  {member.skills && member.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
                      {member.skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: "10px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.08)",
                            color: "#c2d8dc",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {member.social_links && Object.keys(member.social_links).length > 0 && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
                      {member.social_links.github && (
                        <a
                          href={member.social_links.github}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#a8c7cd" }}
                          aria-label="GitHub"
                        >
                          <Github size={16} />
                        </a>
                      )}
                      {member.social_links.linkedin && (
                        <a
                          href={member.social_links.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#a8c7cd" }}
                          aria-label="LinkedIn"
                        >
                          <Linkedin size={16} />
                        </a>
                      )}
                      {member.social_links.twitter && (
                        <a
                          href={member.social_links.twitter}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#a8c7cd" }}
                          aria-label="Twitter"
                        >
                          <Twitter size={16} />
                        </a>
                      )}
                      {member.social_links.website && (
                        <a
                          href={member.social_links.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#a8c7cd" }}
                          aria-label="Personal Website"
                        >
                          <Globe size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: "32px",
                padding: "36px",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                background: "rgba(4,35,41,0.5)",
                textAlign: "center",
              }}
            >
              <Users size={32} style={{ color: "#48c6d4", margin: "0 auto 14px" }} />
              <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>Team directory under active review</h3>
              <p className="body-copy" style={{ margin: "0 auto", maxWidth: "600px" }}>
                Active staff and core contributors are currently being onboarded through our administration console.
                Are you looking to join CodeMtaani Group? Explore our current openings and talent community.
              </p>
              <div style={{ marginTop: "24px" }}>
                <a href="/careers" className="button-primary">
                  View career opportunities ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
