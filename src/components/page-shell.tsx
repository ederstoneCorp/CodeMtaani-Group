import Link from "next/link";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

type PageShellProps = { eyebrow: string; title: string; intro: string; children: React.ReactNode };
export function PageShell({eyebrow,title,intro,children}:PageShellProps) {
  return <><SiteHeader/><main><section className="inner-hero"><div className="container"><p className="eyebrow">{eyebrow}</p><h1 className="display">{title}</h1><p className="inner-intro">{intro}</p><div className="hero-rule"><span/></div></div></section>{children}<section className="closing-band"><div className="container closing-inner"><div><p className="eyebrow">Build with us</p><h2 className="section-title">Have a meaningful challenge?</h2></div><Link href="/contact" className="button-primary">Start a conversation <span>↗</span></Link></div></section></main><SiteFooter/></>;
}
