import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#003366',
};

export const metadata: Metadata = {
  title: "NorthStar Wealth Companion",
  description: "AI-powered Digital Relationship Manager for Retail Investors.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

/**
 * Root Layout Component
 * 
 * Establishes the global HTML shell, applies the Inter font, and mounts
 * the persistent Header and Legal Disclaimer across all routes.
 * 
 * @param children - The Next.js route components.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950 flex flex-col items-center sm:justify-center h-[100dvh] overflow-hidden`}>
        {/* Responsive Container: Full screen on mobile, premium device frame on web */}
        <div className="w-full h-full sm:h-[85dvh] sm:max-w-[420px] bg-black text-gray-100 flex flex-col relative sm:shadow-2xl sm:shadow-brand-navy/20 sm:rounded-[40px] sm:border-[8px] sm:border-gray-900 overflow-hidden shrink-0">
          <Header />
          <main className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
