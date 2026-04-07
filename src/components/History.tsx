"use client";

import { useState, useEffect } from "react";

interface HistoryEntry {
  name: string;
  date: string;
  size: number;
}

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bgr-history") || "[]");
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("bgr-history");
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button
            onClick={clearHistory}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Clear History
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {history.map((entry, i) => (
            <div
              key={`${entry.name}-${i}`}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(entry.date)} &middot; {formatSize(entry.size)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
