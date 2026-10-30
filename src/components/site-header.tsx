import Image from "next/image";
import Link from "next/link";

const links = [
  ["About", "/about"],
  ["Divisions", "/divisions"],
  ["Services", "/services"],
  ["Products & work", "/work"],
  ["Innovation", "/innovation"],
  ["Careers", "/careers"],
  ["Partnerships", "/partnerships"],
];

export function SiteHeader() {
  return <header className="site-header"><div className="container nav-wrap">
    <Link href="/" className="brand-lockup" aria-label="CodeMtaani Group home">
      <Image src="/Codemtaani%20Group%20logo%20(2).png" alt="CodeMtaani Group logo" width={56} height={56} priority className="brand-logo"/>
      <span className="brand-name">CODEMTAANI<span>.</span><small>GROUP</small></span>
    </Link>
    <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav>
    <Link href="/contact" className="nav-cta">Let’s talk <span>↗</span></Link>
    <details className="mobile-nav"><summary aria-label="Open navigation">☰</summary><nav>{links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}<Link href="/contact">Contact</Link></nav></details>
  </div></header>;
}
