import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles, ShieldCheck, ArrowRight, CheckCircle2, BarChart3, MessagesSquare,
  Zap, Users, Rocket, Star, MoveUpRight, Linkedin,
} from "lucide-react";
import { VeyraMark } from "@/components/VeyraLogo";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Veyra Found — Find Your Startup Co-Founder in India" },
      { name: "description", content: "Veyra Found matches Indian founders with compatible co-founders using verified profiles, personality science and structured intros — not endless swiping." },
      { property: "og:title", content: "Veyra Found — Find Your Startup Co-Founder in India" },
      { property: "og:description", content: "Match with verified Indian founders using compatibility science and structured intros — from first message to confirmed co-founder." },
      { property: "og:url", content: "https://veyrafound.in/" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", name: "Veyra Found", url: "https://veyrafound.in/", description: "India's co-founder matching platform." },
          { "@type": "WebSite", name: "Veyra Found", url: "https://veyrafound.in/" },
        ],
      }),
    }],
  }),
});

const PROMPTS = [
  { q: "The startup I wish existed in India...", a: "A modern Chargebee for Indian SMBs — GST-native, WhatsApp-first, priced in rupees." },
  { q: "My unfair advantage is...", a: "Ran GTM for 3 SaaS exits. I know every CFO in the Bangalore fintech corridor by name." },
  { q: "A hill I will die on...", a: "Ship weekly or it isn't a product. Monthly release cycles are cope." },
];

function Landing() {
  const [pIdx, setPIdx] = useState(0);
  const [count, setCount] = useState({ f: 0, c: 0, p: 0, r: 0 });

  useEffect(() => {
    const t = setInterval(() => setPIdx((i) => (i + 1) % PROMPTS.length), 3600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const targets = { f: 12400, c: 3800, p: 940, r: 48 };
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setCount({
        f: Math.round(targets.f * e),
        c: Math.round(targets.c * e),
        p: Math.round(targets.p * e),
        r: Math.round(targets.r * e),
      });
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const prompt = PROMPTS[pIdx];

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Announcement bar (marquee) */}
      <div className="border-b-[3px] border-ink bg-ink text-cream overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-2 text-sm font-bold uppercase tracking-widest">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
              <span className="text-orange">★</span> Verified founders only
              <span className="text-orange">★</span> Built in Bangalore
              <span className="text-orange">★</span> 940+ co-founder pairs matched
              <span className="text-orange">★</span> ₹48Cr raised
              <span className="text-orange">★</span> No swipes. No games.
              <span className="text-orange">★</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <header className="border-b-[3px] border-ink bg-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center border-[3px] border-ink bg-cream shadow-brutal-sm transition-transform group-hover:-rotate-6">
              <VeyraMark size={22} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight">Veyra Found</span>
              <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-orange">Connect · Build · Beyond</span>
            </div>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {[
              ["#founders", "Founders"],
              ["#how", "How it works"],
              ["#start", "Get started"],
            ].map(([h, l]) => (
              <a key={h} href={h} className="border-2 border-transparent px-3 py-1.5 text-sm font-bold uppercase hover:border-ink hover:bg-sage">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth/login" className="hidden border-[3px] border-ink bg-cream px-3 py-2 text-sm font-black uppercase box-hover sm:inline-block">
              Sign in
            </Link>
            <Link to="/auth/signup" className="border-[3px] border-ink bg-red px-3 py-2 text-sm font-black uppercase text-cream box-hover">
              Start
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b-[3px] border-ink bg-sage">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 border-[3px] border-ink bg-cream px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm">
              <ShieldCheck className="h-4 w-4 text-red" strokeWidth={3} />
              India's trust-first co-founder platform
            </div>

            <h1 className="mt-6 text-[2.6rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-7xl">
              The right<br />
              <span className="my-1 inline-block whitespace-nowrap border-[3px] border-ink bg-orange px-2 py-0.5 shadow-brutal sm:px-3">
                CO&#8209;FOUNDER
              </span>
              <br />
              changes<br />
              <span className="text-red">everything.</span>
            </h1>


            <p className="mt-6 max-w-lg text-lg font-medium text-ink/80">
              No swipes. No vibes. Verified founders, real compatibility science, and a structured process from first message to confirmed co-founder.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/signup" className="inline-flex items-center gap-2 border-[3px] border-ink bg-red px-6 py-3.5 text-sm font-black uppercase text-cream box-press">
                Find my co-founder <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </Link>
              <Link to="/auth/login" className="inline-flex items-center gap-2 border-[3px] border-ink bg-cream px-6 py-3.5 text-sm font-black uppercase box-press">
                Sign in <Zap className="h-4 w-4" strokeWidth={3} />
              </Link>
            </div>


          </div>

          {/* Interactive profile box */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 hidden h-24 w-24 border-[3px] border-ink bg-orange animate-wiggle md:block" />
            <div className="absolute -bottom-6 -right-6 hidden h-28 w-28 rounded-full border-[3px] border-ink bg-red animate-float md:block" />

            <div className="relative animate-pop-in border-[3px] border-ink bg-cream p-5 shadow-brutal-lg">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center border-[3px] border-ink bg-sage text-lg font-black">
                    NK
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black uppercase">Neha Kapoor</div>
                    <div className="truncate text-xs font-bold text-ink/70">Bangalore · GTM · Ex-Chargebee</div>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 border-2 border-ink bg-orange px-2 py-0.5 text-[10px] font-black uppercase">
                  <ShieldCheck className="h-3 w-3" strokeWidth={3} /> Veteran
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Sales", "Growth", "Fintech", "B2B"].map((s) => (
                  <span key={s} className="border-2 border-ink bg-cream px-2 py-0.5 text-[11px] font-black uppercase">
                    {s}
                  </span>
                ))}
              </div>

              <div key={pIdx} className="mt-4 animate-pop-in border-[3px] border-ink bg-sage p-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-ink/70">Prompt</div>
                <div className="mt-1 text-sm font-bold text-ink">{prompt.q}</div>
                <div className="mt-2 text-sm text-ink">
                  "{prompt.a}
                  <span className="animate-blink">▍</span>"
                </div>
                <Link
                  to="/auth/login"
                  className="mt-3 inline-flex items-center gap-1 border-2 border-ink bg-red px-3 py-1.5 text-xs font-black uppercase text-cream box-press"
                >
                  Text about this <ArrowRight className="h-3 w-3" strokeWidth={3} />
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t-[3px] border-ink pt-3">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5 text-red" strokeWidth={3} /> LinkedIn
                </div>
                <div className="text-right text-sm font-black uppercase text-red">92% match</div>
              </div>

              {/* dot navigation */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {PROMPTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPIdx(i)}
                    aria-label={`Prompt ${i + 1}`}
                    className={`h-3 w-3 border-2 border-ink transition-transform ${i === pIdx ? "bg-red scale-110" : "bg-cream"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b-[3px] border-ink bg-ink text-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-ink md:grid-cols-4">
          {[
            [count.f.toLocaleString() + "+", "Founders"],
            [count.c.toLocaleString() + "+", "Connections"],
            [count.p.toLocaleString() + "+", "Co-founder pairs"],
            ["₹" + count.r + "Cr+", "Raised"],
          ].map(([n, l], i) => (
            <div key={l} className={`px-6 py-8 ${i % 2 === 1 ? "border-l-[3px] border-cream/20" : ""} ${i >= 2 ? "border-t-[3px] border-cream/20 md:border-t-0 md:border-l-[3px]" : ""}`}>
              <div className="text-4xl font-black md:text-5xl">
                <span className="bg-orange px-2 text-ink">{n}</span>
              </div>
              <div className="mt-3 text-xs font-black uppercase tracking-widest text-cream/70">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="founders" className="cv-auto border-b-[3px] border-ink bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-block border-[3px] border-ink bg-red px-2 py-0.5 text-[11px] font-black uppercase text-cream">Built for founders</div>
              <h2 className="text-4xl md:text-6xl">The messy reality.<br /><span className="text-orange">Boxed up.</span></h2>
            </div>
            <div className="hidden md:block">
              <div className="border-[3px] border-ink bg-sage px-4 py-3 text-xs font-black uppercase shadow-brutal-sm">No swipes ✕</div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Trust-first profiles", body: "LinkedIn, GitHub and Aadhaar verified. Vouches from people who've actually shipped with you.", bg: "bg-sage" },
              { icon: BarChart3, title: "Compatibility quiz", body: "20 questions across risk, decision speed, equity and vision. AI compat report before you talk.", bg: "bg-orange" },
              { icon: MessagesSquare, title: "Structured stages", body: "Talking → Intro Call → Trial Project → Confirmed. Label your inbox. Track what matters.", bg: "bg-red text-cream" },
            ].map((f, i) => (
              <div key={f.title} className={`group relative border-[3px] border-ink ${f.bg} p-6 shadow-brutal box-hover`}>
                <div className="absolute -top-4 -left-4 grid h-10 w-10 place-items-center border-[3px] border-ink bg-cream text-sm font-black text-ink">
                  0{i + 1}
                </div>
                <div className="grid h-12 w-12 place-items-center border-[3px] border-ink bg-cream text-ink">
                  <f.icon className="h-6 w-6" strokeWidth={3} />
                </div>
                <div className="mt-5 text-xl font-black uppercase">{f.title}</div>
                <p className="mt-2 text-sm font-medium">{f.body}</p>
                <MoveUpRight className="mt-6 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" strokeWidth={3} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="cv-auto border-b-[3px] border-ink bg-sage">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-4xl md:text-6xl">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {([
              ["01", "Build profile", "Prompts, verified skills, video intro.", Users],
              ["02", "Take the quiz", "20 questions. 4 minutes. Locked after.", BarChart3],
              ["03", "Browse & connect", "Tap a prompt you loved. Skip small talk.", MessagesSquare],
              ["04", "Confirm & ship", "Log stages. Build together, week by week.", Rocket],
            ] as const).map(([n, t, b, Icon], i) => (
              <div key={n} className={`border-[3px] border-ink bg-cream p-5 shadow-brutal box-hover`} style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}>
                <div className="flex items-center justify-between">
                  <div className="border-2 border-ink bg-orange px-2 py-0.5 text-xs font-black">{n}</div>
                  <Icon className="h-5 w-5" strokeWidth={3} />
                </div>
                <div className="mt-3 text-lg font-black uppercase">{t}</div>
                <p className="mt-2 text-sm font-medium text-ink/80">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial strip */}
      <section className="cv-auto border-b-[3px] border-ink bg-orange">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3 md:py-20">
          {[
            { q: "Found my technical co-founder in 11 days. Shipped MVP in 3 weeks.", who: "Rahul, Fintech" },
            { q: "The compat report saved me from a very expensive mistake.", who: "Ananya, Healthtech" },
            { q: "Actually verified. Actually founders. Actually works.", who: "Vikram, D2C" },
          ].map((t, i) => (
            <figure key={i} className="border-[3px] border-ink bg-cream p-5 shadow-brutal box-hover">
              <div className="flex gap-0.5 text-red">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" strokeWidth={2} />)}
              </div>
              <blockquote className="mt-3 text-lg font-bold leading-snug">"{t.q}"</blockquote>
              <figcaption className="mt-4 text-xs font-black uppercase text-ink/70">— {t.who}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="start" className="cv-auto border-b-[3px] border-ink bg-red text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 md:py-28">
          <h2 className="text-5xl md:text-7xl">Ready to find<br /><span className="bg-cream px-3 text-ink border-[3px] border-ink shadow-brutal inline-block">your co-founder?</span></h2>
          <p className="mt-6 text-lg font-bold text-cream/90">Free. No credit card. Real founders only.</p>
          <Link to="/auth/signup" className="mt-8 inline-flex items-center gap-2 border-[3px] border-cream bg-ink px-8 py-4 text-sm font-black uppercase text-cream box-press">
            Get started <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        </div>
      </section>

      <footer className="bg-ink py-8 text-center text-xs font-black uppercase tracking-widest text-cream/70">
        <a
          href="https://www.linkedin.com/company/veyra-found"
          target="_blank"
          rel="noreferrer"
          aria-label="Veyra Found on LinkedIn"
          className="mb-5 inline-flex items-center gap-2 border-[3px] border-cream bg-ink px-4 py-2 text-cream transition-transform hover:-translate-y-0.5 hover:bg-cream hover:text-ink box-press"
        >
          <Linkedin className="h-4 w-4" strokeWidth={3} /> Follow on LinkedIn
        </a>
        <p>© 2026 Veyra Found · Built for founders in India</p>
      </footer>

    </div>
  );
}
