import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VeyraMark } from "@/components/VeyraLogo";
import { GoogleButton } from "@/components/GoogleButton";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    router.navigate({ to: "/discover" });
  }



  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Animated background layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.08]" />

        {/* Large outlined square */}
        <div className="animate-drift absolute -left-6 top-[10%] h-36 w-36 border-[3px] border-ink/20 rotate-12 sm:left-[5%] sm:h-48 sm:w-48" />

        {/* Large outlined circle */}
        <div className="animate-drift-reverse absolute -right-8 top-[16%] h-44 w-44 rounded-full border-[3px] border-ink/20 sm:right-[6%] sm:h-56 sm:w-56" />

        {/* Small orange diamond */}
        <div className="animate-drift absolute left-[10%] top-[34%] h-14 w-14 bg-orange/40 rotate-45 shadow-brutal-sm sm:h-20 sm:w-20" />

        {/* Small sage square */}
        <div className="animate-drift-reverse absolute right-[8%] top-[40%] h-16 w-16 bg-sage/50 shadow-brutal-sm sm:h-24 sm:w-24" />

        {/* Rotating cross */}
        <div className="animate-rotate-slow absolute left-[6%] bottom-[18%] h-20 w-20 sm:left-[12%] sm:bottom-[16%]">
          <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-ink/20" />
          <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-ink/20" />
        </div>

        {/* Pulsing red blob */}
        <div className="animate-pulse-slow absolute right-[6%] bottom-[22%] h-24 w-24 rounded-full bg-red/30 blur-2xl sm:right-[10%] sm:h-36 sm:w-36" />

        {/* Dotted strip */}
        <div className="animate-drift absolute bottom-[12%] left-[28%] flex gap-4 sm:bottom-[16%]">
          <div className="h-3 w-3 rounded-full bg-ink/25" />
          <div className="h-3 w-3 rounded-full bg-ink/25" />
          <div className="h-3 w-3 rounded-full bg-ink/25" />
        </div>

        {/* Tiny floating squares */}
        <div className="animate-drift-reverse absolute right-[22%] top-[8%] h-5 w-5 border-2 border-ink/25" />
        <div className="animate-drift absolute left-[50%] top-[6%] h-4 w-4 bg-ink/20" />

        {/* Extra orange stripe */}
        <div className="animate-drift absolute left-[75%] top-[60%] h-16 w-4 bg-orange/40 rotate-12 sm:h-24 sm:w-6" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-cream shadow-brutal-sm"><VeyraMark size={20} /></div>
            <span className="text-lg font-black">Veyra Found</span>
          </Link>
        </header>
        <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12 animate-page-in">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-text">Sign in to find your co-founder.</p>
          </div>
          <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-card">
            <div>
              <label className="text-xs font-semibold text-muted-text">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-text">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
            </div>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </button>
          </form>
          <div className="flex items-center gap-3">
            <div className="h-[3px] flex-1 bg-ink/20" />
            <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">or</span>
            <div className="h-[3px] flex-1 bg-ink/20" />
          </div>
          <GoogleButton />




          <div className="text-center text-sm text-muted-text">
            New here?{" "}<Link to="/auth/signup" className="font-semibold text-indigo">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
