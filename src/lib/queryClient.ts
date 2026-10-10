import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * Standard query key factory for users and related domain queries.
 * Keeps query keys consistent, type-safe, and easy to invalidate.
 */
export const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string | number) => [...queryKeys.users.details(), String(id)] as const,
  },
  roles: {
    all: ["roles"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
};

/**
 * Creates a configured QueryClient with production-grade defaults.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 60 seconds before background revalidation
        staleTime: 60 * 1000,
        // Keep inactive cache items for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Avoid aggressive background refetching on window focus in desktop workflow
        refetchOnWindowFocus: false,
        // Retry once on network failure
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Singleton getter for QueryClient:
 * - On server: always return a fresh QueryClient to prevent request cross-contamination
 * - On client: reuse singleton QueryClient across re-renders
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
