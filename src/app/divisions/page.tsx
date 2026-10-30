import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Divisions" };
export default function DivisionsPage(){return <PageShell eyebrow="Our structure / Divisions" title="Specialist capabilities. Shared direction." intro="A portfolio of complementary technology capabilities designed to collaborate, share infrastructure and develop into focused business units as the group grows.">
<IntroSection label="A connected portfolio" title="Different disciplines. One operating standard." text="The divisions below describe CodeMtaani Group’s intended areas of focus. They will be established progressively according to market demand, available capacity, partnerships and commercial readiness."/>
<CardGrid items={[
{number:"01",title:"Digital Solutions",tag:"Software & platforms",text:"Websites, custom software, enterprise platforms, APIs, integrations and digital transformation services."},
{number:"02",title:"AI & Data",tag:"Applied intelligence",text:"AI-enabled products, automation, data engineering, analytics and responsible intelligent systems."},
{number:"03",title:"Education & Research",tag:"Learning & discovery",text:"Learning technologies, research collaborations, technical training, mentorship and talent development."},
{number:"04",title:"FinTech",tag:"Financial technology",text:"Digital financial tools, payment-related solutions and systems that improve access, efficiency and insight."},
{number:"05",title:"Social Technologies",tag:"People & communities",text:"Platforms that connect communities, enable collaboration and make opportunities easier to discover."},
{number:"06",title:"Cloud & Infrastructure",tag:"Reliable foundations",text:"Cloud architecture, hosting, DevOps, cybersecurity, infrastructure management and resilient systems."},
{number:"07",title:"Innovation Labs",tag:"New ventures",text:"Prototyping, emerging technology exploration, product experiments and validation of new business ideas."}
]}/></PageShell>}
