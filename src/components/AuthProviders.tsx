import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wand2, Send } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

/** Sign in with Apple (managed by Lovable Cloud). */
export function AppleButton({ label = "Continue with Apple" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Apple sign-in failed");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    setBusy(false);
    if (data.session) router.navigate({ to: "/discover" });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-ink py-3 text-sm font-black uppercase text-cream shadow-brutal-sm box-hover disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
          <path d="M318.7 268c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 8 184.2 8 270.3c0 25.4 4.6 51.7 13.9 78.8 12.4 35.7 57 122.9 103.5 121.5 24.3-.6 41.5-17.3 73.2-17.3 30.7 0 46.6 17.3 73.7 17.3 46.9-.7 87.2-79.9 99-115.7-62.9-29.7-52.6-86.9-52.6-86.9zm-59.2-162c22.7-27 20.6-51.5 19.9-60.3-20 1.2-43.1 13.6-56.3 29-14.5 16.5-23 36.9-21.2 59.6 21.6 1.7 41.4-9.4 57.6-28.3z" />
        </svg>
      )}
      {label}
    </button>
  );
}

/** Passwordless email sign-in (magic link / one-time code). */
export function MagicLinkBox() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) return toast.error("Enter a valid email address");
    setBusy(true);
    const id = toast.loading("Sending your magic link…");
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) return toast.error(error.message, { id });
    toast.success("Magic link sent", { id, description: `Open the email we sent to ${value}.` });
    setSent(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-sage py-3 text-sm font-black uppercase text-ink shadow-brutal-sm box-hover"
      >
        <Wand2 className="h-4 w-4" /> Email me a magic link
      </button>
    );
  }

  if (sent) {
    return (
      <div className="border-[3px] border-ink bg-white p-4 text-sm font-bold shadow-brutal-sm">
        Magic link on its way to <span className="text-orange">{email}</span>. Open it on this device to sign in.
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-2 border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
      <label className="text-[10px] font-black uppercase tracking-wider text-ink/70">Passwordless sign-in</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="you@company.com"
        disabled={busy}
        className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm"
      />
      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-2 text-xs font-black uppercase text-white shadow-brutal-sm disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send link
      </button>
    </form>
  );
}
