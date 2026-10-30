import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div><Link href="/" className="brand-lockup"><Image src="/Codemtaani%20Group%20logo%20(2).png" alt="" width={52} height={52} className="brand-logo"/><span className="brand-name">CODEMTAANI<span>.</span><small>GROUP</small></span></Link><p className="footer-note">Think. Build. Transform.<br/>A Kenyan-rooted technology group with an African outlook.</p></div>
    <div><h3>Explore</h3><Link href="/about">About</Link><Link href="/divisions">Divisions</Link><Link href="/services">Services</Link><Link href="/work">Products & work</Link></div>
    <div><h3>Connect</h3><Link href="/innovation">Innovation</Link><Link href="/careers">Careers</Link><Link href="/partnerships">Partnerships</Link><Link href="/contact">Contact</Link></div>
    <div><h3>Start a conversation</h3><a href="mailto:hello@codemtaani.com">hello@codemtaani.com</a><p className="footer-note">Kenya · Africa · Worldwide</p></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} CodeMtaani Group. All rights reserved.</span><span>Think. Build. Transform.</span></div></footer>;
}
