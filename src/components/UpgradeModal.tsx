"use client";

import Link from "next/link";
import { useState } from "react";
import { usePremium } from "@/context/PremiumContext";
import { useRazorpay } from "@/hooks/useRazorpay";

export default function UpgradeModal() {
  const { upgradePrompt, dismissUpgrade } = usePremium();
  const { pay } = useRazorpay();
  const [paying, setPaying] = useState(false);

  if (!upgradePrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={dismissUpgrade}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upgrade to Pro
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          <span className="font-semibold text-violet-600">{upgradePrompt}</span> is a Pro feature. Upgrade to unlock all premium features.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Pro includes:</p>
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Unlimited HD downloads
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Batch processing (unlimited images)
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Touch-up editor
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              No watermark on downloads
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              1,000 API requests/day
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              No ads
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={async () => {
              setPaying(true);
              const result = await pay("pro_monthly");
              setPaying(false);
              if (result.success) dismissUpgrade();
            }}
            disabled={paying}
            className={`w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-colors ${paying ? "opacity-60 cursor-wait" : ""}`}
          >
            {paying ? "Processing..." : "Upgrade to Pro - ₹799/mo"}
          </button>
          <Link
            href="/pricing"
            onClick={dismissUpgrade}
            className="w-full py-3 text-violet-600 dark:text-violet-400 text-sm font-medium hover:underline transition-colors text-center"
          >
            View all plans
          </Link>
          <button
            onClick={dismissUpgrade}
            className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
