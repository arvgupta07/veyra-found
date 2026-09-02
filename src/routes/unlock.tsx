import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  component: Unlock,
  head: () => ({
    meta: [
      { title: "Private access — Veyra Found" },
      { name: "description", content: "Private access to the Veyra Found platform preview." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Private access — Veyra Found" },
      { property: "og:description", content: "Private access to the Veyra Found platform preview." },
    ],
  }),
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) {
        await router.invalidate();
        await router.navigate({ to: "/dashboard" });
      } else setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-sage px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm border-[3px] border-ink bg-cream p-6 shadow-brutal">
        <h1 className="text-2xl font-black uppercase text-ink">Private access</h1>
        <p className="mt-2 text-sm font-bold text-ink/70">Enter the access password to open the full platform.</p>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-4 w-full border-[3px] border-ink bg-white px-3 py-2 font-bold text-ink outline-none placeholder:text-ink/40"
        />
        {error && <p className="mt-2 text-xs font-black uppercase text-red">Incorrect password</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-red py-3 text-sm font-black uppercase text-cream box-press disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enter
        </button>
      </form>
    </div>
  );
}
