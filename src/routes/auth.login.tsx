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
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-cream shadow-brutal-sm"><VeyraMark size={20} /></div>
          <span className="text-lg font-black">veyra</span>
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
  );
}
