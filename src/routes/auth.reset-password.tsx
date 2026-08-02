import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { VeyraMark } from "@/components/VeyraLogo";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Set a new password — Veyra Found" },
      { name: "description", content: "Choose a new password for your Veyra Found account." },
      { property: "og:title", content: "Set a new password — Veyra Found" },
      { property: "og:description", content: "Choose a new password for your Veyra Found account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const pwSchema = z.string().min(8, "Use at least 8 characters").max(72, "Password is too long");

function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      if (!data.session) setError("This reset link is invalid or has expired. Request a new one.");
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = pwSchema.safeParse(password);
    if (!r.success) return setFieldError(r.error.issues[0].message);
    if (password !== confirm) return setFieldError("Passwords do not match");
    setFieldError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(err.message);
    toast.success("Password updated");
    router.navigate({ to: "/discover" });
  }

  const inputCls = (bad?: boolean) =>
    `mt-1 w-full rounded-lg border-2 px-3 py-2 text-sm outline-none focus:ring-2 ${bad ? "border-red focus:ring-red" : "border-ink/30 focus:ring-indigo"}`;

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-cream shadow-brutal-sm"><VeyraMark size={20} /></div>
          <span className="text-lg font-black">Veyra Found</span>
        </Link>
      </header>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12 animate-page-in">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-text">Choose something you'll remember.</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-white p-6 shadow-card">
          {error && (
            <div className="flex items-start gap-2 border-2 border-red bg-red/10 px-3 py-2 text-sm font-semibold text-ink">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="pw" className="text-xs font-semibold text-muted-text">New password</label>
            <input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldError(null); }} className={inputCls(!!fieldError)} />
          </div>
          <div>
            <label htmlFor="pw2" className="text-xs font-semibold text-muted-text">Confirm password</label>
            <input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setFieldError(null); }} className={inputCls(!!fieldError)} />
            {fieldError && <p className="mt-1 text-xs font-semibold text-red">{fieldError}</p>}
          </div>
          <button disabled={loading || !ready} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </button>
          <Link to="/auth/login" className="block w-full text-center text-xs font-black uppercase tracking-wide text-ink/70">Back to sign in</Link>
        </form>
      </div>
    </div>
  );
}
