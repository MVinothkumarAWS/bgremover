"use client";

import { usePremium } from "@/context/PremiumContext";

interface AdBannerProps {
  slot: string;
  format?: "horizontal" | "rectangle" | "vertical";
  className?: string;
}

export default function AdBanner({ slot, format = "horizontal", className = "" }: AdBannerProps) {
  const { isPro } = usePremium();

  // Don't show ads to Pro users
  if (isPro) return null;

  const sizeClasses = {
    horizontal: "h-24 sm:h-28",
    rectangle: "h-64",
    vertical: "h-[600px] w-[160px]",
  };

  return (
    <div className={`w-full ${sizeClasses[format]} ${className}`}>
      {/*
        Replace this div with actual Google AdSense code:

        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-XXXXXXXXXX"
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true" />

        And add this script to layout.tsx <head>:
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
        />
      */}
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Advertisement</p>
          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">Ad Slot: {slot}</p>
        </div>
      </div>
    </div>
  );
}
