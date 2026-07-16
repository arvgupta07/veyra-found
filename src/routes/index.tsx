import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Compass, ArrowRight, CheckCircle2, BarChart3, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo shadow-lg"><Sparkles className="h-5 w-5" /></div>
          <span className="text-xl font-black tracking-tight">CoFound<span className="text-indigo-light">.ai</span></span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          <a href="#founders" className="text-sm text-white/70 hover:text-white">For Founders</a>
          <a href="#investors" className="text-sm text-white/70 hover:text-white">For Investors</a>
          <a href="#how" className="text-sm text-white/70 hover:text-white">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth/login" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:text-white">Sign in</Link>
          <Link to="/auth/signup" className="rounded-lg bg-indigo px-4 py-2 text-sm font-semibold hover:bg-indigo-dark">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-radial">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 md:grid-cols-[1.15fr_1fr] md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald" /> India's trust-first co-founder platform
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tighter md:text-6xl lg:text-7xl">
              The right co-founder<br /><span className="text-indigo-light">changes everything.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/70">
              India's first platform built specifically for co-founder search. Verified profiles, compatibility science, and a structured process from first message to confirmed co-founder.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/signup" className="inline-flex items-center gap-2 rounded-lg bg-indigo px-5 py-3 text-sm font-semibold hover:bg-indigo-dark">
                Find my co-founder <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/auth/signup" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
                For investors
              </Link>
            </div>
            <div className="mt-6 text-sm text-white/50">
              Try the demo: <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/80">demo@cofound.ai</span> · <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/80">demo1234</span>
            </div>
          </div>

          {/* Floating profile card */}
          <div className="relative">
            <div className="glass-navy relative rounded-2xl border border-white/10 p-5 shadow-modal">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/initials/svg?seed=Neha%20Kapoor&backgroundColor=10B981" className="h-12 w-12 rounded-full" />
                  <div>
                    <div className="font-bold">Neha Kapoor</div>
                    <div className="text-xs text-white/60">Bangalore · GTM · Ex-Chargebee</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald/20 px-2 py-0.5 text-[10px] font-semibold text-emerald"><ShieldCheck className="h-3 w-3" />Veteran</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Sales","Growth","Fintech","B2B"].map((s) => (
                  <span key={s} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium">{s}</span>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wide text-white/50">The startup I wish existed in India...</div>
                <div className="mt-1 text-sm text-white/90">"A modern Chargebee for Indian SMBs — GST-native, WhatsApp-first, priced in rupees."</div>
                <button className="mt-3 inline-flex items-center gap-1 rounded-md bg-indigo px-3 py-1.5 text-xs font-semibold">Text them about this <ArrowRight className="h-3 w-3" /></button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="h-3 w-3 text-emerald" /> LinkedIn verified</div>
                <div className="text-xs font-bold text-indigo-light">92% compatibility</div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 hidden h-40 w-40 rounded-full bg-indigo/40 blur-3xl md:block" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-y border-white/10 bg-black/20">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 text-center md:grid-cols-4">
            {[
              ["12,400+", "Founders"],
              ["3,800+", "Connections"],
              ["940+", "Co-founder Pairs"],
              ["₹48Cr+", "Raised"],
            ].map(([n, l]) => (
              <div key={l}><div className="text-3xl font-black">{n}</div><div className="mt-1 text-xs uppercase tracking-wider text-white/50">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="founders" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-black tracking-tight">Built for the messy reality<br/>of co-founder search.</h2>
          <p className="mt-3 text-white/60">No swipes. No matches based on vibes. A real process.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Trust-first profiles", body: "LinkedIn, GitHub and Aadhaar verified. Vouches from people who've worked with you. Trust tiers you have to earn." },
            { icon: BarChart3, title: "Compatibility quiz", body: "20 questions across risk, decision speed, equity philosophy and vision. AI generates a real report before you talk." },
            { icon: MessagesSquare, title: "Structured stages", body: "Talking → Intro Call → Trial Project → Confirmed. Label your inbox. Track what matters." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo/20 text-indigo-light"><f.icon className="h-5 w-5" /></div>
              <div className="mt-4 text-lg font-bold">{f.title}</div>
              <p className="mt-2 text-sm text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-black/20 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-4xl font-black tracking-tight">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              ["01","Build profile","Prompts, verified skills and a video intro."],
              ["02","Take the quiz","20 questions. 4 minutes. Locked after."],
              ["03","Browse and connect","Tap a prompt you loved. Skip the small talk."],
              ["04","Confirm your co-founder","Log stages. Get in front of investors."],
            ].map(([n, t, b]) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-sm font-bold text-indigo-light">{n}</div>
                <div className="mt-2 text-xl font-bold">{t}</div>
                <p className="mt-2 text-sm text-white/60">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="investors" className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-4xl font-black tracking-tight">Ready to find your co-founder?</h2>
        <p className="mt-3 text-white/60">Free to join. No credit card. Real founders only.</p>
        <Link to="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo px-6 py-3 text-sm font-semibold hover:bg-indigo-dark">
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        © 2026 CoFound AI · Built for founders in India
      </footer>
    </div>
  );
}
