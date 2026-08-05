import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VeyraMark } from "@/components/VeyraLogo";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Reset password — Veyra Found" },
      { name: "description", content: "Choose a new password for your Veyra Found account." },
      { property: "og:title", content: "Reset password — Veyra Found" },
      { property: "og:description", content: "Choose a new password for your Veyra Found account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    router.navigate({ to: "/discover" });
  }

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute inset-0 bg-grid opacity-100" />
      <div className="relative z-10 mx-auto flex max-w-md flex-col gap-6 px-6 py-16 animate-page-in">
        <div className="grid h-10 w-10 place-items-center border-2 border-ink bg-cream shadow-brutal-sm">
          <VeyraMark size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-text">Enter a new password for your account.</p>
        </div>
        <form onSubmit={submit} className="space-y-3 border-[3px] border-ink bg-cream p-4 shadow-brutal-sm">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full border-[3px] border-ink bg-white px-3 py-2 text-sm font-bold text-ink outline-none placeholder:text-ink/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase text-ink shadow-brutal-sm box-hover disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
