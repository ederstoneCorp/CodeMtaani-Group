import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand-lockup">
            <Image
              src="/Codemtaani_Group_logo__2_-removebg-preview.png"
              alt="CodeMtaani Group logo"
              width={52}
              height={52}
              className="brand-logo"
            />
            <span className="brand-name">
              CODEMTAANI<span>.</span>
              <small>GROUP</small>
            </span>
          </Link>
          <p className="footer-note">
            <strong>Think. Build. Transform.</strong>
            <br />
            An independent, youth-driven technology and innovation organisation empowering emerging talent across Africa.
          </p>
        </div>

        <div>
          <h3>Organisation</h3>
          <Link href="/about">About Us</Link>
          <Link href="/divisions">Divisions</Link>
          <Link href="/services">Services</Link>
          <Link href="/work">Projects &amp; Portfolio</Link>
          <Link href="/team">Our Team</Link>
          <Link href="/innovation">Research &amp; Innovation</Link>
        </div>

        <div>
          <h3>Community</h3>
          <Link href="/membership">Membership Portal</Link>
          <Link href="/innovation">Submit Innovation / Idea</Link>
          <Link href="/track">Track Submission Status</Link>
          <Link href="/blog">Blog &amp; Insights</Link>
          <Link href="/events">Events &amp; Workshops</Link>
          <Link href="/careers">Careers &amp; Opportunities</Link>
          <Link href="/partnerships">Partnership Enquiries</Link>
          <Link href="/contact">Contact Support</Link>
        </div>

        <div>
          <h3>Legal &amp; Connect</h3>
          <Link href="/privacy">Privacy Policy (DPA 2019)</Link>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/admin">Staff Administration ↗</Link>
          <a href="mailto:hello@codemtaani.com">hello@codemtaani.com</a>
          <p className="footer-note">Nairobi, Kenya · Pan-African Community</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>&copy; {new Date().getFullYear()} CodeMtaani Group. All rights reserved.</span>
        <span>Independent Organisation &middot; Think. Build. Transform.</span>
      </div>
    </footer>
  );
}
