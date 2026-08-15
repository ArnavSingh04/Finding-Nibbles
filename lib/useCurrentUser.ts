"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { api, type UserProfile } from "@/lib/api-client";
import type { CustomUser } from "@/types/user";

interface CurrentUser {
  user: CustomUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  /** Raw NextAuth status - use to render a stable UI while auth is unknown. */
  status: "loading" | "authenticated" | "unauthenticated";
  userName: string;
  refetch: () => Promise<void>;
}

/**
 * Replaces Meteor's reactive `Meteor.user()` / `Meteor.userId()`.
 * Combines the NextAuth session (auth state + a name available immediately)
 * with the full profile document fetched from /api/users/me.
 */
export function useCurrentUser(): CurrentUser {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (status !== "authenticated") {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const me = await api.users.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // The session already carries the display name (from the JWT), so the name
  // is correct on the first render; the fetched profile then refines it.
  const sessionName = session?.user?.name || (session?.user as any)?.username;

  return {
    user,
    isLoggedIn,
    isLoading: status === "loading" || isLoading,
    status,
    userName: user?.profile?.name || user?.username || sessionName || "User",
    refetch,
  };
}
