import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  async function demoSignIn() {
    setLoading(true);
    // try login first
    let { error } = await supabase.auth.signInWithPassword({ email: "demo@cofound.ai", password: "demo1234" });
    if (error) {
      // signup
      const { error: sErr } = await supabase.auth.signUp({
        email: "demo@cofound.ai", password: "demo1234",
        options: { data: { full_name: "Arjun Sharma", role: "founder" } },
      });
      if (sErr && !sErr.message.includes("registered")) { setLoading(false); return toast.error(sErr.message); }
      const login2 = await supabase.auth.signInWithPassword({ email: "demo@cofound.ai", password: "demo1234" });
      error = login2.error;
    }
    if (error) { setLoading(false); return toast.error(error.message); }
    // Claim Arjun founder
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      // Move Arjun's founder record to this user (if not already claimed)
      const { data: existing } = await supabase.from("founders").select("id").eq("user_id", userData.user.id).maybeSingle();
      if (!existing) {
        await supabase.from("founders").update({ user_id: userData.user.id }).eq("id", "11111111-1111-1111-1111-111111111111").is("user_id", null);
      }
    }
    setLoading(false);
    toast.success("Signed in as Arjun (demo)");
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
        <button onClick={demoSignIn} disabled={loading} className="rounded-lg border border-dashed border-indigo bg-indigo/5 py-2.5 text-sm font-semibold text-indigo hover:bg-indigo/10">
          One-click demo login (as Arjun Sharma)
        </button>
        <div className="text-center text-sm text-muted-text">
          New here?{" "}<Link to="/auth/signup" className="font-semibold text-indigo">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
