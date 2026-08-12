import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { VeyraMark } from "@/components/VeyraLogo";
import { GoogleButton } from "@/components/GoogleButton";
import { EmailAuthBox } from "@/components/EmailAuthBox";
import { accountLabel, getPendingAccountType } from "@/lib/account-types";

/** Shared Google + email auth screen. */
export function AuthScreen({
  title,
  subtitle,
  googleLabel,
  mode,
}: {
  title: string;
  subtitle: string;
  googleLabel?: string;
  mode: "login" | "signup";
}) {
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(getPendingAccountType()), []);

  return (

    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Animated background layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-100" />
        <div className="animate-drift absolute -left-6 top-[10%] h-36 w-36 border-[3px] border-ink/40 rotate-12 sm:left-[5%] sm:h-48 sm:w-48" />
        <div className="animate-drift-reverse absolute -right-8 top-[16%] h-44 w-44 rounded-full border-[3px] border-ink/40 sm:right-[6%] sm:h-56 sm:w-56" />
        <div className="animate-drift absolute left-[10%] top-[34%] h-14 w-14 bg-orange rotate-45 shadow-brutal-sm sm:h-20 sm:w-20" />
        <div className="animate-drift-reverse absolute right-[8%] top-[40%] h-16 w-16 bg-red shadow-brutal-sm sm:h-24 sm:w-24" />
        <div className="animate-pulse-slow absolute right-[6%] bottom-[22%] h-24 w-24 rounded-full bg-red blur-2xl sm:right-[10%] sm:h-36 sm:w-36" />
        <div className="animate-drift absolute bottom-[12%] left-[28%] flex gap-4 sm:bottom-[16%]">
          <div className="h-3 w-3 rounded-full bg-ink" />
          <div className="h-3 w-3 rounded-full bg-ink" />
          <div className="h-3 w-3 rounded-full bg-ink" />
        </div>
        <div className="animate-drift absolute left-[75%] top-[60%] h-16 w-4 bg-orange rotate-12 sm:h-24 sm:w-6" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-cream shadow-brutal-sm">
              <VeyraMark size={20} />
            </div>
            <span className="text-lg font-black">Veyra Found</span>
          </Link>
        </header>

        <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12 animate-page-in">
          <div>
            {mode === "signup" && pending && (
              <div className="mb-3 inline-flex items-center gap-2 border-[3px] border-ink bg-orange px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-brutal-sm">
                Joining as {accountLabel(pending)}
                <Link to="/auth/role" className="underline">Change</Link>
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-text">{subtitle}</p>
          </div>


          <div className="space-y-3">
            <GoogleButton label={googleLabel} />
            <div className="flex items-center gap-3">
              <div className="h-[3px] flex-1 bg-ink/20" />
              <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">or use email</span>
              <div className="h-[3px] flex-1 bg-ink/20" />
            </div>
            <EmailAuthBox mode={mode} />
          </div>

          <div className="flex flex-col items-center gap-3 border-t-[3px] border-ink/20 pt-4">
            <p className="text-xs font-black uppercase tracking-wide text-muted-text">
              {mode === "signup" ? "Already a user?" : "New user?"}
            </p>
            <Link
              to={mode === "signup" ? "/auth/login" : "/auth/signup"}
              className="inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-cream px-6 py-2.5 text-xs font-black uppercase tracking-wide text-ink shadow-brutal-sm box-hover"
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
}
