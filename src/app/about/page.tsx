import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid, TextRows } from "@/components/content-blocks";
export const metadata: Metadata = { title: "About" };
export default function AboutPage(){return <PageShell eyebrow="The group / About us" title="Technology with purpose." intro="An independent technology group taking shape in Kenya, with the ambition to build useful products, capable teams and lasting value across Africa.">
<IntroSection label="Our identity" title="Independent by design. Connected by purpose." text="CodeMtaani Group is being developed as a diversified technology organisation. We bring together digital products, technology services, research and innovation under one clear direction. Our work begins with understanding real needs and building solutions that can earn trust, scale responsibly and create opportunity."/>
<CardGrid items={[
{title:"Our vision",text:"To become an internationally competitive African technology group known for useful innovation, trusted engineering and meaningful impact."},
{title:"Our mission",text:"To identify important problems, build dependable technology and grow the people and partnerships needed to deliver lasting solutions."},
{title:"Our philosophy",text:"Think critically. Build responsibly. Transform outcomes through technology."}
]}/>
<TextRows items={[
{title:"Rooted in Kenya",text:"We draw perspective from the people, institutions and markets around us while building for a wider African and global context."},
{title:"Built for the long term",text:"We prioritise sustainable operations, sound governance, quality engineering and products that solve genuine problems."},
{title:"Open to collaboration",text:"We work towards productive relationships with customers, universities, innovators, institutions and technology partners."}
]}/></PageShell>}
