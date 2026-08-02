import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, AlertCircle, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { VeyraMark } from "@/components/VeyraLogo";
import { GoogleButton } from "@/components/GoogleButton";

export const Route = createFileRoute("/auth/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Sign in — Veyra Found" },
      { name: "description", content: "Sign in to Veyra Found to discover and connect with co-founders across India." },
      { property: "og:title", content: "Sign in — Veyra Found" },
      { property: "og:description", content: "Sign in to Veyra Found to discover and connect with co-founders across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(1, "Password is required").max(72);

type Errors = { email?: string; password?: string; form?: string };

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Try again in a few minutes.";
  return message;
}

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "forgot" | "sent">("signin");

  const inputCls = (bad?: string) =>
    `mt-1 w-full rounded-lg border-2 px-3 py-2 text-sm outline-none focus:ring-2 ${
      bad ? "border-red focus:ring-red" : "border-ink/30 focus:ring-indigo"
    }`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    const next: Errors = {};
    if (!em.success) next.email = em.error.issues[0].message;
    if (!pw.success) next.password = pw.error.issues[0].message;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const toastId = toast.loading("Signing you in…");
    const { error } = await supabase.auth.signInWithPassword({ email: em.data!, password });
    setLoading(false);
    if (error) {
      const msg = friendlyAuthError(error.message);
      setErrors({ form: msg, password: msg.includes("incorrect") ? " " : undefined });
      toast.error(msg, {
        id: toastId,
        description: msg.includes("incorrect")
          ? "Double-check your email and password, or reset it."
          : undefined,
      });
      return;
    }
    toast.success("Welcome back", { id: toastId, description: "Taking you to Discover…" });
    router.navigate({ to: "/discover" });
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) {
      setErrors({ email: em.error.issues[0].message });
      toast.error(em.error.issues[0].message);
      return;
    }
    setErrors({});
    setLoading(true);
    const toastId = toast.loading("Sending reset link…");
    const { error } = await supabase.auth.resetPasswordForEmail(em.data, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      const msg = friendlyAuthError(error.message);
      setErrors({ form: msg });
      toast.error(msg, { id: toastId, description: "Please try again in a moment." });
      return;
    }
    toast.success("Reset link sent", { id: toastId, description: `Check ${em.data} for the email.` });
    setMode("sent");
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Animated background layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-100" />
        <div className="animate-drift absolute -left-6 top-[10%] h-36 w-36 border-[3px] border-ink/40 rotate-12 sm:left-[5%] sm:h-48 sm:w-48" />
        <div className="animate-drift-reverse absolute -right-8 top-[16%] h-44 w-44 rounded-full border-[3px] border-ink/40 sm:right-[6%] sm:h-56 sm:w-56" />
        <div className="animate-drift absolute left-[10%] top-[34%] h-14 w-14 bg-orange rotate-45 shadow-brutal-sm sm:h-20 sm:w-20" />
        <div className="animate-drift-reverse absolute right-[8%] top-[40%] h-16 w-16 bg-red shadow-brutal-sm sm:h-24 sm:w-24" />
        <div className="animate-rotate-slow absolute left-[6%] bottom-[18%] h-20 w-20 sm:left-[12%] sm:bottom-[16%]">
          <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-ink/40" />
          <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-ink/40" />
        </div>
        <div className="animate-pulse-slow absolute right-[6%] bottom-[22%] h-24 w-24 rounded-full bg-red blur-2xl sm:right-[10%] sm:h-36 sm:w-36" />
        <div className="animate-drift absolute bottom-[12%] left-[28%] flex gap-4 sm:bottom-[16%]">
          <div className="h-3 w-3 rounded-full bg-ink" />
          <div className="h-3 w-3 rounded-full bg-ink" />
          <div className="h-3 w-3 rounded-full bg-ink" />
        </div>
        <div className="animate-drift-reverse absolute right-[22%] top-[8%] h-5 w-5 border-2 border-ink/50" />
        <div className="animate-drift absolute left-[50%] top-[6%] h-4 w-4 bg-ink/50" />
        <div className="animate-drift absolute left-[75%] top-[60%] h-16 w-4 bg-orange rotate-12 sm:h-24 sm:w-6" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-cream shadow-brutal-sm"><VeyraMark size={20} /></div>
            <span className="text-lg font-black">Veyra Found</span>
          </Link>
        </header>

        <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12 animate-page-in">
          {mode === "signin" && (
            <>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
                <p className="mt-1 text-sm text-muted-text">Sign in to find your co-founder.</p>
              </div>
              <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-white p-6 shadow-card">
                {errors.form && (
                  <div className="flex items-start gap-2 border-2 border-red bg-red/10 px-3 py-2 text-sm font-semibold text-ink">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                    <span>{errors.form}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="text-xs font-semibold text-muted-text">Email</label>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, form: undefined })); }}
                    onBlur={() => { const r = emailSchema.safeParse(email); if (email && !r.success) setErrors((p) => ({ ...p, email: r.error.issues[0].message })); }}
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={loading}
                    className={inputCls(errors.email)}
                  />
                  {errors.email && errors.email.trim() && <p className="mt-1 text-xs font-semibold text-red">{errors.email}</p>}
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-muted-text">Password</label>
                    <button
                      type="button"
                      onClick={() => { setErrors({}); setMode("forgot"); }}
                      className="text-xs font-black uppercase tracking-wide text-indigo underline decoration-2 underline-offset-2"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, form: undefined })); }}
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    disabled={loading}
                    className={inputCls(errors.password)}
                  />
                  {errors.password && errors.password.trim() && <p className="mt-1 text-xs font-semibold text-red">{errors.password}</p>}
                </div>
                <button disabled={loading} aria-busy={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? "Signing in…" : "Sign in"}
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
            </>
          )}

          {mode === "forgot" && (
            <>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Reset password</h1>
                <p className="mt-1 text-sm text-muted-text">We'll email you a link to set a new password.</p>
              </div>
              <form onSubmit={sendReset} noValidate className="space-y-4 rounded-2xl border bg-white p-6 shadow-card">
                {errors.form && (
                  <div className="flex items-start gap-2 border-2 border-red bg-red/10 px-3 py-2 text-sm font-semibold text-ink">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                    <span>{errors.form}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="reset-email" className="text-xs font-semibold text-muted-text">Email</label>
                  <input
                    id="reset-email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={loading}
                    className={inputCls(errors.email)}
                  />
                  {errors.email && <p className="mt-1 text-xs font-semibold text-red">{errors.email}</p>}
                </div>
                <button disabled={loading} aria-busy={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? "Sending link…" : "Send reset link"}
                </button>

                <button type="button" onClick={() => { setErrors({}); setMode("signin"); }} className="w-full text-center text-xs font-black uppercase tracking-wide text-ink/70">
                  Back to sign in
                </button>
              </form>
            </>
          )}

          {mode === "sent" && (
            <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-card text-center">
              <MailCheck className="mx-auto h-10 w-10 text-orange" />
              <h1 className="text-2xl font-black tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-text">
                If an account exists for <span className="font-semibold text-ink">{email}</span>, a password reset link is on its way.
              </p>
              <button onClick={() => setMode("signin")} className="w-full rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo-dark">
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
