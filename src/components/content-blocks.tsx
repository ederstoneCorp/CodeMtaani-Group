import Link from "next/link";

type Card = { number?: string; title: string; text: string; tag?: string };
export function IntroSection({label,title,text}:{label:string;title:string;text:string}) {
 return <section className="content-section"><div className="container two-col"><div><p className="eyebrow">{label}</p></div><div><h2 className="section-title">{title}</h2><p className="body-copy">{text}</p></div></div></section>;
}
export function CardGrid({items}:{items:Card[]}) {
 return <section className="content-section soft-section"><div className="container card-grid">{items.map((item,i)=><article className="info-card" key={item.title}><span className="card-number">{item.number || String(i+1).padStart(2,"0")}</span>{item.tag && <span className="card-tag">{item.tag}</span>}<h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>;
}
export function TextRows({items}:{items:Card[]}) {
 return <section className="content-section"><div className="container text-rows">{items.map((item,i)=><article key={item.title}><span className="card-number">{item.number || String(i+1).padStart(2,"0")}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><span className="row-mark">↗</span></article>)}</div></section>;
}
export function ContactLink({label="Talk to our team"}:{label?:string}) {
 return <Link href="/contact" className="text-link">{label} <span>↗</span></Link>;
}
