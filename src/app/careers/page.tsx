import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Careers" };
export default function CareersPage(){return <PageShell eyebrow="People / Careers" title="Build what comes next." intro="We are shaping a team of curious, accountable people who care about engineering quality, useful innovation and meaningful collaboration.">
<IntroSection label="Working with us" title="Talent grows through real responsibility." text="As CodeMtaani develops, we intend to create opportunities for experienced professionals, early-career talent, interns, contractors and research collaborators. Roles will be introduced as the organisation’s capacity and operating needs mature."/>
<CardGrid items={[
{title:"Engineering",text:"Software engineering, frontend and backend development, cloud, infrastructure, QA and cybersecurity."},
{title:"Product & design",text:"Product management, user research, UI/UX design, business analysis and delivery."},
{title:"Research & innovation",text:"AI, data, applied research, experimentation and technical learning."},
{title:"Business & operations",text:"Commercial development, partnerships, finance, administration, communications and operations."}
]}/>
<section className="content-section"><div className="container application-panel"><div><p className="eyebrow">Talent enquiries</p><h2 className="section-title">Introduce yourself.</h2><p className="body-copy">There may not be an open vacancy at all times. You can still send a concise profile, your area of interest and links to relevant work. We will respond when there is a suitable opportunity.</p></div><a className="button-primary" href="mailto:careers@codemtaani.com?subject=Careers%20enquiry">Email the team ↗</a></div></section>
</PageShell>}
