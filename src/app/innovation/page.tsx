import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid, TextRows } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Innovation" };
export default function InnovationPage(){return <PageShell eyebrow="Research / Innovation" title="Explore boldly. Validate responsibly." intro="A disciplined approach to research, experimentation and emerging technologies, focused on turning promising ideas into useful solutions.">
<IntroSection label="Innovation model" title="Curiosity needs a path to execution." text="CodeMtaani’s innovation work is intended to connect research, product development and practical problem-solving. Ideas should be tested against user needs, technical feasibility, responsible use and a credible route to sustainability."/>
<CardGrid items={[
{title:"Applied AI",text:"Explore responsible AI applications, intelligent workflows, decision-support tools and locally relevant use cases."},
{title:"Research partnerships",text:"Collaborate with academic and technical communities on applied research, prototypes and knowledge exchange."},
{title:"Product experimentation",text:"Test assumptions through discovery, prototypes, pilots and measured user feedback before scaling."},
{title:"Digital inclusion",text:"Investigate technology that expands access, participation, learning and opportunity."}
]}/>
<TextRows items={[
{title:"Identify",text:"Define a real problem and the people affected by it."},
{title:"Investigate",text:"Research context, existing approaches, risks and technical options."},
{title:"Prototype",text:"Build the smallest useful experiment and test it with relevant users."},
{title:"Evaluate",text:"Assess evidence, impact, cost, risk and sustainability before deciding what happens next."}
]}/></PageShell>}
