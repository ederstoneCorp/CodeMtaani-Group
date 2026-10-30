import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { EnquiryForm } from "@/components/enquiry-form";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage(){return <PageShell eyebrow="Get in touch / Contact" title="Start a conversation." intro="Tell us what you are working on, the challenge you need to solve or the kind of collaboration you want to explore.">
<section className="content-section"><div className="container contact-grid"><div><p className="eyebrow">Send an enquiry</p><h2 className="section-title">A useful conversation starts with context.</h2><p className="body-copy">Share your goals, requirements and expected timelines. Select the enquiry type so your message can be directed appropriately.</p><div className="contact-options"><a href="mailto:hello@codemtaani.com"><span>General enquiries</span><strong>hello@codemtaani.com ↗</strong></a><a href="mailto:partnerships@codemtaani.com"><span>Partnerships</span><strong>partnerships@codemtaani.com ↗</strong></a><a href="mailto:careers@codemtaani.com"><span>Careers</span><strong>careers@codemtaani.com ↗</strong></a></div></div><EnquiryForm/></div></section>
</PageShell>}
