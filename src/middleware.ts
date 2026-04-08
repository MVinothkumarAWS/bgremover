import { NextResponse } from "next/server";

export default function middleware() {
  // Clerk middleware disabled until keys are configured
  // When you add CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  // replace this file with:
  //   import { clerkMiddleware } from '@clerk/nextjs/server'
  //   export default clerkMiddleware()
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
