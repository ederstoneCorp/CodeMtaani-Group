import Image from "next/image";
import Link from "next/link";

const links = [
  ["About", "/about"],
  ["Divisions", "/divisions"],
  ["Services", "/services"],
  ["Projects", "/work"],
  ["Innovation", "/innovation"],
  ["Team", "/team"],
  ["Blog", "/blog"],
  ["Events", "/events"],
  ["Membership", "/membership"],
  ["Careers", "/careers"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand-lockup" aria-label="CodeMtaani Group home">
          <Image
            src="/Codemtaani_Group_logo__2_-removebg-preview.png"
            alt="CodeMtaani Group logo"
            width={52}
            height={52}
            priority
            className="brand-logo"
          />
          <span className="brand-name">
            CODEMTAANI<span>.</span>
            <small>GROUP</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" className="nav-cta">
          Let’s talk <span>↗</span>
        </Link>
        <details className="mobile-nav">
          <summary aria-label="Open navigation">☰</summary>
          <nav>
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/partnerships">Partnerships</Link>
            <Link href="/track">Track Submission</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
