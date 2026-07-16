import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Rocket, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

function Signup() {
  const router = useRouter();
  const [role, setRole] = useState<"founder" | "investor">("founder");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    const { error: sErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (sErr) return toast.error(sErr.message);
    toast.success("Account created");
    router.navigate({ to: role === "investor" ? "/investor-feed" : "/onboarding" });
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo text-white"><Sparkles className="h-4 w-4" /></div>
          <span className="text-lg font-black">CoFound<span className="text-indigo">.ai</span></span>
        </Link>
      </header>
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-text">Choose your role to get started.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { r: "founder", icon: Rocket, title: "I'm a Founder", body: "Find a co-founder to build with." },
            { r: "investor", icon: TrendingUp, title: "I'm an Investor", body: "Discover confirmed founding teams." },
          ] as const).map(({ r, icon: Icon, title, body }) => (
            <button key={r} onClick={() => setRole(r)} type="button" className={`rounded-2xl border-2 p-4 text-left transition ${role === r ? "border-indigo bg-indigo/5" : "border-border bg-white hover:border-indigo/40"}`}>
              <Icon className={`h-6 w-6 ${role === r ? "text-indigo" : "text-muted-text"}`} />
              <div className="mt-3 font-bold">{title}</div>
              <div className="mt-1 text-xs text-muted-text">{body}</div>
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-card">
          <div>
            <label className="text-xs font-semibold text-muted-text">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-text">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-text">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
          </div>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
          </button>
        </form>
        <div className="text-center text-sm text-muted-text">
          Already have an account?{" "}<Link to="/auth/login" className="font-semibold text-indigo">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
