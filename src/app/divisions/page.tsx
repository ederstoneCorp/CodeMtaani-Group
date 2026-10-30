import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { divisions } from "./division-data";
export const metadata: Metadata = { title: "Divisions" };
export default function DivisionsPage() {
  return <PageShell eyebrow="Our structure / Divisions" title="Specialist capabilities. Shared direction." intro="A portfolio of complementary technology capabilities designed to collaborate, share infrastructure and develop into focused business units as the group grows.">
    <section className="content-section"><div className="container two-col"><div><p className="eyebrow">A connected portfolio</p></div><div><h2 className="section-title">Different disciplines. One operating standard.</h2><p className="body-copy">These are CodeMtaani Group’s intended areas of focus. They will be established progressively according to market demand, available capacity, partnerships and commercial readiness.</p></div></div></section>
    <section className="content-section soft-section"><div className="container card-grid">{divisions.map((item,i)=><Link className="info-card division-detail-card" href={`/divisions/${item.slug}`} key={item.slug}><span className="card-number">{String(i+1).padStart(2,"0")}</span><span className="card-tag">{item.tag}</span><h3>{item.name}</h3><p>{item.summary}</p><span className="text-link">Explore capability <span>↗</span></span></Link>)}</div></section>
  </PageShell>;
}
