import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cached data still renders instantly on tab switches, but anything
        // older than a few seconds (or invalidated by a mutation) is refetched
        // in the background so the UI never shows stale rows.
        staleTime: 10_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
