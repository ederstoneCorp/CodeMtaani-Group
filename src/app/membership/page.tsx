import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid } from "@/components/content-blocks";
import { MembershipForm } from "@/components/membership-form";

export const metadata: Metadata = {
  title: "Membership",
  description: "Join the CodeMtaani Group developer, student, and innovator community.",
};

export default function MembershipPage() {
  return (
    <PageShell
      eyebrow="Community &amp; Talent / Membership"
      title="Empowering the next generation of builders."
      intro="CodeMtaani Group brings together young developers, students, researchers and creative innovators committed to practical technology development and continuous learning."
    >
      <IntroSection
        label="Why join CodeMtaani"
        title="A collaborative home for builders."
        text="Whether you are writing your first lines of code, prototyping an AI model, or looking to collaborate on social-impact open source tools, CodeMtaani provides peer review, mentorship, hackathons, and real project involvement."
      />

      <CardGrid
        items={[
          { title: "Student Members", text: "University and tertiary students building foundational skills through workshops, mentorship and practical projects." },
          { title: "Developer Members", text: "Frontend, backend and full-stack software engineers contributing code, architecture discussions and technical guidance." },
          { title: "Creative Contributors", text: "Designers, technical writers and digital storytellers shaping user experiences and product communication." },
          { title: "Research & Innovators", text: "Technologists exploring applied machine learning, financial technology, cybersecurity and distributed systems." },
          { title: "Community Members", text: "Technology enthusiasts and digital advocates participating in meetups, webinars and collaborative challenges." },
          { title: "External Collaborators", text: "Industry practitioners, tech leads and partner mentors supporting community projects and masterclasses." },
        ]}
      />

      <section className="content-section">
        <div className="container contact-grid">
          <div>
            <p className="eyebrow">Membership Application</p>
            <h2 className="section-title">Join our talent community.</h2>
            <p className="body-copy">
              Membership is open to individuals committed to practical growth, disciplined engineering, and ethical collaboration.
              Submit your profile below to join our developer network and receive event and project invitations.
            </p>
            <div style={{ marginTop: "32px", padding: "20px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", background: "rgba(4,35,41,0.4)" }}>
              <strong style={{ display: "block", color: "#65d5e1", fontSize: "14px", marginBottom: "8px" }}>
                Important notice
              </strong>
              <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.7", color: "#c2d8dc" }}>
                Membership in CodeMtaani Group is an educational and collaborative community affiliation. It does not constitute formal employment, equity ownership, or guaranteed financial compensation.
              </p>
            </div>
          </div>
          <MembershipForm />
        </div>
      </section>
    </PageShell>
  );
}
