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
  title: "BG Remover - Remove Image Background Instantly",
  description:
    "Remove image backgrounds automatically in seconds. 100% free, no signup required. Powered by AI.",
  manifest: "/manifest.json",
  keywords: ["background remover", "remove background", "AI background removal", "transparent PNG", "free background remover", "image editor"],
  openGraph: {
    title: "BG Remover - Remove Image Background Instantly",
    description: "Professional AI background removal. 100% free, private, runs in your browser.",
    url: "https://bgremover.k2techinfo.com",
    siteName: "BG Remover",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BG Remover - Remove Image Background Instantly",
    description: "Professional AI background removal. 100% free, private, runs in your browser.",
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
