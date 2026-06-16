import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NorthStar Wealth Companion | Hackathon PoC",
  description: "AI-powered Wealth Management and Financial Resilience Coach.",
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
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 flex flex-col items-center h-[100dvh] overflow-hidden`}>
        {/* Strict 390px Mobile Viewport Container */}
        <div className="w-full max-w-[390px] bg-black text-gray-100 flex-1 relative shadow-2xl flex flex-col border-x border-gray-800 min-h-0">
          <Header />
          <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
