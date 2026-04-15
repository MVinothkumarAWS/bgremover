"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLocalAuth } from "@/context/AuthContext";
import { useSharedImage } from "@/context/SharedImageContext";
import DarkModeToggle from "./DarkModeToggle";
import { tools, type ToolCategory } from "@/lib/tools";
import { usePathname } from "next/navigation";

/* Top tools shown directly in the navbar */
const PRIMARY_SLUGS = [
  "compress",
  "resize",
  "crop",
  "convert-to-jpg",
  "photo-editor",
];

const primaryTools = PRIMARY_SLUGS.map((s) => tools.find((t) => t.slug === s)!);
const moreTools = tools.filter((t) => !PRIMARY_SLUGS.includes(t.slug));

const moreCategories: { key: ToolCategory; label: string }[] = [
  { key: "edit", label: "Edit" },
  { key: "optimize", label: "Optimize" },
  { key: "convert", label: "Convert" },
  { key: "create", label: "Create" },
  { key: "security", label: "Security" },
  { key: "developer", label: "Developer" },
];

/* All image-accepting tools for the switcher bar */
const SWITCHER_SLUGS = [
  "compress", "resize", "crop", "rotate", "convert-to-jpg", "photo-editor",
  "upscale", "convert-from-jpg", "watermark", "blur-face", "meme-generator",
  "profile-picture", "black-and-white", "collage",
];
const switcherPrimary = SWITCHER_SLUGS.slice(0, 6).map((s) => tools.find((t) => t.slug === s)!);
const switcherMore = SWITCHER_SLUGS.slice(6).map((s) => tools.find((t) => t.slug === s)!);

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showSwitcherMore, setShowSwitcherMore] = useState(false);
  const { user, isSignedIn, logout } = useLocalAuth();
  const { sharedFile, sharedFileName, clearSharedImage } = useSharedImage();
  const moreRef = useRef<HTMLDivElement>(null);
  const switcherMoreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Create thumbnail URL for shared image
  const thumbUrl = useMemo(() => {
    if (!sharedFile) return null;
    return URL.createObjectURL(sharedFile);
  }, [sharedFile]);

  // Cleanup thumbnail URL
  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
      if (switcherMoreRef.current && !switcherMoreRef.current.contains(e.target as Node)) {
        setShowSwitcherMore(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href;
  };

  const hasImage = !!sharedFile;

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "glass shadow-lg shadow-violet-500/5" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {!hasImage && (
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
                BG<span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Remover</span>
              </span>
            )}
          </Link>

          {/* ===== DESKTOP NAV ===== */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-end">
            {hasImage ? (
              /* ---- TOOL SWITCHER MODE (image loaded) ---- */
              <>
                {/* Thumbnail + close */}
                <div className="relative mr-3 flex-shrink-0">
                  {thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbUrl} alt="" className="w-8 h-8 rounded-lg object-cover ring-2 ring-violet-500/30" />
                  )}
                  <button
                    onClick={clearSharedImage}
                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-gray-500 hover:bg-red-500 text-white transition-colors shadow-sm"
                    title="Clear image"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Primary switcher tool links */}
                {switcherPrimary.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={tool.href}
                    className={`px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-colors whitespace-nowrap ${
                      isActive(tool.href)
                        ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
                        : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {tool.name}
                  </Link>
                ))}

                {/* More tools in switcher */}
                <div ref={switcherMoreRef} className="relative">
                  <button
                    onClick={() => setShowSwitcherMore(!showSwitcherMore)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-colors ${
                      showSwitcherMore
                        ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
                        : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    More
                    <svg className={`w-3.5 h-3.5 transition-transform ${showSwitcherMore ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSwitcherMore && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-up py-2">
                      {switcherMore.map((tool) => (
                        <Link
                          key={tool.slug}
                          href={tool.href}
                          onClick={() => setShowSwitcherMore(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 transition-colors group ${
                            isActive(tool.href)
                              ? "bg-violet-50 dark:bg-violet-950/40"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className={`w-7 h-7 bg-gradient-to-br ${tool.color} rounded-md flex items-center justify-center flex-shrink-0`}>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ---- NORMAL MODE (no image) ---- */
              <>
                {primaryTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={tool.href}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-colors ${
                      isActive(tool.href)
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {tool.name}
                  </Link>
                ))}

                {/* More Tools dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-colors ${
                      showMore
                        ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
                        : "text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    More Tools
                    <svg className={`w-3.5 h-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showMore && (
                    <div className="absolute top-full right-0 mt-2 w-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-up p-5 max-h-[75vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {moreCategories.map((cat) => {
                          const catTools = moreTools.filter((t) => t.category.includes(cat.key));
                          if (catTools.length === 0) return null;
                          return (
                            <div key={cat.key}>
                              <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2 px-1">{cat.label}</p>
                              <div className="space-y-0.5">
                                {catTools.map((tool) => (
                                  <Link
                                    key={tool.slug}
                                    href={tool.href}
                                    onClick={() => setShowMore(false)}
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
              </>
            )}

            <DarkModeToggle />

            {isSignedIn ? (
              <div className="relative ml-1">
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
              <div className="flex items-center gap-2 ml-1">
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25">
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* ===== MOBILE HAMBURGER ===== */}
          <div className="flex lg:hidden items-center gap-2">
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

        {/* ===== MOBILE MENU ===== */}
        {menuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 dark:border-gray-800 animate-fade-up">
            <div className="flex flex-col gap-1">
              {/* Shared image indicator */}
              {hasImage && thumbUrl && (
                <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl} alt="" className="w-10 h-10 rounded-lg object-cover ring-2 ring-violet-500/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Image loaded</p>
                    <p className="text-xs text-gray-500 truncate">{sharedFileName}</p>
                  </div>
                  <button onClick={clearSharedImage} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={tool.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(tool.href)
                      ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
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
              <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
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
