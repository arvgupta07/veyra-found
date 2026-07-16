import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { ready, profile } = useRequireAuth();
  if (!ready) return null;
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-black tracking-tight">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
        <p className="mt-2 text-sm text-muted-text">Head to the Deal Feed to see teams raising.</p>
      </div>
    </AppShell>
  );
}
