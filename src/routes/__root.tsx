import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, redirect,
} from "@tanstack/react-router";
import { getGateStatus } from "@/lib/gate.functions";

import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { useRouterState } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route doesn't exist on Veyra Found.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error("[Root Error Boundary]", error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-lg border px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

const PUBLIC_PATHS = new Set(["/", "/unlock"]);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (PUBLIC_PATHS.has(path) || path.startsWith("/api")) return;
    const { unlocked } = await getGateStatus();
    if (!unlocked) throw redirect({ to: "/unlock" });
  },

  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "9ELjQw_ADyI4viRD_d0qsq2bd1MLISkbgqfkfO9DOGE" },
      { title: "Veyra Found — Connect. Build. Beyond." },
      { name: "description", content: "Veyra Found is India's co-founder matching platform. Verified founders, compatibility science, and a structured path from first message to confirmed co-founder." },
      { property: "og:title", content: "Veyra Found — Connect. Build. Beyond." },
      { property: "og:description", content: "Veyra Found is India's co-founder matching platform. Verified founders, compatibility science, and a structured path from first message to confirmed co-founder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Veyra Found — Connect. Build. Beyond." },
      { name: "twitter:description", content: "Veyra Found is India's co-founder matching platform. Verified founders, compatibility science, and a structured path from first message to confirmed co-founder." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/34ba6fec-5eae-482f-b0cc-b8a8b7ac6ab6" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/34ba6fec-5eae-482f-b0cc-b8a8b7ac6ab6" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Archivo+Black&family=Inter:wght@400;500;600;700;800;900&display=swap" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  
  // Capture hash before Supabase auth strips it from the URL
  const [initialHash] = useState(() => typeof window !== "undefined" ? window.location.hash : "");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") {
        queryClient.invalidateQueries();
      }
      if (event === "SIGNED_IN") {
        const path = window.location.pathname;
        if ((path === "/" && initialHash.includes("access_token")) || path.startsWith("/auth/")) {
          router.navigate({ to: "/discover" });
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient, initialHash]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <QueryClientProvider client={queryClient}>
      <div className="animate-page-in" data-route={pathname}>
        <Outlet />
      </div>
      <Toaster richColors closeButton position="top-right" duration={5000} offset={16} style={{ zIndex: 9999 }} toastOptions={{ style: { border: "3px solid var(--ink)", borderRadius: "6px", fontWeight: 700 } }} />
    </QueryClientProvider>
  );
}
