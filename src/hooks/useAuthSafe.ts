"use client";

// Safe auth hook that works with or without Clerk keys
let useAuthHook: () => { isSignedIn: boolean; userId: string | null | undefined } = () => ({
  isSignedIn: false,
  userId: null,
});

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    useAuthHook = clerk.useAuth;
  }
} catch {
  // Clerk not available
}

export function useAuthSafe() {
  try {
    return useAuthHook();
  } catch {
    return { isSignedIn: false, userId: null };
  }
}
