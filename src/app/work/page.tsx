import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid } from "@/components/content-blocks";
export const metadata: Metadata = { title: "Products & Work" };
export default function WorkPage(){return <PageShell eyebrow="Our portfolio / Products & work" title="Ideas developed into digital experiences." intro="A growing portfolio of products, experiments and client solutions. We are building this space to document what we make, why it matters and what we learn.">
<IntroSection label="Portfolio approach" title="Evidence over claims." text="We will present projects with clear descriptions of the problem, the solution, the technologies involved and the outcomes achieved. Only work that is approved for public display should appear as a published case study."/>
<CardGrid items={[
{title:"Digital products",tag:"Product portfolio",text:"A home for platforms and applications developed within the group, with product status, purpose and access links clearly identified."},
{title:"Client solutions",tag:"Case studies",text:"Selected websites, software and integrations delivered for clients, documented with agreed project details and outcomes."},
{title:"Experiments & prototypes",tag:"Innovation",text:"Early-stage concepts and technical explorations, clearly labelled as prototypes rather than launched products."}
]}/>
</PageShell>}
