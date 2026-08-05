import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Email + password sign-in / sign-up box. */
export function EmailAuthBox({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentReset, setSentReset] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        toast.success("Account created!");
        router.navigate({ to: "/discover" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        router.navigate({ to: "/discover" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSentReset(true);
    toast.success("Password reset link sent.");
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-[3px] border-ink bg-cream p-4 shadow-brutal-sm">
      <label className="block text-[10px] font-black uppercase tracking-wider text-ink/70">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full border-[3px] border-ink bg-white px-3 py-2 text-sm font-bold text-ink outline-none placeholder:text-ink/40 focus:shadow-brutal-sm"
        />
      </label>

      <label className="block text-[10px] font-black uppercase tracking-wider text-ink/70">
        Password
        <div className="relative mt-1">
          <input
            type={show ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full border-[3px] border-ink bg-white px-3 py-2 pr-11 text-sm font-bold text-ink outline-none placeholder:text-ink/40 focus:shadow-brutal-sm"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink/70 hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase text-ink shadow-brutal-sm box-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Sign in"}
      </button>

      {mode === "login" && (
        <button
          type="button"
          onClick={forgot}
          className="w-full text-center text-[11px] font-black uppercase tracking-wide text-ink/60 underline hover:text-ink"
        >
          {sentReset ? "Reset link sent — check your inbox" : "Forgot password?"}
        </button>
      )}
    </form>
  );
}
