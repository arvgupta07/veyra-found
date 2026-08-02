import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Rocket, TrendingUp, Check, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AVATAR_PRESETS } from "@/lib/founder-types";
import { VeyraWordmark } from "@/components/VeyraLogo";
import { GoogleButton } from "@/components/GoogleButton";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

function Signup() {
  const router = useRouter();
  const [role, setRole] = useState<"founder" | "investor">("founder");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, role, avatar_url: avatar },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      // email confirmation disabled on the project — go straight in
      await finishProfile();
      return;
    }
    setStage("verify");
    toast.success("We sent a verification code to " + email);
  }

  async function finishProfile() {
    const { data: me } = await supabase.auth.getUser();
    if (me.user) {
      await supabase.from("profiles").update({ avatar_url: avatar, full_name: fullName }).eq("id", me.user.id);
    }
    router.navigate({ to: role === "investor" ? "/investor-feed" : "/onboarding" });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return toast.error("Enter the 6-digit code from your email");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    toast.success("Email verified");
    await finishProfile();
    setLoading(false);
  }

  async function resend() {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("New code sent");
  }

  if (stage === "verify") {
    return (
      <div className="min-h-screen bg-cream">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2"><VeyraWordmark /></Link>
        </header>
        <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
          <div className="grid h-12 w-12 place-items-center border-[3px] border-ink bg-orange text-white shadow-brutal-sm">
            <Mail className="h-6 w-6" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Verify your email</h1>
            <p className="mt-1 text-sm text-ink/70">
              We sent a 6-digit code to <span className="font-black">{email}</span>. Enter it below to activate your account.
              If you got a confirmation link instead, clicking it works too.
            </p>
          </div>
          <form onSubmit={verify} className="space-y-4 border-[3px] border-ink bg-white p-6 shadow-brutal-sm">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-ink/70">Verification code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                required
                className="mt-1 w-full border-[3px] border-ink bg-white px-3 py-3 text-center text-2xl font-black tracking-[0.4em]"
              />
            </div>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase text-white shadow-brutal-sm box-hover disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify & continue
            </button>
          </form>
          <div className="flex items-center justify-between text-sm">
            <button onClick={() => setStage("form")} className="inline-flex items-center gap-1 font-black text-ink/70">
              <ArrowLeft className="h-4 w-4" /> Change email
            </button>
            <button onClick={resend} disabled={resending} className="font-black text-orange disabled:opacity-60">
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2"><VeyraWordmark /></Link>
      </header>
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-ink/70">Pick a role and an avatar. You can change them later.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            { r: "founder", icon: Rocket, title: "I'm a Founder", body: "Find a co-founder to build with." },
            { r: "investor", icon: TrendingUp, title: "I'm an Investor", body: "Discover confirmed teams." },
          ] as const).map(({ r, icon: Icon, title, body }) => (
            <button key={r} onClick={() => setRole(r)} type="button"
              className={`rounded-2xl border-2 border-ink p-4 text-left shadow-brutal-sm box-hover transition ${role === r ? "bg-orange text-white" : "bg-white"}`}>
              <Icon className="h-6 w-6" />
              <div className="mt-3 font-black">{title}</div>
              <div className="mt-1 text-xs opacity-80">{body}</div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm">
          <div className="text-[10px] font-black uppercase tracking-wider text-orange">Choose your avatar</div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((url) => {
              const on = avatar === url;
              return (
                <button key={url} type="button" onClick={() => setAvatar(url)}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 border-ink transition ${on ? "shadow-brutal -translate-x-0.5 -translate-y-0.5" : "shadow-brutal-sm hover:-translate-y-0.5"}`}>
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {on && <div className="absolute inset-0 grid place-items-center bg-orange/70"><Check className="h-5 w-5 text-white" /></div>}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border-2 border-ink bg-white p-6 shadow-brutal-sm">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-ink/70">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-ink/70">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-ink/70">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          </div>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-2.5 text-sm font-black text-white shadow-brutal-sm box-hover disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
          </button>
        </form>
        <div className="flex items-center gap-3">
          <div className="h-[3px] flex-1 bg-ink/20" />
          <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">or</span>
          <div className="h-[3px] flex-1 bg-ink/20" />
        </div>
        <GoogleButton label="Sign up with Google" />

        <div className="text-center text-sm text-ink/70">
          Already have an account?{" "}<Link to="/auth/login" className="font-black text-orange">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
