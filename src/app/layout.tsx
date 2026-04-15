import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthContextProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PremiumProvider } from "@/context/PremiumContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BG Remover - Free Online Image Tools | Remove BG, Compress, Resize & More",
  description:
    "Free online image tools: remove backgrounds, compress, resize, crop, rotate, convert, watermark, upscale, and edit photos. 100% in-browser, no uploads.",
  manifest: "/manifest.json",
  keywords: ["background remover", "image compressor", "resize image", "crop image", "convert to jpg", "watermark image", "meme generator", "photo editor", "upscale image", "free image tools"],
  openGraph: {
    title: "BG Remover - Free Online Image Tools",
    description: "Every image tool you need in one place. Remove backgrounds, compress, resize, crop, convert, watermark and more. 100% free, runs in your browser.",
    url: "https://bgremover.k2techinfo.com",
    siteName: "BG Remover",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BG Remover - Free Online Image Tools",
    description: "Every image tool you need in one place. 100% free, private, runs in your browser.",
  },
  alternates: {
    canonical: "https://bgremover.k2techinfo.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
        <AuthProvider>
          <AuthContextProvider>
            <ThemeProvider>
              <PremiumProvider>{children}</PremiumProvider>
            </ThemeProvider>
          </AuthContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
