"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";
import type { AuthUser } from "./types";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

/** Current signed-in user, fetched from /api/auth/me and cached by React Query. */
export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiGet<{ user: AuthUser | null }>("/api/auth/me"),
    staleTime: 60_000,
  });
  return { user: data?.user ?? null, isLoading };
}
