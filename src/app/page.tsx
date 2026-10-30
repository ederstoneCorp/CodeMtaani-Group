import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Atom, BrainCircuit, Code2, Globe2, Layers3, Network, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const divisions = [
 {n:"01",title:"Digital Solutions",desc:"Software, platforms and digital experiences designed around real operational needs.",icon:Code2,href:"/divisions"},
 {n:"02",title:"AI & Data",desc:"Applied intelligence, automation and data systems that turn information into useful action.",icon:BrainCircuit,href:"/divisions"},
 {n:"03",title:"Education & Research",desc:"Learning technology, research partnerships and practical pathways into the digital economy.",icon:Atom,href:"/divisions"},
 {n:"04",title:"FinTech",desc:"Technology that supports more accessible, efficient and connected financial services.",icon:Workflow,href:"/divisions"},
 {n:"05",title:"Social Technologies",desc:"Digital spaces that connect people, communities, ideas and opportunities.",icon:Network,href:"/divisions"},
 {n:"06",title:"Cloud & Infrastructure",desc:"Secure, resilient foundations for modern products, services and organisations.",icon:Layers3,href:"/divisions"},
 {n:"07",title:"Innovation Labs",desc:"Research, prototyping and experimentation for the next generation of solutions.",icon:Sparkles,href:"/innovation"}
];
const capabilities=[
 {title:"Digital product development",text:"From discovery and interface design to engineering, deployment and continuous improvement."},
 {title:"Technology services",text:"Web platforms, custom software, APIs, integrations, cloud foundations and technical support."},
 {title:"AI & automation",text:"Practical intelligent systems and workflow automation guided by real use cases."},
 {title:"Research & innovation",text:"Experimentation, technical research and collaboration to validate emerging opportunities."}
];
const principles=[
 {n:"01",title:"Think with clarity",text:"Understand the problem, the people affected and the context before choosing a solution."},
 {n:"02",title:"Build with discipline",text:"Prioritise quality, security, accessibility and maintainability throughout delivery."},
 {n:"03",title:"Transform with purpose",text:"Measure progress by the usefulness, sustainability and impact of what we create."}
];
export default function Home(){
 return <><SiteHeader/><main>
  <section className="home-hero">
   <div className="hero-grid-pattern"/>
   <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-glow"/>
   <div className="container home-hero-inner">
    <div className="hero-copy"><div className="hero-kicker"><span/> KENYAN ROOTS. AFRICAN AMBITION. GLOBAL OUTLOOK.</div>
     <h1 className="display">Think.<br/><span>Build.</span><br/>Transform<span className="hero-period">.</span></h1>
     <p className="hero-description">An independent technology group building digital products, delivering technology solutions and advancing innovation for a changing world.</p>
     <div className="hero-actions"><Link href="/divisions" className="button-primary">Explore the group <ArrowUpRight size={17}/></Link><Link href="/about" className="hero-secondary">Discover our story <ArrowDownRight size={16}/></Link></div>
    </div>
    <div className="hero-aside"><div className="hero-aside-top"><span>OUR NORTH STAR</span><Globe2 size={19}/></div><div className="hero-aside-statement">Technology should create <em>possibility.</em></div><div className="hero-aside-bottom"><span>01 / STRATEGY</span><span>02 / ENGINEERING</span><span>03 / IMPACT</span></div></div>
   </div>
   <div className="container hero-bottomline"><span>CODEMTAANI GROUP</span><span>THINK. BUILD. TRANSFORM.</span><span>KENYA · AFRICA · WORLDWIDE</span></div>
  </section>
  <section className="home-intro" id="about"><div className="container intro-layout"><div><p className="eyebrow">01 / WHO WE ARE</p><div className="intro-index">A GROUP<br/>BUILT FOR<br/><span>WHAT’S NEXT.</span></div></div><div className="intro-main"><h2 className="section-title">We bring technology, people and ideas together to <span>move possibilities forward.</span></h2><p>CodeMtaani Group is being built as a diversified technology organisation rooted in Kenya and oriented towards Africa and the wider world. Our focus spans digital solutions, emerging technologies, research and ventures that address meaningful needs.</p><Link href="/about" className="text-link">More about CodeMtaani <ArrowUpRight size={16}/></Link></div></div></section>
  <section className="division-section" id="divisions"><div className="container"><div className="section-heading-row"><div><p className="eyebrow">02 / OUR CAPABILITIES</p><h2 className="section-title">One group.<br/><span>Many frontiers.</span></h2></div><div className="heading-aside"><p>Our divisions represent connected areas of expertise, designed to collaborate through shared standards, infrastructure and direction.</p><Link href="/divisions" className="text-link">Explore all divisions <ArrowUpRight size={16}/></Link></div></div>
   <div className="division-grid">{divisions.map(({n,title,desc,icon:Icon,href})=><Link href={href} key={n} className="division-tile"><div className="tile-top"><span>{n}</span><Icon size={25}/></div><h3>{title}</h3><p>{desc}</p><span className="tile-arrow"><ArrowUpRight size={18}/></span></Link>)}</div>
  </div></section>
  <section className="services-section"><div className="container services-layout"><div className="services-lead"><p className="eyebrow">03 / WHAT WE DO</p><h2 className="section-title">From complex challenges to <span>clear solutions.</span></h2><p>We combine product thinking and engineering capability to help turn requirements into dependable digital experiences.</p><Link href="/services" className="button-primary">Explore our services <ArrowUpRight size={16}/></Link></div><div className="capability-list">{capabilities.map((item,i)=><article key={item.title}><span>0{i+1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={18}/></article>)}</div></div></section>
  <section className="approach-section" id="approach"><div className="container"><div className="approach-heading"><p className="eyebrow">04 / HOW WE THINK</p><h2 className="section-title">Ambition is important.<br/><span>Execution makes it real.</span></h2><p>Our operating philosophy is built around clear thinking, responsible engineering and outcomes that matter.</p></div><div className="principle-grid">{principles.map(item=><article key={item.n}><span>{item.n}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>
  <section className="ecosystem-section"><div className="container ecosystem-layout"><div><p className="eyebrow">05 / THE ECOSYSTEM</p><h2 className="section-title">A platform for ideas, talent and <span>partnership.</span></h2></div><div><p>Technology grows stronger when knowledge, people and institutions work together. We are building an ecosystem that supports collaboration, research, learning and the development of new ventures.</p><div className="ecosystem-links"><Link href="/innovation">Innovation & research <ArrowUpRight size={16}/></Link><Link href="/careers">Careers & talent <ArrowUpRight size={16}/></Link><Link href="/partnerships">Partnership opportunities <ArrowUpRight size={16}/></Link></div></div></div></section>
  <section className="home-contact"><div className="container contact-banner"><div className="contact-decoration"/><div className="contact-banner-content"><p className="eyebrow">06 / START A CONVERSATION</p><h2 className="section-title">Let’s build what<br/><span>comes next.</span></h2><p>Have a project, a challenge or an idea worth exploring? Tell us where you want to make progress.</p><Link href="/contact" className="button-dark">Talk to CodeMtaani <ArrowUpRight size={17}/></Link></div><div className="contact-banner-mark">CM<span>.</span></div></div></section>
 </main><SiteFooter/></>
}
