"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocalAuth } from "@/context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isSignedIn, logout } = useLocalAuth();

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
            ].map(link => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{link.label}</a>
            ))}
            <Link href="/pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Pricing</Link>
            <Link href="/api-docs" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">API</Link>
            <DarkModeToggle />

            {isSignedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md hover:shadow-lg transition-shadow"
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-up">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link href="/pricing" onClick={() => setShowUserMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        My Plan
                      </Link>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25">
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
            {isSignedIn ? (
              <button onClick={() => { logout(); }} className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </button>
            ) : (
              <Link href="/login" className="text-sm font-medium text-violet-600 dark:text-violet-400">Log in</Link>
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
              {!isSignedIn && (
                <Link href="/signup" className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl" onClick={() => setMenuOpen(false)}>Sign up free</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
