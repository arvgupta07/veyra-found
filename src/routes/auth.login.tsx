import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { VeyraMark } from "@/components/VeyraLogo";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@cofound.ai");
  const [password, setPassword] = useState("demo1234");
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

  async function demoSignIn(tier: "free" | "pro") {
    setLoading(true);
    const cfg = tier === "pro"
      ? { email: "demo-pro@cofound.ai", password: "demo1234", name: "Priya Nair", founderId: "44444444-4444-4444-4444-444444444444", isPro: true }
      : { email: "demo@cofound.ai",     password: "demo1234", name: "Arjun Sharma", founderId: "11111111-1111-1111-1111-111111111111", isPro: false };

    let { error } = await supabase.auth.signInWithPassword({ email: cfg.email, password: cfg.password });
    if (error) {
      const { error: sErr } = await supabase.auth.signUp({
        email: cfg.email, password: cfg.password,
        options: { data: { full_name: cfg.name, role: "founder" } },
      });
      if (sErr && !sErr.message.includes("registered")) { setLoading(false); return toast.error(sErr.message); }
      const login2 = await supabase.auth.signInWithPassword({ email: cfg.email, password: cfg.password });
      error = login2.error;
    }
    if (error) { setLoading(false); return toast.error(error.message); }

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: existing } = await supabase.from("founders").select("id").eq("user_id", userData.user.id).maybeSingle();
      if (!existing) {
        await supabase.from("founders").update({ user_id: userData.user.id }).eq("id", cfg.founderId).is("user_id", null);
      }
      await supabase.from("profiles").update({ is_pro: cfg.isPro }).eq("id", userData.user.id);
    }
    setLoading(false);
    toast.success(`Signed in as ${cfg.name} (${tier === "pro" ? "Pro" : "Free"} demo)`);
    router.navigate({ to: "/discover" });
  }


  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo text-white"><Sparkles className="h-4 w-4" /></div>
          <span className="text-lg font-black">CoFound<span className="text-indigo">.ai</span></span>
        </Link>
      </header>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
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
        <button
          onClick={async () => {
            const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
            if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white py-2.5 text-sm font-black text-ink shadow-brutal-sm box-hover"
        >
          <svg className="h-4 w-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.2 30.2 0 24 0 14.6 0 6.4 5.4 2.4 13.3l7.8 6c1.9-5.7 7.3-9.8 13.8-9.8z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-9.9 7.1-17.3z"/><path fill="#FBBC05" d="M10.2 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.5 0 20.2 0 24s.9 7.5 2.4 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.2 15.9-5.9l-7.5-5.8c-2.1 1.4-4.7 2.2-8.4 2.2-6.5 0-12-4.1-13.8-9.8l-7.8 6C6.4 42.6 14.6 48 24 48z"/></svg>
          Continue with Google
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => demoSignIn("free")} disabled={loading} className="rounded-lg border-2 border-ink bg-white py-2.5 text-sm font-black text-ink shadow-brutal-sm box-hover">
            Demo · Free tier
          </button>
          <button onClick={() => demoSignIn("pro")} disabled={loading} className="rounded-lg border-2 border-ink bg-orange py-2.5 text-sm font-black text-ink shadow-brutal-sm box-hover">
            Demo · Pro tier ✨
          </button>
        </div>

        <div className="text-center text-sm text-muted-text">
          New here?{" "}<Link to="/auth/signup" className="font-semibold text-indigo">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
