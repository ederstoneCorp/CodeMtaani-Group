import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Partnerships" };
export default function PartnershipsPage(){return <PageShell eyebrow="Ecosystem / Partnerships" title="Progress is built together." intro="We seek purposeful relationships that combine expertise, infrastructure, research, markets and shared commitment to useful technology.">
<IntroSection label="Work with us" title="Partnerships with a clear reason to exist." text="We approach partnerships as practical collaborations with defined objectives, responsibilities and outcomes. We are interested in relationships that create value for customers, communities, institutions and the wider technology ecosystem."/>
<CardGrid items={[
{title:"Academic partnerships",text:"Research, internships, mentorship, student innovation, guest sessions and collaboration with universities and training institutions."},
{title:"Technology partnerships",text:"Cloud providers, software platforms, developer ecosystems, infrastructure partners and specialist technical organisations."},
{title:"Commercial partnerships",text:"Joint delivery, referrals, distribution, integration, co-development and market access."},
{title:"Institutional & impact partnerships",text:"Programmes that advance digital skills, inclusion, innovation and practical community solutions."}
]}/>
<section className="content-section"><div className="container application-panel"><div><p className="eyebrow">Partnership enquiries</p><h2 className="section-title">Let’s identify the opportunity.</h2><p className="body-copy">Share your organisation, the kind of collaboration you have in mind and the outcome you would like to pursue.</p></div><a className="button-primary" href="mailto:partnerships@codemtaani.com?subject=Partnership%20enquiry">Discuss a partnership ↗</a></div></section>
</PageShell>}
