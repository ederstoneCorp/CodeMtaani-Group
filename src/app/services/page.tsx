import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid, TextRows } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Services" };
export default function ServicesPage(){return <PageShell eyebrow="What we deliver / Services" title="From a clear problem to a working solution." intro="Technology services for organisations, businesses and founders that need thoughtful execution, dependable systems and a partner focused on outcomes.">
<IntroSection label="Our services" title="Practical technology. Carefully delivered." text="We intend to serve clients through a combination of project delivery, technical consulting and ongoing support. Each engagement should begin with a clear scope, realistic timeline, transparent costs and agreed measures of success."/>
<CardGrid items={[
{title:"Websites & digital experiences",text:"Corporate websites, landing pages, portals and responsive user experiences built around clear business goals."},
{title:"Custom software development",text:"Purpose-built web applications, internal systems, workflow tools and business platforms."},
{title:"UI/UX & product design",text:"Product discovery, user flows, interface design, prototyping and design systems."},
{title:"AI & workflow automation",text:"Practical automation, AI integrations and data-assisted workflows where they create measurable value."},
{title:"Cloud, APIs & integrations",text:"Backend services, API design, database integration, deployment and infrastructure configuration."},
{title:"Maintenance & technical support",text:"Updates, monitoring, performance improvements, security maintenance and ongoing product support."}
]}/>
<TextRows items={[
{title:"Discover",text:"We clarify the challenge, users, constraints, requirements and expected outcomes."},
{title:"Plan",text:"We define scope, architecture, milestones, responsibilities and delivery expectations."},
{title:"Build & validate",text:"We develop iteratively, test carefully and review progress with the client."},
{title:"Launch & support",text:"We deploy, document, hand over and provide agreed maintenance or continued development."}
]}/></PageShell>}
