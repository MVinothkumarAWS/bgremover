"use client";

import { useLocalAuth } from "@/context/AuthContext";

export function useAuthSafe() {
  const { isSignedIn, user } = useLocalAuth();
  return { isSignedIn, userId: user?.email || null };
}
