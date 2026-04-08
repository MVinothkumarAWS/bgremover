"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { type ReactNode } from "react";

// Clerk is optional - if no keys are set, auth features are disabled but site still works
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!hasClerkKey) {
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}

export { hasClerkKey };
