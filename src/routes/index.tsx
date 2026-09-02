import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, ShieldCheck, Sparkles, Linkedin } from "lucide-react";
import { VEYRA_MARK_SRC } from "@/assets/veyra-mark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: WaitlistLanding,
  head: () => ({
    meta: [
      { title: "Veyra Found — India's Co-Founder Matching Platform | Join the Waitlist" },
      { name: "description", content: "Veyra Found matches Indian founders with verified, compatible co-founders. Join the waitlist — the first 500 get 3 months of Pro free at launch." },
      { property: "og:title", content: "Veyra Found — India's co-founder matching platform" },
      { property: "og:description", content: "Join the waitlist. Verified founders, compatibility science, and structured intros — launching soon in India." },
      { property: "og:url", content: "https://veyrafound.in/" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Veyra Found",
        url: "https://veyrafound.in/",
        description: "India's co-founder matching platform. Currently in waitlist.",
        sameAs: ["https://www.linkedin.com/company/veyra-found"],
      }),
    }],
  }),
});

function WaitlistLanding() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: total = 0, refetch } = useQuery({
    queryKey: ["waitlist-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("waitlist_count");
      if (error) throw error;
      return (data as number) ?? 0;
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const from = shown;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 700);
      setShown(Math.round(from + (total - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || mail.length > 255) {
      setError("Enter a valid email address");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("waitlist").insert({ email: mail });
    setBusy(false);
    if (err && !`${err.message}`.toLowerCase().includes("duplicate")) {
      setError("Something went wrong. Try again.");
      return;
    }
    setJoined(true);
    setEmail("");
    refetch();
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="border-b-[3px] border-ink bg-ink text-cream overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-2 text-sm font-bold uppercase tracking-widest">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
              <span className="text-orange">★</span> Student made
              <span className="text-orange">★</span> Built for founders
              <span className="text-orange">★</span> Launching soon
              <span className="text-orange">★</span>
            </div>
          ))}
        </div>
      </div>

      <header className="border-b-[3px] border-ink bg-cream">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden border-[3px] border-ink bg-cream shadow-brutal-sm transition-transform group-hover:-rotate-6">
              <img src={VEYRA_MARK_SRC} alt="Veyra Found" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight">Veyra Found</span>
              <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-orange">Connect · Build · Beyond</span>
            </div>
          </Link>
          <span className="border-[3px] border-ink bg-orange px-3 py-1.5 text-[11px] font-black uppercase shadow-brutal-sm">Coming soon</span>
        </div>
      </header>

      <main className="relative overflow-hidden bg-sage">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <section className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-24">
          <div className="inline-flex items-center gap-2 border-[3px] border-ink bg-cream px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm">
            <ShieldCheck className="h-4 w-4 text-red" strokeWidth={3} /> Verified founders only
          </div>

          <h1 className="mt-6 text-[2.4rem] leading-[1.05] sm:text-5xl md:text-6xl">
            India's co-founder<br />
            <span className="my-1 inline-block border-[3px] border-ink bg-orange px-3 py-0.5 shadow-brutal">matching platform.</span>
            <br />
            <span className="text-red">Join the waitlist.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-ink/80">
            Veyra Found helps Indian founders meet the person they'll build with. Every profile is verified, a short
            personality and working-style assessment powers real compatibility matching, and structured intros take you
            from first message to trial project to confirmed co-founder — no swiping, no noise.
          </p>

          <form onSubmit={join} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@company.com"
              aria-label="Email address"
              className="w-full border-[3px] border-ink bg-cream px-4 py-3 font-bold text-ink outline-none placeholder:text-ink/40"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex shrink-0 items-center justify-center gap-2 border-[3px] border-ink bg-red px-6 py-3 text-sm font-black uppercase text-cream box-press disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Join waitlist <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </form>

          {error && <p className="mt-3 text-sm font-black uppercase text-red">{error}</p>}
          {joined && !error && (
            <p className="mt-3 inline-block border-[3px] border-ink bg-cream px-3 py-1.5 text-sm font-black uppercase shadow-brutal-sm">
              You're on the list. We'll email you at launch.
            </p>
          )}

          <div className="mx-auto mt-10 inline-block border-[3px] border-ink bg-ink px-6 py-5 text-cream shadow-brutal">
            <div className="text-5xl font-black md:text-6xl">
              <span className="bg-orange px-2 text-ink">{shown.toLocaleString("en-IN")}</span>
            </div>
            <div className="mt-3 text-xs font-black uppercase tracking-widest text-cream/70">Founders already waiting</div>
          </div>

          <div className="mx-auto mt-10 max-w-xl border-[3px] border-ink bg-cream p-5 shadow-brutal">
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-ink/60">
              <Sparkles className="h-4 w-4 text-red" strokeWidth={3} /> Early access perk
            </div>
            <p className="mt-2 text-xl font-black uppercase leading-snug">
              First 500 on the waitlist get <span className="bg-orange px-1">3 months of Pro free</span> at launch
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-ink py-8 text-center text-xs font-black uppercase tracking-widest text-cream/70">
        <a
          href="https://www.linkedin.com/company/veyra-found"
          target="_blank"
          rel="noreferrer"
          className="mb-5 inline-flex items-center gap-2 border-[3px] border-cream bg-ink px-4 py-2 text-cream transition-transform hover:-translate-y-0.5 hover:bg-cream hover:text-ink box-press"
        >
          <Linkedin className="h-4 w-4" strokeWidth={3} /> Follow on LinkedIn
        </a>
        <p>© 2026 Veyra Found · Built for founders in India</p>
      </footer>
    </div>
  );
}
