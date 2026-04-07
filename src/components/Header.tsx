"use client";

import Link from "next/link";
import { useState } from "react";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              BG<span className="text-blue-600">Remover</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#gallery" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Gallery</a>
            <Link href="/api-docs" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">API</Link>
            <DarkModeToggle />
            <a href="#upload" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Upload Image
            </a>
          </nav>

          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
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
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>How It Works</a>
              <a href="#gallery" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Gallery</a>
              <Link href="/api-docs" className="text-sm font-medium text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>API</Link>
              <a href="#upload" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg" onClick={() => setMenuOpen(false)}>Upload Image</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
