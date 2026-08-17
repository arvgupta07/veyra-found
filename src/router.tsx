import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  let queryClient: QueryClient;
  const mutationCache = new MutationCache({
    onSuccess: () => {
      // Individual screens can still update their cache optimistically, while
      // this guarantees every successful app action refreshes visible data.
      void queryClient.invalidateQueries({ refetchType: "active" });
    },
  });

  queryClient = new QueryClient({
    mutationCache,
    defaultOptions: {
      queries: {
        // Keep cached data available during navigation, but always verify it
        // in the background when a screen is revisited.
        staleTime: 0,
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
