"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "glass shadow-lg shadow-violet-500/5" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              BG<span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Remover</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "#gallery", label: "Gallery" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{link.label}</a>
            ))}
            <Link href="/pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Pricing</Link>
            <Link href="/api-docs" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">API</Link>
            <DarkModeToggle />

            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            )}
          </nav>

          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
            {isSignedIn ? (
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-violet-600 dark:text-violet-400">Log in</button>
              </SignInButton>
            )}
            <button className="p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800 animate-fade-up">
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>How It Works</a>
              <a href="#gallery" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Gallery</a>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link href="/api-docs" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>API</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
