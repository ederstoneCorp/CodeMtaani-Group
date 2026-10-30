import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Boxes, Code2, FlaskConical, Layers3, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Products & Work",
  description: "Explore CodeMtaani Group's product development approach, technology capabilities and project portfolio.",
};

const workstreams = [
  { number: "01", icon: Boxes, title: "Digital products", status: "Portfolio in development", description: "A growing catalogue for platforms and applications developed by the group. Each published profile will explain its purpose, audience, features, current release stage and access options." },
  { number: "02", icon: Code2, title: "Client solutions", status: "Case studies by approval", description: "Selected websites, software systems, integrations and digital transformation work. Client names, screenshots and measurable outcomes will only be published with appropriate permission." },
  { number: "03", icon: FlaskConical, title: "Research & prototypes", status: "Ongoing exploration", description: "Technical experiments, proof-of-concepts and emerging ideas. Prototype work will be clearly distinguished from production-ready products and commercial releases." },
];

const standards = [
  { icon: Layers3, title: "The challenge", text: "The context, user need or operational problem the work is intended to address." },
  { icon: Code2, title: "The approach", text: "The product thinking, architecture, technologies and delivery decisions behind the solution." },
  { icon: ShieldCheck, title: "The outcome", text: "Verified results, current status, limitations and lessons, with no unsupported performance claims." },
];

export default function WorkPage() {
  return <PageShell eyebrow="Our portfolio / Products & work" title="Ideas developed into useful digital experiences." intro="A transparent view of the products, client solutions and experiments taking shape across CodeMtaani Group. We distinguish released work from concepts and projects still in development.">
    <section className="work-intro">
      <div><p className="eyebrow">OUR PORTFOLIO STANDARD</p><h2>Evidence over claims.</h2></div>
      <p>We intend this portfolio to be more than a gallery. Every published project profile will identify its development status, explain what was built and share outcomes only where they can be substantiated and disclosed.</p>
    </section>
    <div className="work-stream-grid">
      {workstreams.map(({number,icon:Icon,title,status,description})=><article className="work-stream-card" key={number}>
        <div className="work-stream-top"><span>{number}</span><Icon size={25} strokeWidth={1.5}/></div>
        <p className="work-status">{status}</p><h3>{title}</h3><p>{description}</p>
      </article>)}
    </div>
    <section className="work-profile-standard">
      <p className="eyebrow">HOW WE DOCUMENT PROJECTS</p><h2>Every project should tell a complete story.</h2>
      <div className="work-standard-grid">{standards.map(({icon:Icon,title,text})=><article key={title}><Icon size={22}/><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className="work-cta"><div><p className="eyebrow">HAVE A PROJECT IN MIND?</p><h2>Let’s explore what we can build together.</h2></div><Link href="/contact" className="button-primary">Discuss a project <ArrowUpRight size={17}/></Link></section>
  </PageShell>;
}
