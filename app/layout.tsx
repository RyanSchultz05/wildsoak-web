import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WildSoak - Discover Hot Springs",
  description: "Find and review natural hot springs near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased min-h-screen bg-stone-50 selection:bg-stone-200 selection:text-stone-900">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
