import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { CardGrid } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage(){return <PageShell eyebrow="Get in touch / Contact" title="Start a conversation." intro="Tell us what you are working on, the challenge you need to solve or the kind of collaboration you want to explore.">
<section className="content-section"><div className="container contact-grid"><div><p className="eyebrow">General enquiries</p><h2 className="section-title">A useful conversation starts with context.</h2><p className="body-copy">For project enquiries, include a short description of your organisation, your goals, expected timelines and any relevant requirements. We can then determine the appropriate next step.</p></div><div className="contact-options"><a href="mailto:hello@codemtaani.com"><span>General enquiries</span><strong>hello@codemtaani.com ↗</strong></a><a href="mailto:partnerships@codemtaani.com"><span>Partnerships</span><strong>partnerships@codemtaani.com ↗</strong></a><a href="mailto:careers@codemtaani.com"><span>Careers</span><strong>careers@codemtaani.com ↗</strong></a></div></div></section>
<CardGrid items={[
{title:"Project enquiries",text:"Share the problem, intended users, key features, budget range and target timeline."},
{title:"Partnership proposals",text:"Outline the organisations involved, shared objectives, proposed contribution and intended outcomes."},
{title:"Talent enquiries",text:"Include your area of expertise, experience, portfolio or professional profile and the kind of opportunity you seek."}
]}/>
</PageShell>}
