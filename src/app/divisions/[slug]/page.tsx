import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { IntroSection, CardGrid, TextRows, ContactLink } from "@/components/content-blocks";
import { divisions } from "../division-data";
export function generateStaticParams() { return divisions.map(({slug}) => ({slug})); }
export function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> { return params.then(({slug}) => { const item=divisions.find((d)=>d.slug===slug); return {title:item?.name ?? "Division"}; }); }
export default async function DivisionPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const item=divisions.find((d)=>d.slug===slug); if(!item) notFound();
 return <PageShell eyebrow={`CodeMtaani Group / ${item.tag}`} title={item.name} intro={item.overview}>
  <IntroSection label="What we do" title="Technology shaped around real needs." text={item.summary}/>
  <section className="content-section soft-section"><div className="container"><p className="eyebrow">Capabilities</p><h2 className="section-title">Areas of focus</h2><div className="card-grid division-capabilities">{item.capabilities.map((cap,i)=><article className="info-card" key={cap}><span className="card-number">{String(i+1).padStart(2,"0")}</span><h3>{cap}</h3></article>)}</div></div></section>
  <TextRows items={item.priorities.map((text,i)=>({title:text,text:"A guiding priority for how this capability area is developed and delivered.",number:String(i+1).padStart(2,"0")}))}/>
  <section className="content-section"><div className="container"><p className="eyebrow">Work with this division</p><h2 className="section-title">Have a challenge or an idea?</h2><p className="body-copy">Discuss a project, partnership or opportunity with the CodeMtaani Group team.</p><ContactLink label="Contact the group"/></div></section>
 </PageShell>;
}
