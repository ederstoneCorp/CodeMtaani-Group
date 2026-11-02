import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Boxes, Code2, ExternalLink, FlaskConical, Github, Layers3, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getPublishedProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects & Portfolio",
  description: "Explore CodeMtaani Group's software products, technical open-source repositories, and digital solution portfolio.",
};

export const dynamic = "force-dynamic";

const workstreams = [
  {
    number: "01",
    icon: Boxes,
    title: "Digital Products",
    status: "Portfolio in development",
    description: "Web applications, platforms and open-source tooling built by CodeMtaani engineering teams. Each profile clearly details problem statements, architecture choices and development status.",
  },
  {
    number: "02",
    icon: Code2,
    title: "Client & Partner Solutions",
    status: "Case studies by approval",
    description: "Custom software engineering, secure APIs, cloud deployments and digital transformation engagements. Client details and metrics are only disclosed with explicit consent.",
  },
  {
    number: "03",
    icon: FlaskConical,
    title: "Research & Prototypes",
    status: "Ongoing exploration",
    description: "Applied AI experiments, FinTech prototypes and community tools. Experimental and proof-of-concept builds are transparently distinguished from production releases.",
  },
];

const standards = [
  { icon: Layers3, title: "Problem Definition", text: "The operational challenge, community requirement or user friction being addressed." },
  { icon: Code2, title: "Engineering Architecture", text: "The stack, security protocols, API contracts and design decisions behind the implementation." },
  { icon: ShieldCheck, title: "Verified Outcomes", text: "Measurable performance, current release stage, limitations and open-source codebase links." },
];

export default async function WorkPage() {
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = [];
  try {
    projects = await getPublishedProjects();
  } catch (error) {
    console.error("Failed to load projects:", error);
  }

  return (
    <PageShell
      eyebrow="Our Portfolio / Products &amp; Work"
      title="Ideas engineered into useful software."
      intro="A transparent showcase of software products, client systems, open-source repositories and research prototypes taking shape across CodeMtaani Group."
    >
      {/* Dynamic Projects Showcase if DB has items */}
      {projects.length > 0 && (
        <section className="content-section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <p className="eyebrow">Featured Work</p>
            <h2 className="section-title">Active projects &amp; solutions.</h2>
            <div className="card-grid" style={{ marginTop: "36px" }}>
              {projects.map((proj) => (
                <article className="info-card" key={proj.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#65d5e1", fontSize: "11px" }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{proj.category || "Software"}</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "rgba(72,198,212,0.15)",
                        border: "1px solid rgba(72,198,212,0.3)",
                        textTransform: "capitalize",
                      }}
                    >
                      {proj.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 style={{ marginTop: "18px", fontSize: "22px" }}>{proj.title}</h3>
                  <p style={{ marginTop: "10px", color: "#c2d8dc", fontSize: "13px", lineHeight: "1.75" }}>
                    {proj.description}
                  </p>
                  {proj.problem_statement && (
                    <div style={{ marginTop: "14px", padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
                      <strong style={{ fontSize: "11px", color: "#65d5e1", display: "block" }}>Problem:</strong>
                      <span style={{ fontSize: "12px", color: "#c2d8dc" }}>{proj.problem_statement}</span>
                    </div>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
                      {proj.technologies.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: "10px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.08)",
                            color: "#c2d8dc",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", gap: "14px", alignItems: "center" }}>
                    {proj.github_url && (
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                        style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                      >
                        <Github size={14} /> Repository
                      </a>
                    )}
                    {proj.demo_url && (
                      <a
                        href={proj.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                        style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                      >
                        <ExternalLink size={14} /> Live Demo
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="work-intro">
        <div>
          <p className="eyebrow">OUR PORTFOLIO STANDARD</p>
          <h2>Evidence over claims.</h2>
        </div>
        <p>
          We build this portfolio on transparency. Every published profile communicates its exact release stage, architecture decisions, and code repository links.
          We never fabricate clients or claim imaginary production metrics.
        </p>
      </section>

      <div className="work-stream-grid">
        {workstreams.map(({ number, icon: Icon, title, status: streamStatus, description }) => (
          <article className="work-stream-card" key={number}>
            <div className="work-stream-top">
              <span>{number}</span>
              <Icon size={25} strokeWidth={1.5} />
            </div>
            <p className="work-status">{streamStatus}</p>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <section className="work-profile-standard">
        <p className="eyebrow">HOW WE DOCUMENT WORK</p>
        <h2>Every project tells an honest engineering story.</h2>
        <div className="work-standard-grid">
          {standards.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="work-cta">
        <div>
          <p className="eyebrow">HAVE A PRODUCT CHALLENGE?</p>
          <h2>Let’s explore what we can engineer together.</h2>
        </div>
        <Link href="/contact" className="button-primary">
          Discuss a project <ArrowUpRight size={17} />
        </Link>
      </section>
    </PageShell>
  );
}
