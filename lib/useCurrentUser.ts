"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { api, type UserProfile } from "@/lib/api-client";
import type { CustomUser } from "@/types/user";

interface CurrentUser {
  user: CustomUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  userName: string;
  refetch: () => Promise<void>;
}

/**
 * Replaces Meteor's reactive `Meteor.user()` / `Meteor.userId()`.
 * Combines the NextAuth session (auth state) with the full profile document
 * fetched from /api/users/me.
 */
export function useCurrentUser(): CurrentUser {
  const { status } = useSession();
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

  return {
    user,
    isLoggedIn,
    isLoading: status === "loading" || isLoading,
    userName: user?.profile?.name || user?.username || "User",
    refetch,
  };
}
