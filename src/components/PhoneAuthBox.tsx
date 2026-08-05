import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Phone (SMS OTP) sign-in — no email anywhere in the flow. */
export function PhoneAuthBox() {
  const router = useRouter();
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [digits, setDigits] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const phone = `+91${digits}`;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(digits)) return toast.error("Enter a valid 10-digit Indian mobile number");
    setBusy(true);
    const id = toast.loading("Sending your code…");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) return toast.error(error.message, { id });
    toast.success("Code sent", { id, description: `We texted a 6-digit code to ${phone}.` });
    setStage("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return toast.error("Enter the code from your SMS");
    setBusy(true);
    const id = toast.loading("Verifying…");
    const { error } = await supabase.auth.verifyOtp({ phone, token: code.trim(), type: "sms" });
    setBusy(false);
    if (error) return toast.error(error.message, { id });
    toast.success("You're in", { id, description: "Taking you to Veyra…" });
    router.navigate({ to: "/discover" });
  }

  async function resend() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("New code sent");
  }

  if (stage === "code") {
    return (
      <form onSubmit={verify} className="space-y-3 border-[3px] border-ink bg-white p-4 shadow-brutal-sm dark:bg-ink/40">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-ink/70 dark:text-cream/70">
          <ShieldCheck className="h-4 w-4 text-orange" /> Enter the code sent to {phone}
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          disabled={busy}
          className="w-full border-[3px] border-ink bg-cream px-3 py-3 text-center text-2xl font-black tracking-[0.4em] outline-none focus:bg-white"
        />
        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase text-ink shadow-brutal-sm box-hover disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Verify & continue
        </button>
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
          <button type="button" onClick={() => setStage("phone")} className="flex items-center gap-1 text-ink/70 dark:text-cream/70">
            <ArrowLeft className="h-3 w-3" /> Change number
          </button>
          <button type="button" onClick={resend} disabled={busy} className="text-orange underline decoration-2 underline-offset-2">
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-3 border-[3px] border-ink bg-white p-4 shadow-brutal-sm dark:bg-ink/40">
      <label className="block text-[10px] font-black uppercase tracking-wider text-ink/70 dark:text-cream/70">
        Continue with phone
      </label>
      <div className="flex items-stretch border-[3px] border-ink bg-cream">
        <span className="grid place-items-center border-r-[3px] border-ink px-3 text-sm font-black">+91</span>
        <input
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98765 43210"
          disabled={busy}
          className="w-full bg-transparent px-3 py-3 text-sm font-bold outline-none"
        />
      </div>
      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-sage py-3 text-sm font-black uppercase text-ink shadow-brutal-sm box-hover disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Send code
      </button>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50 dark:text-cream/50">
        Standard SMS rates may apply.
      </p>
    </form>
  );
}
