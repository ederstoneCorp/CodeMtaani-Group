import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "CodeMtaani Group Data Protection and Privacy Policy in compliance with the Kenya Data Protection Act, 2019.",
};

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Governance &amp; Compliance / Privacy Policy"
      title="Data protection and privacy commitments."
      intro="CodeMtaani Group is committed to protecting the privacy, confidentiality, and integrity of personal information entrusted to us by members, partners, and visitors."
    >
      <section className="content-section">
        <div className="container" style={{ maxWidth: 860, marginInline: "auto" }}>
          <div style={{ padding: "20px", border: "1px solid rgba(72,198,212,0.3)", borderRadius: "8px", background: "rgba(4,35,41,0.5)", marginBottom: "36px" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", color: "#65d5e1" }}>
              Regulatory Framework
            </span>
            <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: "1.7", color: "#c2d8dc" }}>
              This policy has been prepared in accordance with the provisions of the <strong>Data Protection Act, 2019 (Laws of Kenya)</strong> and international best practices for data processing and user privacy.
            </p>
          </div>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginBottom: "16px" }}>1. Information We Collect</h2>
          <p className="body-copy">
            We collect personal data that you voluntarily provide to us when interacting with our platform, specifically:
          </p>
          <ul style={{ margin: "16px 0", paddingLeft: "24px", color: "#c2d8dc", lineHeight: "1.8", fontSize: "14px" }}>
            <li><strong>Contact &amp; Enquiry Details:</strong> Full name, email address, organisation name, enquiry category, and message text.</li>
            <li><strong>Membership &amp; Talent Applications:</strong> Educational/institutional affiliations, technical skills, areas of interest, portfolio URLs, and biographical notes.</li>
            <li><strong>Event Registrations:</strong> Attendee name, email address, and optional attendance notes.</li>
            <li><strong>Technical Interaction Data:</strong> Basic server access logs containing anonymised IP addresses and browser headers strictly for rate limiting, security monitoring, and anti-abuse defense.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>2. Purpose &amp; Legal Basis for Processing</h2>
          <p className="body-copy">
            Personal data is processed strictly for legitimate operational purposes:
          </p>
          <ul style={{ margin: "16px 0", paddingLeft: "24px", color: "#c2d8dc", lineHeight: "1.8", fontSize: "14px" }}>
            <li>Responding to general, project, and partnership enquiries.</li>
            <li>Evaluating talent profiles and volunteer/developer community applications.</li>
            <li>Managing registration and communication for hackathons, workshops, and meetups.</li>
            <li>Protecting our digital infrastructure against brute-force authentication attacks and automated spam.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>3. Data Retention &amp; Security Measures</h2>
          <p className="body-copy">
            All database connections use Transport Layer Security (TLS/SSL). Sensitive credentials, passwords, and tokens are hashed using cryptographic one-way functions (scrypt and HMAC-SHA256).
            Personal data is retained only for as long as necessary to fulfill the operational purpose for which it was gathered, after which it is safely archived or deleted.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>4. Your Rights Under the Kenya Data Protection Act</h2>
          <p className="body-copy">
            As a data subject, you have the following rights regarding personal data held by CodeMtaani Group:
          </p>
          <ul style={{ margin: "16px 0", paddingLeft: "24px", color: "#c2d8dc", lineHeight: "1.8", fontSize: "14px" }}>
            <li><strong>Right to be informed:</strong> Understanding how your personal data is collected and used.</li>
            <li><strong>Right of access:</strong> Requesting confirmation and copies of personal data held about you.</li>
            <li><strong>Right to rectification:</strong> Requesting correction of inaccurate, outdated, or incomplete data.</li>
            <li><strong>Right to erasure (to be forgotten):</strong> Requesting deletion of data where there is no ongoing lawful basis for its retention.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>5. Third-Party Services &amp; Disclosures</h2>
          <p className="body-copy">
            We do not sell, rent, or trade your personal data to commercial third parties. In specific operational scenarios, data may be transmitted through secure third-party infrastructure:
          </p>
          <ul style={{ margin: "16px 0", paddingLeft: "24px", color: "#c2d8dc", lineHeight: "1.8", fontSize: "14px" }}>
            <li>Cloud database hosting (Render / Supabase PostgreSQL instances with TLS encryption).</li>
            <li>Transactional email delivery (Resend API) for operational alert routing.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>6. Contact the Data Protection Lead</h2>
          <p className="body-copy">
            If you have questions, feedback, or wish to exercise your data rights, please contact our administrative team:
            <br />
            <strong>Email:</strong> <a href="mailto:hello@codemtaani.com" className="text-link">hello@codemtaani.com</a>
            <br />
            <strong>Physical Address:</strong> Nairobi, Kenya
          </p>
        </div>
      </section>
    </PageShell>
  );
}
