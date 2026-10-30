import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Atom, Code2, Cpu, Globe2, Layers3, Menu, MoveUpRight, Network, ShieldCheck, Sparkles } from "lucide-react";

const divisions = [
  { n: "01", title: "Digital Solutions", text: "Purpose-built software, web platforms and digital experiences for real-world needs.", icon: Code2 },
  { n: "02", title: "AI & Data", text: "Applied intelligence, automation and data-driven systems that make work smarter.", icon: Cpu },
  { n: "03", title: "Education & Research", text: "Learning technologies, research partnerships and practical pathways into technology.", icon: Atom },
  { n: "04", title: "Social Technologies", text: "Digital communities and platforms that connect people, ideas and opportunities.", icon: Network },
  { n: "05", title: "Cloud & Infrastructure", text: "Reliable, secure foundations for modern digital products and organisations.", icon: Layers3 },
  { n: "06", title: "Innovation Labs", text: "Exploration, experimentation and new ventures built around emerging possibilities.", icon: Sparkles },
];

const principles = ["Build for meaningful impact", "Engineer for trust and resilience", "Grow talent and opportunity", "Think beyond borders"];

export default function Home() {
  return (
    <main>
      <header className="absolute inset-x-0 top-0 z-20 text-white">
        <div className="container flex h-20 items-center justify-between border-b border-white/15">
          <Link href="/" className="flex items-center gap-3" aria-label="CodeMtaani Group home">
            <Image src="/Codemtaani%20Group%20logo%20(2).png" alt="CodeMtaani Group" width={64} height={64} priority className="h-14 w-14 rounded-full object-cover" />
            <span className="text-sm font-extrabold tracking-tight">CODEMTAANI<span className="text-[#e00000]">.</span><span className="block text-[9px] font-semibold tracking-[.28em] text-white/55">GROUP</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-semibold text-white/75 md:flex">
            <a href="#about" className="hover:text-[#e00000]">About</a><a href="#divisions" className="hover:text-[#e00000]">Divisions</a><a href="#approach" className="hover:text-[#e00000]">Our approach</a><a href="#contact" className="hover:text-[#e00000]">Contact</a>
          </nav>
          <a href="#contact" className="hidden items-center gap-2 rounded-full bg-[#e00000] px-5 py-3 text-xs font-extrabold text-[#050505] transition hover:bg-white md:flex">Start a conversation <ArrowUpRight size={15}/></a>
          <details className="relative md:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-white/20" aria-label="Open navigation menu"><Menu size={19}/></summary>
            <nav className="absolute right-0 top-14 flex w-56 flex-col gap-1 rounded-2xl border border-white/10 bg-[#080808] p-3 text-sm text-white shadow-2xl">
              <a href="#about" className="rounded-xl px-4 py-3 hover:bg-white/10">About</a>
              <a href="#divisions" className="rounded-xl px-4 py-3 hover:bg-white/10">Divisions</a>
              <a href="#approach" className="rounded-xl px-4 py-3 hover:bg-white/10">Our approach</a>
              <a href="#contact" className="rounded-xl bg-[#e00000] px-4 py-3 font-bold text-black">Contact us</a>
            </nav>
          </details>
        </div>
      </header>

      <section className="relative flex min-h-[760px] items-end overflow-hidden bg-[#050505] pb-20 pt-36 text-white md:min-h-[850px] md:pb-28">
        <div className="grid-lines absolute inset-0 opacity-70"/>
        <div className="absolute -right-24 top-28 h-[520px] w-[520px] rounded-full border border-[#e00000]/20 md:right-[8%]"><div className="absolute inset-12 rounded-full border border-[#e00000]/20"/><div className="absolute inset-28 rounded-full border border-[#e00000]/20"/><div className="absolute inset-0 rounded-full bg-[#e00000]/5 blur-3xl"/></div>
        <div className="container relative z-10 grid gap-12 md:grid-cols-[1.3fr_.7fr] md:items-end">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/65"><span className="h-2 w-2 rounded-full bg-[#e00000]"/> Kenyan-rooted. Africa-focused. Globally minded.</div>
            <h1 className="display max-w-4xl">Think.<br/><span className="text-[#e00000]">Build. Transform.</span></h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-white/65 md:text-lg">We build digital products, develop practical solutions and create opportunities through technology.</p>
            <div className="mt-10 flex flex-wrap items-center gap-4"><a href="#divisions" className="inline-flex items-center gap-3 rounded-full bg-[#e00000] px-7 py-4 text-sm font-extrabold text-[#050505] transition hover:translate-y-[-2px]">Explore what we do <ArrowUpRight size={17}/></a><a href="#about" className="px-4 py-4 text-sm font-semibold text-white/70 hover:text-white">Discover CodeMtaani <ArrowDownRight className="ml-1 inline" size={15}/></a></div>
          </div>
          <div className="hidden justify-self-end pb-2 md:block"><div className="mb-4 text-right text-[10px] font-bold uppercase tracking-[.25em] text-white/40">Our guiding principle</div><div className="text-right text-3xl font-light leading-tight tracking-tight">Think.<br/>Build.<br/><span className="font-bold text-[#e00000]">Transform.</span></div><div className="mt-6 h-px w-36 bg-[#e00000]/60"/></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e00000]/60 to-transparent"/>
      </section>

      <section id="about" className="container grid gap-12 py-28 md:grid-cols-[.7fr_1.3fr] md:py-36">
        <div><p className="eyebrow">01 / Who we are</p><p className="mt-5 max-w-xs text-sm leading-7 text-[#555555]">An independent technology group, built from Kenya with a wider horizon.</p></div>
        <div><h2 className="section-title max-w-4xl">We see technology as a tool to <span className="text-[#2600d8]">move people and possibilities forward.</span></h2><p className="mt-8 max-w-2xl text-base leading-8 text-[#555555]">CodeMtaani Group brings together digital solutions, product development, research and innovation. Our ambition is to build useful technology, grow capable teams and create lasting value across Africa and beyond.</p></div>
      </section>

      <section id="divisions" className="bg-[#e7e7e7] py-24 md:py-32">
        <div className="container">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">02 / What we build</p><h2 className="section-title mt-5 max-w-2xl">A connected group.<br/>Multiple capabilities.</h2></div><p className="max-w-sm text-sm leading-7 text-[#555555]">Our divisions are designed to work together, combining specialist knowledge with shared infrastructure and a common direction.</p></div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">{divisions.map(({n,title,text,icon:Icon})=><article key={n} className="group min-h-[250px] bg-[#f4f4f4] p-8 transition hover:bg-[#050505] hover:text-white"><div className="flex items-start justify-between"><span className="text-xs font-bold text-[#82917f]">{n}</span><Icon className="text-[#2600d8] transition group-hover:text-[#e00000]" size={25}/></div><h3 className="mt-12 text-xl font-bold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-[#555555] transition group-hover:text-white/60">{text}</p><ArrowUpRight className="mt-7 text-[#2600d8] transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#e00000]" size={18}/></article>)}</div>
        </div>
      </section>

      <section id="approach" className="bg-[#050505] py-24 text-white md:py-32">
        <div className="container grid gap-16 md:grid-cols-2">
          <div><p className="eyebrow text-[#e00000]">03 / How we work</p><h2 className="section-title mt-5">Built on ideas.<br/>Grounded in execution.</h2><p className="mt-7 max-w-lg text-sm leading-7 text-white/55">We pair curiosity with discipline: understand the problem, build with care, learn from people and improve continuously.</p><a href="#contact" className="mt-9 inline-flex items-center gap-3 text-sm font-bold text-[#e00000]">Work with us <MoveUpRight size={16}/></a></div>
          <div className="grid gap-0">{principles.map((p,i)=><div key={p} className="flex items-center gap-6 border-b border-white/15 py-7"><span className="text-xs font-bold text-[#e00000]">0{i+1}</span><span className="text-lg font-medium tracking-tight text-white/85">{p}</span></div>)}</div>
        </div>
      </section>

      <section id="contact" className="container py-24 md:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-[#e00000] p-8 text-black md:p-16"><div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border border-[#050505]/15"/><div className="absolute -right-2 -top-10 h-52 w-52 rounded-full border border-[#050505]/15"/><div className="relative max-w-3xl"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#080808]">04 / Start something meaningful</p><h2 className="mt-6 text-4xl font-extrabold leading-[.98] tracking-[-.06em] md:text-6xl">Have a challenge<br/>worth solving?</h2><p className="mt-6 max-w-lg text-sm leading-7 text-[#080808]">Tell us what you are building, what you need or where you see an opportunity. Let's explore what we can make possible.</p><a href="mailto:hello@codemtaani.com" className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#050505] px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#050505]">hello@codemtaani.com <ArrowUpRight size={17}/></a></div></div>
      </section>

      <footer className="bg-[#050505] py-10 text-white"><div className="container flex flex-col justify-between gap-8 border-t border-white/15 pt-8 md:flex-row md:items-center"><div className="flex items-center gap-3"><Image src="/Codemtaani%20Group%20logo%20(2).png" alt="" width={44} height={44} className="h-10 w-10 rounded-full object-cover" /><div className="text-xs font-extrabold tracking-tight">CODEMTAANI GROUP<span className="ml-2 text-[#e00000]">®</span><div className="mt-1 text-[9px] font-medium tracking-[.22em] text-white/45">THINK. BUILD. TRANSFORM.</div></div></div><div className="text-xs text-white/40">© {new Date().getFullYear()} CodeMtaani Group. All rights reserved.</div><div className="flex gap-5 text-xs text-white/55"><a href="#about" className="hover:text-[#e00000]">About</a><a href="#divisions" className="hover:text-[#e00000]">Divisions</a><a href="mailto:hello@codemtaani.com" className="hover:text-[#e00000]">Contact</a></div></div></footer>
    </main>
  );
}