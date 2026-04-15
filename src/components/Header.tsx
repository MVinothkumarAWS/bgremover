"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useLocalAuth } from "@/context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";
import { tools, type ToolCategory } from "@/lib/tools";

const navCategories: { key: ToolCategory; label: string; icon: string }[] = [
  { key: "edit", label: "Edit", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { key: "optimize", label: "Optimize", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { key: "convert", label: "Convert", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { key: "create", label: "Create", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { key: "security", label: "Security", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { key: "developer", label: "Developer", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const { user, isSignedIn, logout } = useLocalAuth();
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowTools(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
            {/* Tools dropdown */}
            <div ref={toolsRef} className="relative">
              <button
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                Tools
                <svg className={`w-4 h-4 transition-transform ${showTools ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTools && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[700px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-up p-5 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {navCategories.map((cat) => {
                      const catTools = tools.filter((t) => t.category.includes(cat.key));
                      if (catTools.length === 0) return null;
                      return (
                        <div key={cat.key}>
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">{cat.label}</span>
                          </div>
                          <div className="space-y-0.5">
                            {catTools.map((tool) => (
                              <Link
                                key={tool.slug}
                                href={tool.href}
                                onClick={() => setShowTools(false)}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                              >
                                <div className={`w-7 h-7 bg-gradient-to-br ${tool.color} rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {[
              { href: "/#features", label: "Features" },
              { href: "/#how-it-works", label: "How It Works" },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{link.label}</Link>
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
            <div className="flex flex-col gap-1">
              {navCategories.map((cat) => {
                const catTools = tools.filter((t) => t.category.includes(cat.key));
                if (catTools.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <p className="px-3 py-2 text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider">{cat.label}</p>
                    {catTools.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={tool.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className={`w-7 h-7 bg-gradient-to-br ${tool.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                );
              })}
              <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
                <Link href="/#features" className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Features</Link>
                <Link href="/#how-it-works" className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>How It Works</Link>
                <Link href="/pricing" className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Pricing</Link>
                <Link href="/api-docs" className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>API</Link>
              </div>
              {!isSignedIn && (
                <Link href="/signup" className="mx-3 mt-2 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl" onClick={() => setMenuOpen(false)}>Sign up free</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
