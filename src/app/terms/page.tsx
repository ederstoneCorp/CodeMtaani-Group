import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions governing access to and use of the CodeMtaani Group platform.",
};

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Governance &amp; Terms / Terms of Use"
      title="Terms of use &amp; participation guidelines."
      intro="Please read these terms carefully before accessing the CodeMtaani Group website, community forums, or technological services."
    >
      <section className="content-section">
        <div className="container" style={{ maxWidth: 860, marginInline: "auto" }}>
          <h2 className="section-title" style={{ fontSize: "1.9rem", marginBottom: "16px" }}>1. Acceptance of Terms</h2>
          <p className="body-copy">
            By visiting our website (codemtaani-group.onrender.com) or submitting inquiries, applications, or project proposals, you agree to comply with and be bound by these Terms of Use and all applicable laws of Kenya.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>2. Organisational Autonomy &amp; Identity</h2>
          <p className="body-copy">
            CodeMtaani Group is an independent youth-driven technology and innovation organisation. While selected repositories may be hosted under the GitHub organisation `ederstoneCorp`, CodeMtaani Group remains an independent initiative and is not a subsidiary, branch, or commercial product of EderStone Corp.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>3. Community Membership &amp; Affiliation</h2>
          <p className="body-copy">
            Registration as a community, student, or developer member does not establish an employer-employee relationship, agency, joint venture, or partnership. Membership grants access to collaborative learning spaces, workshops, and open projects subject to community guidelines.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>4. Intellectual Property &amp; Open Source</h2>
          <p className="body-copy">
            Original branding marks, logo assets, design compositions, and editorial materials remain the property of CodeMtaani Group.
            Open-source code released under permissive licenses (such as MIT or Apache 2.0) remains governed by the respective license file included within each project repository.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>5. User Conduct &amp; Form Submissions</h2>
          <p className="body-copy">
            When submitting information through our portal, you agree not to submit spam, malicious scripts, false identity representations, or proprietary third-party confidential trade secrets. We reserve the right to reject submissions and block abusive access patterns.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>6. Disclaimers &amp; Limitation of Liability</h2>
          <p className="body-copy">
            The platform and all information are provided on an &quot;as is&quot; and &quot;as available&quot; basis. CodeMtaani Group makes no warranties regarding uninterrupted availability, error-free operation, or specific commercial outcomes.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>7. Governing Law &amp; Dispute Resolution</h2>
          <p className="body-copy">
            These terms are governed by the laws of the Republic of Kenya. Any dispute arising out of or in connection with these terms shall be subject to the jurisdiction of the courts of Kenya.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.9rem", marginTop: "44px", marginBottom: "16px" }}>8. Contact Us</h2>
          <p className="body-copy">
            For governance or terms clarification:
            <br />
            <strong>Email:</strong> <a href="mailto:hello@codemtaani.com" className="text-link">hello@codemtaani.com</a>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
